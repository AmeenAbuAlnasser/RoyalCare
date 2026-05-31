import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { safeCreateMarketingTrackingLog } from '../../common/marketing/marketing-tracking-log';
import { hasTenantPermission } from '../../common/permissions/tenant-permissions';

export type TenantMarketingSettingsDto = {
  customBodyScript?: string | null;
  customHeadScript?: string | null;
  ga4Id?: string | null;
  gtmId?: string | null;
  metaConversionApiToken?: string | null;
  metaPixelId?: string | null;
  snapPixelId?: string | null;
  tiktokPixelId?: string | null;
};

type CleanMarketingSettings = Required<TenantMarketingSettingsDto>;

const SHORT_FIELD_MAX = 120;
const SCRIPT_FIELD_MAX = 20000;

const shortFields = [
  'ga4Id',
  'gtmId',
  'metaPixelId',
  'snapPixelId',
  'tiktokPixelId',
] as const;

const tokenFields = ['metaConversionApiToken'] as const;
const scriptFields = ['customBodyScript', 'customHeadScript'] as const;

function forbidden(permission: string) {
  return new ForbiddenException({
    message: 'Permission denied',
    errors: { permission: `Missing permission: ${permission}` },
  });
}

function cleanOptionalString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasOwn(object: object, key: string) {
  return Object.hasOwn(object, key);
}

function validateAndClean(dto: TenantMarketingSettingsDto) {
  const errors: Record<string, string> = {};
  const cleaned: CleanMarketingSettings = {
    customBodyScript: null,
    customHeadScript: null,
    ga4Id: null,
    gtmId: null,
    metaConversionApiToken: null,
    metaPixelId: null,
    snapPixelId: null,
    tiktokPixelId: null,
  };

  for (const field of shortFields) {
    cleaned[field] = cleanOptionalString(dto[field]);
    if (cleaned[field] && cleaned[field].length > SHORT_FIELD_MAX) {
      errors[field] = `Must be ${SHORT_FIELD_MAX} characters or fewer.`;
    }
  }

  for (const field of tokenFields) {
    cleaned[field] = cleanOptionalString(dto[field]);
    if (cleaned[field] && cleaned[field].length > SCRIPT_FIELD_MAX) {
      errors[field] = `Must be ${SCRIPT_FIELD_MAX} characters or fewer.`;
    }
  }

  for (const field of scriptFields) {
    cleaned[field] = cleanOptionalString(dto[field]);
    if (cleaned[field] && cleaned[field].length > SCRIPT_FIELD_MAX) {
      errors[field] = `Must be ${SCRIPT_FIELD_MAX} characters or fewer.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({ message: 'Validation failed', errors });
  }

  return cleaned;
}

function publicSettingsResponse(
  settings: (CleanMarketingSettings & { updatedAt: Date | null }) | null,
) {
  return {
    settings: settings
      ? {
          customBodyScript: settings.customBodyScript,
          customHeadScript: settings.customHeadScript,
          ga4Id: settings.ga4Id,
          gtmId: settings.gtmId,
          hasMetaConversionApiToken: Boolean(settings.metaConversionApiToken),
          metaConversionApiToken: null,
          metaPixelId: settings.metaPixelId,
          snapPixelId: settings.snapPixelId,
          tiktokPixelId: settings.tiktokPixelId,
          updatedAt: settings.updatedAt,
        }
      : {
          customBodyScript: null,
          customHeadScript: null,
          ga4Id: null,
          gtmId: null,
          hasMetaConversionApiToken: false,
          metaConversionApiToken: null,
          metaPixelId: null,
          snapPixelId: null,
          tiktokPixelId: null,
          updatedAt: null,
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

@Injectable()
export class TenantMarketingSettingsService {
  private readonly logger = new Logger(TenantMarketingSettingsService.name);
  private readonly metaGraphVersion =
    process.env.META_GRAPH_API_VERSION?.trim() || 'v20.0';

  constructor(private readonly prisma: PrismaService) {}

  async getSettings(centerId: string, permissions: string[]) {
    this.requirePermission(permissions);
    const prisma = await this.prisma.getClient();
    const settings = await prisma.tenantMarketingSettings.findUnique({
      where: { centerId },
      select: {
        customBodyScript: true,
        customHeadScript: true,
        ga4Id: true,
        gtmId: true,
        metaConversionApiToken: true,
        metaPixelId: true,
        snapPixelId: true,
        tiktokPixelId: true,
        updatedAt: true,
      },
    });

    return publicSettingsResponse(settings);
  }

  async updateSettings(
    centerId: string,
    permissions: string[],
    dto: TenantMarketingSettingsDto,
  ) {
    this.requirePermission(permissions);
    const data = validateAndClean(dto);
    const shouldUpdateToken = hasOwn(dto, 'metaConversionApiToken');
    const nonTokenData = {
      customBodyScript: data.customBodyScript,
      customHeadScript: data.customHeadScript,
      ga4Id: data.ga4Id,
      gtmId: data.gtmId,
      metaPixelId: data.metaPixelId,
      snapPixelId: data.snapPixelId,
      tiktokPixelId: data.tiktokPixelId,
    };
    const writeData = shouldUpdateToken ? data : nonTokenData;
    const prisma = await this.prisma.getClient();
    const settings = await prisma.tenantMarketingSettings.upsert({
      where: { centerId },
      create: { centerId, ...data },
      update: writeData,
      select: {
        customBodyScript: true,
        customHeadScript: true,
        ga4Id: true,
        gtmId: true,
        metaConversionApiToken: true,
        metaPixelId: true,
        snapPixelId: true,
        tiktokPixelId: true,
        updatedAt: true,
      },
    });

    return publicSettingsResponse(settings);
  }

  async getLogs(centerId: string, permissions: string[], limit?: string) {
    this.requirePermission(permissions);
    const prisma = await this.prisma.getClient();
    try {
      const logs = await prisma.marketingTrackingLog.findMany({
        where: { centerId },
        orderBy: { createdAt: 'desc' },
        take: parseLimit(limit),
        select: {
          bookingRequestId: true,
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
        `Marketing tracking logs unavailable for centerId=${centerId}. The migration may not be applied.`,
      );
      return {
        logs: [],
        unavailable: true,
      };
    }
  }

  async testMetaCapi(centerId: string, permissions: string[]) {
    this.requirePermission(permissions);
    const prisma = await this.prisma.getClient();
    const settings = await prisma.tenantMarketingSettings.findUnique({
      where: { centerId },
      select: {
        metaConversionApiToken: true,
        metaPixelId: true,
      },
    });

    const accessToken = cleanOptionalString(settings?.metaConversionApiToken);
    const pixelId = cleanOptionalString(settings?.metaPixelId);
    const eventId = `test_${centerId}_${Date.now()}`;
    if (!accessToken || !pixelId) {
      await safeCreateMarketingTrackingLog(
        prisma,
        {
          centerId,
          eventId,
          eventName: 'TestMarketingEvent',
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
                custom_data: {
                  centerId,
                  source: 'tenant_marketing_settings_test',
                },
                event_id: eventId,
                event_name: 'TestMarketingEvent',
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
        await safeCreateMarketingTrackingLog(
          prisma,
          {
            centerId,
            eventId,
            eventName: 'TestMarketingEvent',
            message: safeLogMessage(
              `Meta CAPI returned HTTP ${response.status}.`,
            ),
            provider: 'META_CAPI',
            status: 'FAILED',
          },
          this.logger,
        );
        this.logger.warn(
          `Meta CAPI test failed for centerId=${centerId} status=${response.status}`,
        );
        throw new BadRequestException({
          message: 'Meta CAPI test failed',
          errors: {
            metaConversionApiToken: 'Meta CAPI test failed.',
          },
        });
      }

      await safeCreateMarketingTrackingLog(
        prisma,
        {
          centerId,
          eventId,
          eventName: 'TestMarketingEvent',
          message: 'Meta CAPI test event sent.',
          provider: 'META_CAPI',
          status: 'SUCCESS',
        },
        this.logger,
      );
      this.logger.log(`Meta CAPI test sent for centerId=${centerId}`);
      return { message: 'Meta CAPI test sent.', success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      await safeCreateMarketingTrackingLog(
        prisma,
        {
          centerId,
          eventId,
          eventName: 'TestMarketingEvent',
          message: safeLogMessage(`Meta CAPI test failed: ${message}`),
          provider: 'META_CAPI',
          status: 'FAILED',
        },
        this.logger,
      );
      this.logger.warn(
        `Meta CAPI test failed for centerId=${centerId}: ${message}`,
      );
      throw new BadRequestException({
        message: 'Meta CAPI test failed',
        errors: {
          metaConversionApiToken: 'Meta CAPI test failed.',
        },
      });
    }
  }

  private requirePermission(permissions: string[]) {
    if (!hasTenantPermission(permissions, 'settings:view')) {
      throw forbidden('settings:view');
    }
  }
}
