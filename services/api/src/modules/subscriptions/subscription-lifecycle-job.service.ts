import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type {
  NotificationTargetAudience,
  Prisma,
} from '@royalcare/db';
import {
  addDays,
  normalizeSubscriptionLifecycle,
  startOfDay,
} from '../../common/subscriptions/subscription-lifecycle';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../common/database/prisma.service';

type LifecycleJobResult = {
  auditLogsCreated: number;
  duplicateNotificationsSkipped: number;
  notificationsCreated: number;
  scanned: number;
  skippedSuspended: number;
  updatedExpired: number;
};

const EXPIRING_NOTIFICATION_DAYS = [7, 3, 1] as const;
const ACTIVE_LIFECYCLE_STATUSES = ['ACTIVE', 'TRIALING'] as const;
type ActiveLifecycleStatus = (typeof ACTIVE_LIFECYCLE_STATUSES)[number];

function isActiveLifecycleStatus(
  status: string,
): status is ActiveLifecycleStatus {
  return ACTIVE_LIFECYCLE_STATUSES.includes(status as ActiveLifecycleStatus);
}

@Injectable()
export class SubscriptionLifecycleJobService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SubscriptionLifecycleJobService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly prismaService: PrismaService,
  ) {}

  onModuleInit() {
    this.scheduleNextRun();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async runNow(triggeredBy = 'manual'): Promise<LifecycleJobResult> {
    if (this.running) {
      return {
        auditLogsCreated: 0,
        duplicateNotificationsSkipped: 0,
        notificationsCreated: 0,
        scanned: 0,
        skippedSuspended: 0,
        updatedExpired: 0,
      };
    }

    this.running = true;
    const prisma = await this.prismaService.getClient();
    const jobRun = await prisma.subscriptionLifecycleJobRun.create({
      data: { triggeredBy },
      select: { id: true },
    });

    try {
      const result = await this.runLifecycleUpdate();
      await prisma.subscriptionLifecycleJobRun.update({
        where: { id: jobRun.id },
        data: {
          auditLogsCreated: result.auditLogsCreated,
          duplicateNotificationsSkipped: result.duplicateNotificationsSkipped,
          finishedAt: new Date(),
          notificationsCreated: result.notificationsCreated,
          scanned: result.scanned,
          skippedSuspended: result.skippedSuspended,
          success: true,
          updatedExpired: result.updatedExpired,
        },
      });
      return result;
    } catch (error) {
      await prisma.subscriptionLifecycleJobRun.update({
        where: { id: jobRun.id },
        data: {
          errorMessage:
            error instanceof Error ? error.message : 'Lifecycle job failed.',
          finishedAt: new Date(),
          success: false,
        },
      });
      throw error;
    } finally {
      this.running = false;
    }
  }

  async getStatus() {
    const prisma = await this.prismaService.getClient();
    const lastRun = await prisma.subscriptionLifecycleJobRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    return {
      lastResult: lastRun
        ? {
            auditLogsCreated: lastRun.auditLogsCreated,
            duplicateNotificationsSkipped:
              lastRun.duplicateNotificationsSkipped,
            notificationsCreated: lastRun.notificationsCreated,
            scanned: lastRun.scanned,
            skippedSuspended: lastRun.skippedSuspended,
            updatedExpired: lastRun.updatedExpired,
          }
        : null,
      lastRunAt: lastRun?.finishedAt ?? lastRun?.startedAt ?? null,
      lastRunBy: lastRun?.triggeredBy ?? null,
      lastRunError: lastRun?.errorMessage ?? null,
      lastRunSuccess: lastRun?.success ?? null,
      nextRunAt: this.nextRunAt(),
    };
  }

  private scheduleNextRun() {
    const delay = this.msUntilNextRun();
    this.timer = setTimeout(() => {
      this.runNow('cron')
        .then((result) => {
          this.logger.log(
            `Subscription lifecycle job completed: ${JSON.stringify(result)}`,
          );
        })
        .catch((error) => {
          this.logger.error('Subscription lifecycle job failed', error);
        })
        .finally(() => this.scheduleNextRun());
    }, delay);

    this.timer.unref?.();
  }

  private msUntilNextRun() {
    return this.nextRunAt().getTime() - Date.now();
  }

  private nextRunAt() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  private async runLifecycleUpdate(): Promise<LifecycleJobResult> {
    const prisma = await this.prismaService.getClient();
    const todayStart = startOfDay(new Date());
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { currentPeriodEnd: 'asc' },
      select: {
        centerId: true,
        currentPeriodEnd: true,
        gracePeriodEndsAt: true,
        id: true,
        planName: true,
        status: true,
        center: { select: { id: true, name: true, status: true } },
      },
    });

    const result: LifecycleJobResult = {
      auditLogsCreated: 0,
      duplicateNotificationsSkipped: 0,
      notificationsCreated: 0,
      scanned: subscriptions.length,
      skippedSuspended: 0,
      updatedExpired: 0,
    };

    for (const subscription of subscriptions) {
      if (
        subscription.status === 'SUSPENDED' ||
        subscription.status === 'CANCELLED'
      ) {
        result.skippedSuspended += 1;
        continue;
      }

      if (!isActiveLifecycleStatus(subscription.status)) {
        continue;
      }

      const lifecycle = normalizeSubscriptionLifecycle(
        subscription,
        todayStart,
      );

      if (lifecycle.lifecycle === 'EXPIRED') {
        const updated = await this.expireSubscription(subscription, todayStart);
        if (updated.updated) {
          result.updatedExpired += 1;
        }
        if (updated.auditCreated) {
          result.auditLogsCreated += 1;
        }
        const notificationResult = await this.createLifecycleNotifications({
          daysRemaining: lifecycle.daysRemaining,
          notificationKind: 'expired',
          subscription,
        });
        result.notificationsCreated += notificationResult.created;
        result.duplicateNotificationsSkipped += notificationResult.duplicates;
        continue;
      }

      if (
        lifecycle.lifecycle === 'EXPIRING_SOON' &&
        typeof lifecycle.daysRemaining === 'number' &&
        EXPIRING_NOTIFICATION_DAYS.includes(
          lifecycle.daysRemaining as (typeof EXPIRING_NOTIFICATION_DAYS)[number],
        )
      ) {
        const notificationResult = await this.createLifecycleNotifications({
          daysRemaining: lifecycle.daysRemaining,
          notificationKind: 'expiring',
          subscription,
        });
        result.notificationsCreated += notificationResult.created;
        result.duplicateNotificationsSkipped += notificationResult.duplicates;
      }
    }

    return result;
  }

  private async expireSubscription(
    subscription: {
      centerId: string;
      currentPeriodEnd: Date;
      gracePeriodEndsAt: Date | null;
      id: string;
      planName: string;
      status: string;
      center: { name: string; status: string };
    },
    todayStart: Date,
  ) {
    const prisma = await this.prismaService.getClient();
    const existingAudit = await prisma.auditLog.findFirst({
      where: {
        action: 'SUBSCRIPTION_STATUS_CHANGED',
        centerId: subscription.centerId,
        AND: [
          {
            metadata: {
              path: ['reason'],
              equals: 'cron_lifecycle_update',
            },
          },
          {
            metadata: {
              path: ['subscriptionId'],
              equals: subscription.id,
            },
          },
          {
            metadata: {
              path: ['newStatus'],
              equals: 'EXPIRED',
            },
          },
        ],
      },
      select: { id: true },
    });

    const gracePeriodEndsAt = subscription.gracePeriodEndsAt
      ? subscription.gracePeriodEndsAt
      : addDays(new Date(subscription.currentPeriodEnd), 14);

    const updated = await prisma.subscription.updateMany({
      where: {
        id: subscription.id,
        status: { in: ['ACTIVE', 'TRIALING'] },
        currentPeriodEnd: { lt: todayStart },
      },
      data: { gracePeriodEndsAt, status: 'EXPIRED' },
    });

    if (updated.count === 0) {
      return { auditCreated: false, updated: false };
    }

    let auditCreated = false;
    if (!existingAudit) {
      await this.auditService.log({
        action: 'SUBSCRIPTION_STATUS_CHANGED',
        centerId: subscription.centerId,
        metadata: {
          actorType: 'SYSTEM',
          centerName: subscription.center.name,
          newStatus: 'EXPIRED',
          oldStatus: subscription.status,
          planName: subscription.planName,
          reason: 'cron_lifecycle_update',
          subscriptionId: subscription.id,
        } satisfies Prisma.InputJsonObject,
      });
      auditCreated = true;
    }

    return { auditCreated, updated: true };
  }

  private async createLifecycleNotifications(params: {
    daysRemaining: number | null;
    notificationKind: 'expired' | 'expiring';
    subscription: {
      centerId: string;
      currentPeriodEnd: Date;
      id: string;
      planName: string;
      status: string;
      center: { name: string };
    };
  }) {
    const audiences: NotificationTargetAudience[] = [
      'SUPER_ADMIN',
      'CENTER_ADMIN',
    ];
    let created = 0;
    let duplicates = 0;

    for (const audience of audiences) {
      const didCreate = await this.createLifecycleNotification({
        ...params,
        audience,
      });
      if (didCreate) created += 1;
      if (!didCreate) duplicates += 1;
    }

    return { created, duplicates };
  }

  private async createLifecycleNotification(params: {
    audience: NotificationTargetAudience;
    daysRemaining: number | null;
    notificationKind: 'expired' | 'expiring';
    subscription: {
      centerId: string;
      currentPeriodEnd: Date;
      id: string;
      planName: string;
      status: string;
      center: { name: string };
    };
  }) {
    const prisma = await this.prismaService.getClient();
    const eventKey = this.lifecycleEventKey(params);
    const type =
      params.notificationKind === 'expired'
        ? 'SUBSCRIPTION_EXPIRED'
        : 'SUBSCRIPTION_EXPIRING';

    const existing = await prisma.notification.findFirst({
      where: {
        centerId: params.subscription.centerId,
        eventKey,
        targetAudience: params.audience,
        type,
      },
      select: { id: true },
    });

    if (existing) {
      return false;
    }

    const message = this.notificationCopy(params);

    await this.notificationsService.createNotification({
      centerId: params.subscription.centerId,
      dedupKey: eventKey,
      messageAr: message.messageAr,
      messageEn: message.messageEn,
      messageHe: message.messageHe,
      metadata: {
        actorType: 'SYSTEM',
        centerName: params.subscription.center.name,
        daysRemaining: params.daysRemaining,
        endDate: params.subscription.currentPeriodEnd.toISOString(),
        planName: params.subscription.planName,
        reason: 'cron_lifecycle_update',
        subscriptionId: params.subscription.id,
      },
      targetAudience: params.audience,
      titleAr: message.titleAr,
      titleEn: message.titleEn,
      titleHe: message.titleHe,
      type,
    });

    return true;
  }

  private lifecycleEventKey(params: {
    audience: NotificationTargetAudience;
    daysRemaining: number | null;
    notificationKind: 'expired' | 'expiring';
    subscription: { currentPeriodEnd: Date; id: string };
  }) {
    const endDate = params.subscription.currentPeriodEnd
      .toISOString()
      .slice(0, 10);

    if (params.notificationKind === 'expired') {
      return `cron:subscription:${params.subscription.id}:expired:${endDate}`;
    }

    return `cron:subscription:${params.subscription.id}:expiring:${params.daysRemaining}:${endDate}`;
  }

  private notificationCopy(params: {
    daysRemaining: number | null;
    notificationKind: 'expired' | 'expiring';
    subscription: { center: { name: string } };
  }) {
    const centerName = params.subscription.center.name;

    if (params.notificationKind === 'expired') {
      return {
        messageAr: `انتهى اشتراك مركز ${centerName}.`,
        messageEn: `${centerName} subscription has expired.`,
        messageHe: `המינוי של ${centerName} פג תוקף.`,
        titleAr: 'انتهى الاشتراك',
        titleEn: 'Subscription expired',
        titleHe: 'המינוי פג',
      };
    }

    const days = params.daysRemaining ?? 0;

    return {
      messageAr: `ينتهي اشتراك مركز ${centerName} خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}.`,
      messageEn: `${centerName} subscription expires in ${days} day${days === 1 ? '' : 's'}.`,
      messageHe: `המינוי של ${centerName} יפוג בעוד ${days} ${days === 1 ? 'יום' : 'ימים'}.`,
      titleAr: 'الاشتراك ينتهي قريباً',
      titleEn: 'Subscription expiring soon',
      titleHe: 'המינוי עומד לפוג בקרוב',
    };
  }
}
