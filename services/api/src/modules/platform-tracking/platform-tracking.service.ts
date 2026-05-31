import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { PrismaClient } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';

export type PlatformTrackingConfigDto = {
  ga4Id?: string | null;
  gtmId?: string | null;
  metaConversionApiToken?: string | null;
  metaPixelId?: string | null;
  snapPixelId?: string | null;
  testMode?: boolean | null;
  tiktokPixelId?: string | null;
};

const SHORT_FIELD_MAX = 120;

const shortFields = [
  'ga4Id',
  'gtmId',
  'metaPixelId',
  'snapPixelId',
  'tiktokPixelId',
] as const;

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasOwn(object: object, key: string) {
  return Object.hasOwn(object, key);
}

function validateAndClean(dto: PlatformTrackingConfigDto) {
  const errors: Record<string, string> = {};
  const cleaned = {
    ga4Id: null as string | null,
    gtmId: null as string | null,
    metaConversionApiToken: null as string | null,
    metaPixelId: null as string | null,
    snapPixelId: null as string | null,
    testMode: false,
    tiktokPixelId: null as string | null,
  };

  for (const field of shortFields) {
    cleaned[field] = cleanOptionalString(dto[field]);
    if (cleaned[field] && (cleaned[field]?.length ?? 0) > SHORT_FIELD_MAX) {
      errors[field] = `Must be ${SHORT_FIELD_MAX} characters or fewer.`;
    }
  }

  cleaned.metaConversionApiToken = cleanOptionalString(
    dto.metaConversionApiToken,
  );
  if (
    cleaned.metaConversionApiToken &&
    cleaned.metaConversionApiToken.length > 20000
  ) {
    errors.metaConversionApiToken = 'Must be 20000 characters or fewer.';
  }

  if (typeof dto.testMode === 'boolean') {
    cleaned.testMode = dto.testMode;
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({ message: 'Validation failed', errors });
  }

  return cleaned;
}

type ConfigRow = {
  ga4Id: string | null;
  gtmId: string | null;
  metaConversionApiToken: string | null;
  metaPixelId: string | null;
  snapPixelId: string | null;
  testMode: boolean;
  tiktokPixelId: string | null;
  updatedAt: Date;
};

function publicResponse(config: ConfigRow | null) {
  if (!config) {
    return {
      config: {
        ga4Id: null,
        gtmId: null,
        hasMetaConversionApiToken: false,
        metaConversionApiToken: null,
        metaPixelId: null,
        snapPixelId: null,
        testMode: false,
        tiktokPixelId: null,
        updatedAt: null,
      },
    };
  }
  return {
    config: {
      ga4Id: config.ga4Id,
      gtmId: config.gtmId,
      hasMetaConversionApiToken: Boolean(config.metaConversionApiToken),
      metaConversionApiToken: null,
      metaPixelId: config.metaPixelId,
      snapPixelId: config.snapPixelId,
      testMode: config.testMode,
      tiktokPixelId: config.tiktokPixelId,
      updatedAt: config.updatedAt,
    },
  };
}

// Public response for the injector: exposes pixel IDs but never the CAPI token.
function injectorResponse(config: ConfigRow | null) {
  if (!config || config.testMode) {
    return { config: null };
  }
  return {
    config: {
      ga4Id: config.ga4Id,
      gtmId: config.gtmId,
      metaPixelId: config.metaPixelId,
      snapPixelId: config.snapPixelId,
      tiktokPixelId: config.tiktokPixelId,
    },
  };
}

function parseLimit(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function safeLogMessage(message: string) {
  return message.slice(0, 500);
}

async function safeCreatePlatformTrackingLog(
  prisma: PrismaClient,
  data: {
    eventId?: string | null;
    eventName: string;
    message?: string | null;
    provider: 'META_PIXEL' | 'META_CAPI' | 'TIKTOK' | 'GA4' | 'SNAP';
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  },
  logger: Pick<Logger, 'warn'>,
) {
  try {
    await prisma.platformTrackingLog.create({ data });
  } catch {
    logger.warn(
      'Platform tracking log write skipped. The migration may be missing or the log table is temporarily unavailable.',
    );
  }
}

const SELECT_CONFIG = {
  ga4Id: true,
  gtmId: true,
  metaConversionApiToken: true,
  metaPixelId: true,
  snapPixelId: true,
  testMode: true,
  tiktokPixelId: true,
  updatedAt: true,
} as const;

@Injectable()
export class PlatformTrackingService {
  private readonly logger = new Logger(PlatformTrackingService.name);
  private readonly metaGraphVersion =
    process.env.META_GRAPH_API_VERSION?.trim() || 'v20.0';

  // Stable singleton ID used in upsert.
  private static readonly SINGLETON_ID = 'platform-tracking-singleton';

  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    const prisma = await this.prisma.getClient();
    const config = await prisma.platformTrackingConfig.findFirst({
      select: SELECT_CONFIG,
    });
    return publicResponse(config);
  }

  async getPublicConfig() {
    const prisma = await this.prisma.getClient();
    const config = await prisma.platformTrackingConfig.findFirst({
      select: SELECT_CONFIG,
    });
    return injectorResponse(config);
  }

  async updateConfig(dto: PlatformTrackingConfigDto) {
    const data = validateAndClean(dto);
    const shouldUpdateToken = hasOwn(dto, 'metaConversionApiToken');
    const nonTokenData = {
      ga4Id: data.ga4Id,
      gtmId: data.gtmId,
      metaPixelId: data.metaPixelId,
      snapPixelId: data.snapPixelId,
      testMode: data.testMode,
      tiktokPixelId: data.tiktokPixelId,
    };
    const writeData = shouldUpdateToken ? data : nonTokenData;

    const prisma = await this.prisma.getClient();
    const existing = await prisma.platformTrackingConfig.findFirst({
      select: { id: true },
    });

    let config: ConfigRow;
    if (existing) {
      config = await prisma.platformTrackingConfig.update({
        where: { id: existing.id },
        data: writeData,
        select: SELECT_CONFIG,
      });
    } else {
      config = await prisma.platformTrackingConfig.create({
        data: data,
        select: SELECT_CONFIG,
      });
    }

    return publicResponse(config);
  }

  async getLogs(limit?: string) {
    const prisma = await this.prisma.getClient();
    try {
      const logs = await prisma.platformTrackingLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: parseLimit(limit),
        select: {
          createdAt: true,
          eventId: true,
          eventName: true,
          id: true,
          message: true,
          provider: true,
          status: true,
        },
      });
      return { logs };
    } catch {
      this.logger.warn(
        'Platform tracking logs unavailable. The migration may not be applied.',
      );
      return { logs: [], unavailable: true };
    }
  }

  async testMetaCapi() {
    const prisma = await this.prisma.getClient();
    const config = await prisma.platformTrackingConfig.findFirst({
      select: { metaConversionApiToken: true, metaPixelId: true },
    });

    const accessToken = cleanOptionalString(config?.metaConversionApiToken);
    const pixelId = cleanOptionalString(config?.metaPixelId);
    const eventId = `platform_test_${Date.now()}`;

    if (!accessToken || !pixelId) {
      await safeCreatePlatformTrackingLog(
        prisma,
        {
          eventId,
          eventName: 'TestPlatformEvent',
          message: 'Meta Pixel ID or CAPI token is not configured.',
          provider: 'META_CAPI',
          status: 'SKIPPED',
        },
        this.logger,
      );
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          metaConversionApiToken:
            'Meta Pixel ID and Meta Conversion API Token are required.',
        },
      });
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${encodeURIComponent(this.metaGraphVersion)}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
        {
          body: JSON.stringify({
            data: [
              {
                action_source: 'website',
                custom_data: { source: 'platform_tracking_settings_test' },
                event_id: eventId,
                event_name: 'TestPlatformEvent',
                event_time: Math.floor(Date.now() / 1000),
                user_data: {},
              },
            ],
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );

      if (!response.ok) {
        await safeCreatePlatformTrackingLog(
          prisma,
          {
            eventId,
            eventName: 'TestPlatformEvent',
            message: safeLogMessage(
              `Meta CAPI returned HTTP ${response.status}.`,
            ),
            provider: 'META_CAPI',
            status: 'FAILED',
          },
          this.logger,
        );
        this.logger.warn(
          `Platform Meta CAPI test failed, status=${response.status}`,
        );
        throw new BadRequestException({
          message: 'Meta CAPI test failed',
          errors: { metaConversionApiToken: 'Meta CAPI test failed.' },
        });
      }

      await safeCreatePlatformTrackingLog(
        prisma,
        {
          eventId,
          eventName: 'TestPlatformEvent',
          message: 'Meta CAPI test event sent.',
          provider: 'META_CAPI',
          status: 'SUCCESS',
        },
        this.logger,
      );
      this.logger.log('Platform Meta CAPI test sent.');
      return { message: 'Meta CAPI test sent.', success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      await safeCreatePlatformTrackingLog(
        prisma,
        {
          eventId,
          eventName: 'TestPlatformEvent',
          message: safeLogMessage(`Meta CAPI test failed: ${message}`),
          provider: 'META_CAPI',
          status: 'FAILED',
        },
        this.logger,
      );
      this.logger.warn(`Platform Meta CAPI test failed: ${message}`);
      throw new BadRequestException({
        message: 'Meta CAPI test failed',
        errors: { metaConversionApiToken: 'Meta CAPI test failed.' },
      });
    }
  }
}
