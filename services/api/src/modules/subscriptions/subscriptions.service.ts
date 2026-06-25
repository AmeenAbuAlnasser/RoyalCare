import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  blockedSubscriptionCenterStatuses,
  blockedSubscriptionStatuses,
  expiringSoonSubscriptionStatuses,
  getExpiringSoonDateWindow,
  normalizeSubscriptionLifecycle,
} from '../../common/subscriptions/subscription-lifecycle';
import { parsePagination } from '../../common/utils/pagination';
import type {
  Prisma,
  SubscriptionStatus,
} from '@royalcare/db';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';

const DEFAULT_BILLING_INTERVAL = 'MONTHLY';
const DEFAULT_SUBSCRIPTION_STATUS = 'TRIALING';

type SubscriptionTimelineType =
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_SUSPENDED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_UPDATED'
  | 'RENEWAL_REQUEST_SUBMITTED'
  | 'WHATSAPP_OPENED'
  | 'WHATSAPP_COPIED'
  | 'PHONE_UPDATED'
  | 'PLAN_CHANGED'
  | 'TRIAL_STARTED'
  | 'TRIAL_ENDED';

const subscriptionNotificationTypes = [
  'SUBSCRIPTION_EXPIRING',
  'SUBSCRIPTION_EXPIRED',
  'SUBSCRIPTION_RENEWAL_REQUEST',
  'SUBSCRIPTION_SUSPENDED',
  'SUBSCRIPTION_RENEWED',
  'TRIAL_ENDING_SOON',
  'MISSING_WHATSAPP_PHONE',
] as const;

type SubscriptionTimelineItem = {
  actorName: string | null;
  actorType: 'SYSTEM' | 'SUPER_ADMIN' | 'TENANT' | 'UNKNOWN';
  createdAt: Date;
  description: string;
  id: string;
  metadata: Prisma.JsonValue | null;
  title: string;
  type: SubscriptionTimelineType;
};

const safeSubscriptionSelect = {
  id: true,
  centerId: true,
  planId: true,
  planCode: true,
  planName: true,
  status: true,
  billingInterval: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  gracePeriodEndsAt: true,
  nextRenewalDate: true,
  billingNotes: true,
  notificationLanguage: true,
  notificationPhone: true,
  trialEndsAt: true,
  expiresAt: true,
  cancelAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      type: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
} satisfies Prisma.SubscriptionSelect;

function optionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function buildStatusFilter(status?: string): Prisma.SubscriptionWhereInput {
  const normalizedStatus = status?.trim().toUpperCase();

  if (!normalizedStatus) return {};

  if (normalizedStatus === 'SUSPENDED') {
    return {
      OR: [
        { status: 'SUSPENDED' },
        {
          center: {
            is: { status: { in: ['SUSPENDED', 'ARCHIVED'] } },
          },
        },
      ],
    };
  }

  if (normalizedStatus === 'CANCELLED') {
    return {
      OR: [
        { status: 'CANCELLED' },
        { center: { is: { status: 'CANCELLED' } } },
      ],
    };
  }

  return { status: normalizedStatus as SubscriptionStatus };
}

function metadataRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function metadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function timelineTitle(type: SubscriptionTimelineType) {
  const titles: Record<SubscriptionTimelineType, string> = {
    PHONE_UPDATED: 'Phone updated',
    PLAN_CHANGED: 'Plan changed',
    RENEWAL_REQUEST_SUBMITTED: 'Renewal request submitted',
    SUBSCRIPTION_CANCELLED: 'Subscription cancelled',
    SUBSCRIPTION_CREATED: 'Subscription created',
    SUBSCRIPTION_EXPIRED: 'Subscription expired',
    SUBSCRIPTION_RENEWED: 'Subscription renewed',
    SUBSCRIPTION_SUSPENDED: 'Subscription suspended',
    SUBSCRIPTION_UPDATED: 'Subscription updated',
    TRIAL_ENDED: 'Trial ended',
    TRIAL_STARTED: 'Trial started',
    WHATSAPP_COPIED: 'WhatsApp message copied',
    WHATSAPP_OPENED: 'WhatsApp opened',
  };
  return titles[type];
}

function timelineDescription(
  type: SubscriptionTimelineType,
  metadata: Record<string, unknown>,
) {
  const oldStatus = metadataString(metadata, 'oldStatus');
  const newStatus = metadataString(metadata, 'newStatus');
  const oldPlan = metadataString(metadata, 'oldPlanName');
  const newPlan = metadataString(metadata, 'newPlanName');

  if (oldStatus && newStatus) return `${oldStatus} → ${newStatus}`;
  if (oldPlan && newPlan) return `${oldPlan} → ${newPlan}`;
  if (type === 'WHATSAPP_OPENED' || type === 'WHATSAPP_COPIED') {
    return metadataString(metadata, 'phone') ?? 'Manual WhatsApp action';
  }
  return timelineTitle(type);
}

function classifyAuditTimelineType(
  action: string,
  metadata: Record<string, unknown>,
): SubscriptionTimelineType | null {
  const changedFields = Array.isArray(metadata.changedFields)
    ? metadata.changedFields
    : [];
  const oldStatus = metadataString(metadata, 'oldStatus');
  const newStatus = metadataString(metadata, 'newStatus');

  if (action === 'SUBSCRIPTION_RENEWAL_REQUESTED') {
    return 'RENEWAL_REQUEST_SUBMITTED';
  }

  if (action === 'SUBSCRIPTION_STATUS_CHANGED') {
    if (oldStatus === 'TRIALING' && newStatus && newStatus !== 'TRIALING') {
      return 'TRIAL_ENDED';
    }
    if (newStatus === 'ACTIVE') return 'SUBSCRIPTION_RENEWED';
    if (newStatus === 'SUSPENDED') return 'SUBSCRIPTION_SUSPENDED';
    if (newStatus === 'CANCELLED') return 'SUBSCRIPTION_CANCELLED';
    if (newStatus === 'EXPIRED') return 'SUBSCRIPTION_EXPIRED';
    return 'SUBSCRIPTION_UPDATED';
  }

  if (action === 'SUBSCRIPTION_UPDATED') {
    if (changedFields.includes('notificationPhone')) return 'PHONE_UPDATED';
    if (changedFields.includes('planName')) return 'PLAN_CHANGED';
    if (changedFields.includes('endDate')) return 'SUBSCRIPTION_RENEWED';
    return 'SUBSCRIPTION_UPDATED';
  }

  return null;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(query: ListSubscriptionsQueryDto) {
    const prisma = await this.prisma.getClient();
    const { page, pageSize, skip, take } = parsePagination(query);
    const lifecycleFilter = query.lifecycle?.trim().toUpperCase();

    const statusFilter = lifecycleFilter ? {} : buildStatusFilter(query.status);

    // Support ?expiringSoon=true and ?expired=true filters using the same
    // day-boundary lifecycle definition as the Super Admin dashboard.
    const { endExclusive, start } = getExpiringSoonDateWindow();

    const dateFilter: Prisma.SubscriptionWhereInput = (() => {
      if (!lifecycleFilter && query.expiringSoon === 'true') {
        return {
          center: {
            is: { status: { notIn: blockedSubscriptionCenterStatuses } },
          },
          currentPeriodEnd: { gte: start, lt: endExclusive },
          status: { in: expiringSoonSubscriptionStatuses },
        };
      }
      if (!lifecycleFilter && query.expired === 'true') {
        return {
          center: {
            is: { status: { notIn: blockedSubscriptionCenterStatuses } },
          },
          status: { notIn: blockedSubscriptionStatuses },
          OR: [{ currentPeriodEnd: { lt: start } }, { status: 'EXPIRED' }],
        };
      }
      return {};
    })();

    const missingPhoneFilter: Prisma.SubscriptionWhereInput =
      query.missingPhone === 'true'
        ? {
            AND: [
              {
                OR: [{ notificationPhone: null }, { notificationPhone: '' }],
              },
              {
                OR: [
                  { center: { owner: { is: null } } },
                  {
                    center: {
                      owner: {
                        is: {
                          OR: [{ phone: null }, { phone: '' }],
                        },
                      },
                    },
                  },
                ],
              },
            ],
          }
        : {};

    const where: Prisma.SubscriptionWhereInput = {
      ...statusFilter,
      ...dateFilter,
      ...missingPhoneFilter,
      ...(query.centerId ? { centerId: query.centerId } : {}),
      ...(query.search
        ? {
            OR: [
              { planCode: { contains: query.search, mode: 'insensitive' } },
              { planName: { contains: query.search, mode: 'insensitive' } },
              {
                center: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const allData = await prisma.subscription.findMany({
      where,
      orderBy: { currentPeriodEnd: 'asc' },
      select: safeSubscriptionSelect,
    });
    const normalizedData = allData.map((sub) => ({
      ...sub,
      centerPhone: null,
      ownerPhone: sub.center.owner?.phone ?? null,
      ...normalizeSubscriptionLifecycle(sub),
    }));
    const filteredData = lifecycleFilter
      ? normalizedData.filter((sub) => sub.lifecycle === lifecycleFilter)
      : normalizedData;
    const data = filteredData.slice(skip, skip + take);
    const total = filteredData.length;

    this.ensureSuperAdminNotifications(allData).catch((error) => {
      console.error(
        '[SubscriptionsService] Failed to ensure subscription notifications:',
        error,
      );
    });

    return {
      data,
      pagination: { page, pageSize, total },
    };
  }

  async getById(subscriptionId: string) {
    const prisma = await this.prisma.getClient();
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: safeSubscriptionSelect,
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    return {
      ...subscription,
      centerPhone: null,
      ownerPhone: subscription.center.owner?.phone ?? null,
      ...normalizeSubscriptionLifecycle(subscription),
    };
  }

  private async ensureSuperAdminNotifications(
    subscriptions: Array<
      Prisma.SubscriptionGetPayload<{ select: typeof safeSubscriptionSelect }>
    >,
  ) {
    await Promise.all(
      subscriptions.map(async (sub) => {
        const lifecycle = normalizeSubscriptionLifecycle(sub);
        const centerName = sub.center.name;
        const metadata = {
          centerName,
          endDate: sub.currentPeriodEnd.toISOString(),
          planName: sub.planName,
          status: sub.status,
        };

        if (!sub.notificationPhone && !sub.center.owner?.phone) {
          await this.notificationsService.createSuperAdminSubscriptionNotification(
            {
              centerId: sub.centerId,
              type: 'MISSING_WHATSAPP_PHONE',
              titleEn: 'Missing WhatsApp phone',
              titleAr: 'رقم واتساب غير متوفر',
              titleHe: 'חסר מספר WhatsApp',
              messageEn: `${centerName} does not have a WhatsApp notification phone.`,
              messageAr: `لا يوجد رقم واتساب لإشعارات مركز ${centerName}.`,
              messageHe: `למרכז ${centerName} אין מספר WhatsApp להתראות.`,
              metadata,
            },
          );
        }

        if (sub.status === 'SUSPENDED') {
          await this.notificationsService.createSuperAdminSubscriptionNotification(
            {
              centerId: sub.centerId,
              type: 'SUBSCRIPTION_SUSPENDED',
              titleEn: 'Subscription suspended',
              titleAr: 'تم إيقاف الاشتراك',
              titleHe: 'המינוי הושעה',
              messageEn: `The subscription for ${centerName} is suspended.`,
              messageAr: `اشتراك مركز ${centerName} موقوف.`,
              messageHe: `המינוי של ${centerName} מושעה.`,
              metadata,
            },
          );
          return;
        }

        if (sub.status === 'CANCELLED') {
          return;
        }

        if (lifecycle.isExpired || sub.status === 'EXPIRED') {
          await this.notificationsService.createSuperAdminSubscriptionNotification(
            {
              centerId: sub.centerId,
              type: 'SUBSCRIPTION_EXPIRED',
              titleEn: 'Subscription expired',
              titleAr: 'انتهى الاشتراك',
              titleHe: 'המינוי פג',
              messageEn: `The subscription for ${centerName} has expired.`,
              messageAr: `انتهى اشتراك مركز ${centerName}.`,
              messageHe: `המינוי של ${centerName} פג תוקפו.`,
              metadata: { ...metadata, daysRemaining: lifecycle.daysRemaining },
            },
          );
          return;
        }

        if (
          typeof lifecycle.daysRemaining === 'number' &&
          lifecycle.daysRemaining >= 0 &&
          lifecycle.daysRemaining <= 3 &&
          (sub.status === 'ACTIVE' || sub.status === 'TRIALING')
        ) {
          await this.notificationsService.createSuperAdminSubscriptionNotification(
            {
              centerId: sub.centerId,
              type:
                sub.status === 'TRIALING'
                  ? 'TRIAL_ENDING_SOON'
                  : 'SUBSCRIPTION_EXPIRING',
              titleEn:
                sub.status === 'TRIALING'
                  ? 'Trial ending soon'
                  : 'Subscription expiring soon',
              titleAr:
                sub.status === 'TRIALING'
                  ? 'الفترة التجريبية تنتهي قريباً'
                  : 'الاشتراك ينتهي قريباً',
              titleHe:
                sub.status === 'TRIALING'
                  ? 'תקופת הניסיון עומדת להסתיים'
                  : 'המינוי עומד לפוג בקרוב',
              messageEn: `${centerName} expires in ${lifecycle.daysRemaining} day${lifecycle.daysRemaining === 1 ? '' : 's'}.`,
              messageAr: `ينتهي اشتراك مركز ${centerName} خلال ${lifecycle.daysRemaining} ${lifecycle.daysRemaining === 1 ? 'يوم' : 'أيام'}.`,
              messageHe: `המינוי של ${centerName} יפוג בעוד ${lifecycle.daysRemaining} ${lifecycle.daysRemaining === 1 ? 'יום' : 'ימים'}.`,
              metadata: { ...metadata, daysRemaining: lifecycle.daysRemaining },
            },
          );
        }
      }),
    );
  }

  async getTimeline(subscriptionOrCenterId: string) {
    const prisma = await this.prisma.getClient();
    const subscription =
      (await prisma.subscription.findUnique({
        where: { id: subscriptionOrCenterId },
        select: safeSubscriptionSelect,
      })) ??
      (await prisma.subscription.findFirst({
        where: { centerId: subscriptionOrCenterId },
        orderBy: { createdAt: 'desc' },
        select: safeSubscriptionSelect,
      }));

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    const [auditLogs, notifications] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          centerId: subscription.centerId,
          action: {
            in: [
              'SUBSCRIPTION_UPDATED',
              'SUBSCRIPTION_STATUS_CHANGED',
              'SUBSCRIPTION_RENEWAL_REQUESTED',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { email: true, fullName: true } },
        },
      }),
      prisma.notification.findMany({
        where: {
          centerId: subscription.centerId,
          type: {
            in: [...subscriptionNotificationTypes],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          createdAt: true,
          metadata: true,
          logs: {
            where: { channel: 'WHATSAPP' },
            orderBy: { sentAt: 'desc' },
            select: {
              id: true,
              metadata: true,
              sentAt: true,
            },
          },
        },
      }),
    ]);

    const items: SubscriptionTimelineItem[] = [];

    items.push({
      actorName: null,
      actorType: 'SYSTEM',
      createdAt: subscription.createdAt,
      description: `${subscription.planName} / ${subscription.status}`,
      id: `subscription-created-${subscription.id}`,
      metadata: {
        centerId: subscription.centerId,
        planName: subscription.planName,
        status: subscription.status,
      },
      title: timelineTitle('SUBSCRIPTION_CREATED'),
      type: 'SUBSCRIPTION_CREATED',
    });

    if (subscription.status === 'TRIALING') {
      items.push({
        actorName: null,
        actorType: 'SYSTEM',
        createdAt: subscription.currentPeriodStart,
        description: subscription.planName,
        id: `trial-started-${subscription.id}`,
        metadata: {
          centerId: subscription.centerId,
          planName: subscription.planName,
        },
        title: timelineTitle('TRIAL_STARTED'),
        type: 'TRIAL_STARTED',
      });
    }

    for (const log of auditLogs) {
      const metadata = metadataRecord(log.metadata);
      const type = classifyAuditTimelineType(log.action, metadata);
      if (!type) continue;
      const actorName =
        metadataString(metadata, 'actorName') ??
        log.actor?.fullName ??
        log.actor?.email ??
        metadataString(metadata, 'changedBy') ??
        null;

      items.push({
        actorName,
        actorType: actorName ? 'SUPER_ADMIN' : 'UNKNOWN',
        createdAt: log.createdAt,
        description: timelineDescription(type, metadata),
        id: `audit-${log.id}`,
        metadata: log.metadata,
        title: timelineTitle(type),
        type,
      });
    }

    for (const notification of notifications) {
      const metadata = metadataRecord(notification.metadata);
      const type =
        notification.type === 'SUBSCRIPTION_EXPIRED'
          ? 'SUBSCRIPTION_EXPIRED'
          : notification.type === 'SUBSCRIPTION_RENEWAL_REQUEST'
            ? 'RENEWAL_REQUEST_SUBMITTED'
            : null;

      if (type) {
        items.push({
          actorName: null,
          actorType: type === 'RENEWAL_REQUEST_SUBMITTED' ? 'TENANT' : 'SYSTEM',
          createdAt: notification.createdAt,
          description: timelineDescription(type, metadata),
          id: `notification-${notification.id}`,
          metadata: notification.metadata,
          title: timelineTitle(type),
          type,
        });
      }

      for (const log of notification.logs) {
        const logMetadata = metadataRecord(log.metadata);
        const action = metadataString(logMetadata, 'action');
        const logType =
          action === 'OPENED_WHATSAPP'
            ? 'WHATSAPP_OPENED'
            : action === 'COPIED_MESSAGE'
              ? 'WHATSAPP_COPIED'
              : null;
        if (!logType) continue;
        items.push({
          actorName:
            metadataString(logMetadata, 'actorEmail') ??
            metadataString(logMetadata, 'actorId'),
          actorType: 'SUPER_ADMIN',
          createdAt: log.sentAt,
          description: timelineDescription(logType, logMetadata),
          id: `whatsapp-${log.id}`,
          metadata: log.metadata,
          title: timelineTitle(logType),
          type: logType,
        });
      }
    }

    const seen = new Set<string>();
    const data = items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .filter((item) => {
        const key = `${item.type}:${item.createdAt.toISOString()}:${item.description}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return {
      data,
      subscriptionId: subscription.id,
      centerId: subscription.centerId,
    };
  }

  async getLatestForCenter(centerId: string) {
    const prisma = await this.prisma.getClient();
    const subscription = await prisma.subscription.findFirst({
      where: { centerId },
      orderBy: { createdAt: 'desc' },
      select: safeSubscriptionSelect,
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for center.');
    }

    return {
      ...subscription,
      centerPhone: null,
      ownerPhone: subscription.center.owner?.phone ?? null,
      ...normalizeSubscriptionLifecycle(subscription),
    };
  }

  async logManualWhatsApp(
    subscriptionId: string,
    payload: {
      phone: string;
      message: string;
      action: 'OPENED_WHATSAPP' | 'COPIED_MESSAGE';
      actorId?: string;
    },
  ): Promise<{ logged: boolean }> {
    const prisma = await this.prisma.getClient();
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: safeSubscriptionSelect,
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    let notification = await prisma.notification.findFirst({
      where: {
        centerId: subscription.centerId,
        targetAudience: 'SUPER_ADMIN',
        type: { in: [...subscriptionNotificationTypes] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!notification) {
      const lifecycle = normalizeSubscriptionLifecycle(subscription);
      const type =
        subscription.status === 'SUSPENDED'
          ? 'SUBSCRIPTION_SUSPENDED'
          : lifecycle.isExpired || subscription.status === 'EXPIRED'
            ? 'SUBSCRIPTION_EXPIRED'
            : 'SUBSCRIPTION_EXPIRING';

      notification = await prisma.notification.create({
        data: {
          centerId: subscription.centerId,
          type,
          targetAudience: 'SUPER_ADMIN',
          channel: 'IN_APP',
          status: 'PENDING',
          eventKey: `manual-whatsapp:${subscription.id}`,
          title: {
            en: 'Manual WhatsApp follow-up',
            ar: 'متابعة واتساب يدوية',
            he: 'מעקב WhatsApp ידני',
          },
          body: {
            en: `Manual WhatsApp follow-up for ${subscription.center.name}.`,
            ar: `متابعة واتساب يدوية لمركز ${subscription.center.name}.`,
            he: `מעקב WhatsApp ידני עבור ${subscription.center.name}.`,
          },
          metadata: {
            centerId: subscription.centerId,
            centerName: subscription.center.name,
            planName: subscription.planName,
            status: subscription.status,
            subscriptionId: subscription.id,
          },
        },
        select: { id: true },
      });
    }

    return this.notificationsService.logManualWhatsApp(
      notification.id,
      payload,
    );
  }

  async create(dto: CreateSubscriptionDto) {
    const prisma = await this.prisma.getClient();

    const subscription = await prisma.subscription.create({
      data: {
        centerId: dto.centerId,
        planCode: dto.planCode,
        planName: dto.planName,
        billingInterval: dto.billingInterval ?? DEFAULT_BILLING_INTERVAL,
        status: dto.status ?? DEFAULT_SUBSCRIPTION_STATUS,
        currentPeriodStart: new Date(dto.currentPeriodStart),
        currentPeriodEnd: new Date(dto.currentPeriodEnd),
        trialEndsAt: optionalDate(dto.trialEndsAt),
        expiresAt: optionalDate(dto.expiresAt),
      },
      select: safeSubscriptionSelect,
    });

    return {
      ...subscription,
      centerPhone: null,
      ownerPhone: subscription.center.owner?.phone ?? null,
      ...normalizeSubscriptionLifecycle(subscription),
    };
  }
}
