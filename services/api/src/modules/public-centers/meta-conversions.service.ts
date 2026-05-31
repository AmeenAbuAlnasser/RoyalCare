import { Logger, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../common/database/prisma.service';
import { safeCreateMarketingTrackingLog } from '../../common/marketing/marketing-tracking-log';

export type MetaCompleteBookingEvent = {
  bookingRequestId: string;
  centerId: string;
  centerSlug: string;
  currency?: string | null;
  eventSourceUrl?: string | null;
  fullName?: string | null;
  ipAddress?: string | null;
  phone?: string | null;
  serviceId?: string | null;
  trackingEventId?: string | null;
  userAgent?: string | null;
  value?: string | number | null;
};

type MetaUserData = {
  client_ip_address?: string;
  client_user_agent?: string;
  fn?: string;
  ln?: string;
  ph?: string;
};

function clean(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function hashValue(value?: string | null) {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return undefined;
  return createHash('sha256').update(normalized).digest('hex');
}

function splitName(fullName?: string | null) {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

function toNumber(value?: string | number | null) {
  if (value == null) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function safeMessage(message: string) {
  return message.slice(0, 500);
}

@Injectable()
export class MetaConversionsService {
  private readonly logger = new Logger(MetaConversionsService.name);
  private readonly graphVersion =
    process.env.META_GRAPH_API_VERSION?.trim() || 'v20.0';

  constructor(private readonly prisma: PrismaService) {}

  async trackCompleteBooking(event: MetaCompleteBookingEvent) {
    try {
      const prisma = await this.prisma.getClient();
      const settings = await prisma.tenantMarketingSettings.findUnique({
        where: { centerId: event.centerId },
        select: {
          metaConversionApiToken: true,
          metaPixelId: true,
        },
      });

      const accessToken = clean(settings?.metaConversionApiToken);
      const pixelId = clean(settings?.metaPixelId);
      const eventId =
        clean(event.trackingEventId) || `booking_${event.bookingRequestId}`;
      if (!accessToken || !pixelId) {
        await safeCreateMarketingTrackingLog(
          prisma,
          {
            bookingRequestId: event.bookingRequestId,
            centerId: event.centerId,
            eventId,
            eventName: 'CompleteBooking',
            message: 'Meta Pixel ID or CAPI token is not configured.',
            provider: 'META_CAPI',
            status: 'SKIPPED',
          },
          this.logger,
        );
        return;
      }

      const { firstName, lastName } = splitName(event.fullName);
      const userData: MetaUserData = {};
      const hashedPhone = hashValue(event.phone);
      const hashedFirstName = hashValue(firstName);
      const hashedLastName = hashValue(lastName);

      if (hashedPhone) userData.ph = hashedPhone;
      if (hashedFirstName) userData.fn = hashedFirstName;
      if (hashedLastName) userData.ln = hashedLastName;
      if (clean(event.userAgent))
        userData.client_user_agent = clean(event.userAgent);
      if (clean(event.ipAddress))
        userData.client_ip_address = clean(event.ipAddress);

      const value = toNumber(event.value);
      const payload = {
        data: [
          {
            action_source: 'website',
            custom_data: {
              bookingRequestId: event.bookingRequestId,
              centerId: event.centerId,
              centerSlug: event.centerSlug,
              currency: clean(event.currency) || undefined,
              serviceId: event.serviceId ?? undefined,
              value,
            },
            event_id: eventId,
            event_name: 'CompleteBooking',
            event_source_url: clean(event.eventSourceUrl) || undefined,
            event_time: Math.floor(Date.now() / 1000),
            user_data: userData,
          },
        ],
      };

      const response = await fetch(
        `https://graph.facebook.com/${encodeURIComponent(this.graphVersion)}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
        {
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );

      if (!response.ok) {
        await safeCreateMarketingTrackingLog(
          prisma,
          {
            bookingRequestId: event.bookingRequestId,
            centerId: event.centerId,
            eventId,
            eventName: 'CompleteBooking',
            message: safeMessage(`Meta CAPI returned HTTP ${response.status}.`),
            provider: 'META_CAPI',
            status: 'FAILED',
          },
          this.logger,
        );
        this.logger.warn(
          `Meta CAPI CompleteBooking failed for bookingRequestId=${event.bookingRequestId} status=${response.status}`,
        );
        return;
      }

      await safeCreateMarketingTrackingLog(
        prisma,
        {
          bookingRequestId: event.bookingRequestId,
          centerId: event.centerId,
          eventId,
          eventName: 'CompleteBooking',
          message: 'Meta CAPI CompleteBooking sent.',
          provider: 'META_CAPI',
          status: 'SUCCESS',
        },
        this.logger,
      );
      this.logger.log(
        `Meta CAPI CompleteBooking sent for bookingRequestId=${event.bookingRequestId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      try {
        const prisma = await this.prisma.getClient();
        await safeCreateMarketingTrackingLog(
          prisma,
          {
            bookingRequestId: event.bookingRequestId,
            centerId: event.centerId,
            eventId:
              clean(event.trackingEventId) ||
              `booking_${event.bookingRequestId}`,
            eventName: 'CompleteBooking',
            message: safeMessage(`Meta CAPI failed: ${message}`),
            provider: 'META_CAPI',
            status: 'FAILED',
          },
          this.logger,
        );
      } catch {
        // Logging failures must not affect booking creation.
      }
      this.logger.warn(
        `Meta CAPI CompleteBooking failed for bookingRequestId=${event.bookingRequestId}: ${message}`,
      );
    }
  }
}
