import { ForbiddenException, Injectable } from '@nestjs/common';
import { hasTenantPermission } from '../../common/permissions/tenant-permissions';
import { PrismaService } from '../../common/database/prisma.service';

// Valid event types and traffic sources — keep in sync with schema enums.
const VALID_EVENT_TYPES = new Set([
  'VIEW_CENTER_WEBSITE',
  'VIEW_BOOKING_PAGE',
  'CLICK_BOOK_NOW',
  'CLICK_WHATSAPP',
  'CLICK_PHONE',
  'CLICK_MAP',
  'CLICK_MESSENGER',
  'VIEW_GALLERY',
  'VIEW_REVIEWS',
  'VIEW_BEFORE_AFTER',
  'VIEW_OFFERS',
  'SELECT_OFFER',
  'COMPLETE_BOOKING',
  'VIEW_CONTACT',
  'VIEW_SERVICES',
  'SELECT_SERVICE',
]);

const VALID_SOURCES = new Set([
  'FACEBOOK',
  'INSTAGRAM',
  'TIKTOK',
  'GOOGLE',
  'DIRECT',
  'UNKNOWN',
]);

export type TrackEventDto = {
  eventType: string;
  source?: string;
  sessionId?: string;
  page?: string;
  extraData?: Record<string, unknown>;
};

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function last30DaysRange(): { from: Date; days: string[] } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);

  const days: string[] = [];
  const cursor = new Date(from);
  while (cursor <= now) {
    days.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return { from, days };
}

@Injectable()
export class CenterAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(slug: string, dto: TrackEventDto): Promise<{ ok: boolean }> {
    const db = await this.prisma.getClient();

    // Validate event type.
    const eventType =
      typeof dto.eventType === 'string'
        ? dto.eventType.trim().toUpperCase()
        : '';
    if (!VALID_EVENT_TYPES.has(eventType)) return { ok: false };

    // Resolve center by slug.
    const center = await db.center.findFirst({
      where: { slug, publicVisible: true },
      select: { id: true },
    });
    if (!center) return { ok: false };

    const source = (
      typeof dto.source === 'string' &&
      VALID_SOURCES.has(dto.source.toUpperCase())
        ? dto.source.toUpperCase()
        : 'UNKNOWN'
    ) as 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'GOOGLE' | 'DIRECT' | 'UNKNOWN';

    const sessionId =
      typeof dto.sessionId === 'string' ? dto.sessionId.slice(0, 100) : null;

    const page = typeof dto.page === 'string' ? dto.page.slice(0, 200) : null;

    const extraData =
      dto.extraData && typeof dto.extraData === 'object' ? dto.extraData : null;

    await db.centerWebsiteEvent.create({
      data: {
        centerId: center.id,
        eventType: eventType as never,
        source,
        sessionId,
        page,
        extraData: (extraData ?? undefined) as never,
      },
    });

    return { ok: true };
  }

  async getDashboard(centerId: string, permissions: string[]) {
    if (!hasTenantPermission(permissions, 'reports:view')) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { permission: 'Missing permission: reports:view' },
      });
    }

    const db = await this.prisma.getClient();
    const { from, days } = last30DaysRange();

    const baseWhere = { centerId, occurredAt: { gte: from } };

    // ── Metric cards ──────────────────────────────────────────────────────────
    const [
      visitorSessions,
      bookingPageViews,
      bookNowClicks,
      whatsappClicks,
      phoneClicks,
      contactViews,
      galleryViews,
      reviewsViews,
      beforeAfterViews,
      completedBookings,
    ] = await Promise.all([
      db.centerWebsiteEvent.groupBy({
        by: ['sessionId'],
        where: { ...baseWhere, eventType: 'VIEW_CENTER_WEBSITE' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'VIEW_BOOKING_PAGE' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'CLICK_BOOK_NOW' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'CLICK_WHATSAPP' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'CLICK_PHONE' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'VIEW_CONTACT' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'VIEW_GALLERY' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'VIEW_REVIEWS' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'VIEW_BEFORE_AFTER' },
      }),
      db.centerWebsiteEvent.count({
        where: { ...baseWhere, eventType: 'COMPLETE_BOOKING' },
      }),
    ]);

    const visitors = visitorSessions.filter(
      (r) => r.sessionId !== null && r.sessionId !== undefined,
    ).length;

    const conversionRate =
      visitors > 0 ? ((completedBookings / visitors) * 100).toFixed(2) : '0.00';

    // ── Traffic sources ───────────────────────────────────────────────────────
    const trafficSourceRows = await db.centerWebsiteEvent.groupBy({
      by: ['source'],
      where: { ...baseWhere, eventType: 'VIEW_CENTER_WEBSITE' },
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
    });

    const totalSourceEvents = trafficSourceRows.reduce(
      (sum, r) => sum + r._count.source,
      0,
    );

    const trafficSources = trafficSourceRows.map((r) => ({
      source: r.source,
      count: r._count.source,
      percent:
        totalSourceEvents > 0
          ? Math.round((r._count.source / totalSourceEvents) * 100)
          : 0,
    }));

    // ── Daily charts — fetch all events once, group in memory ─────────────────
    const allEvents = await db.centerWebsiteEvent.findMany({
      where: baseWhere,
      select: {
        eventType: true,
        sessionId: true,
        page: true,
        extraData: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: 'asc' },
    });

    // Daily unique visitors (distinct sessions per day for VIEW_CENTER_WEBSITE).
    const dailySessionMap = new Map<string, Set<string>>();
    for (const day of days) dailySessionMap.set(day, new Set());

    // Daily booking page views.
    const dailyBookingMap = new Map<string, number>();
    for (const day of days) dailyBookingMap.set(day, 0);

    // Top pages (all events with a page field).
    const pageCountMap = new Map<string, number>();

    // Top services (SELECT_SERVICE events with extraData.serviceName).
    const serviceCountMap = new Map<string, number>();

    for (const ev of allEvents) {
      const day = formatDate(ev.occurredAt);

      if (ev.eventType === 'VIEW_CENTER_WEBSITE') {
        const sessionBucket = dailySessionMap.get(day);
        if (sessionBucket && ev.sessionId) {
          sessionBucket.add(ev.sessionId);
        }
      }

      if (ev.eventType === 'VIEW_BOOKING_PAGE') {
        dailyBookingMap.set(day, (dailyBookingMap.get(day) ?? 0) + 1);
      }

      if (ev.page) {
        pageCountMap.set(ev.page, (pageCountMap.get(ev.page) ?? 0) + 1);
      }

      if (ev.eventType === 'SELECT_SERVICE' && ev.extraData) {
        const extra = ev.extraData as Record<string, unknown>;
        const name =
          typeof extra.serviceName === 'string' ? extra.serviceName : null;
        if (name) {
          serviceCountMap.set(name, (serviceCountMap.get(name) ?? 0) + 1);
        }
      }
    }

    const dailyVisitors = days.map((date) => ({
      date,
      count: dailySessionMap.get(date)?.size ?? 0,
    }));

    const bookingAttempts = days.map((date) => ({
      date,
      count: dailyBookingMap.get(date) ?? 0,
    }));

    const topPages = [...pageCountMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([page, count]) => ({ page, count }));

    const topServices = [...serviceCountMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return {
      period: 'last30days',
      cards: {
        visitors,
        bookingPageViews,
        bookNowClicks,
        whatsappClicks,
        phoneClicks,
        contactPageViews: contactViews,
        galleryViews,
        reviewsViews,
        beforeAfterViews,
        completedBookings,
        conversionRate,
      },
      trafficSources,
      charts: {
        dailyVisitors,
        bookingAttempts,
        topPages,
        topServices,
      },
    };
  }
}
