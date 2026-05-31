import {
  Injectable,
  type MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { PrismaService } from '../../common/database/prisma.service';
import type {
  NotificationChannel,
  NotificationTargetAudience,
  Prisma,
} from '@royalcare/db';

export type NotificationType =
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_RENEWAL_REQUEST'
  | 'SUBSCRIPTION_SUSPENDED'
  | 'SUBSCRIPTION_RENEWED'
  | 'TRIAL_ENDING_SOON'
  | 'MISSING_WHATSAPP_PHONE'
  | 'BOOKING_REQUEST_CREATED';

export type CreateNotificationPayload = {
  centerId: string;
  type: NotificationType;
  channel?: NotificationChannel;
  targetAudience?: NotificationTargetAudience;
  titleEn: string;
  titleAr: string;
  titleHe: string;
  messageEn: string;
  messageAr: string;
  messageHe: string;
  actionUrl?: string;
  dedupKey?: string;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
};

const DEDUP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class NotificationsService {
  private readonly tenantNotificationStreams = new Map<
    string,
    Subject<MessageEvent>
  >();

  constructor(private readonly prisma: PrismaService) {}

  streamTenantNotifications(centerId: string): Observable<MessageEvent> {
    let stream = this.tenantNotificationStreams.get(centerId);

    if (!stream) {
      stream = new Subject<MessageEvent>();
      this.tenantNotificationStreams.set(centerId, stream);
    }

    return stream.asObservable();
  }

  async createNotification(payload: CreateNotificationPayload): Promise<void> {
    const prisma = await this.prisma.getClient();
    const dedupAfter = new Date(Date.now() - DEDUP_WINDOW_MS);

    const existing = await prisma.notification.findFirst({
      where: {
        centerId: payload.centerId,
        eventKey: payload.dedupKey ?? payload.type,
        targetAudience: payload.targetAudience ?? 'CENTER_ADMIN',
        type: payload.type,
        createdAt: { gte: dedupAfter },
      },
      select: { id: true },
    });

    if (existing) {
      return;
    }

    const notifData: Prisma.NotificationUncheckedCreateInput = {
      centerId: payload.centerId,
      type: payload.type,
      targetAudience: payload.targetAudience ?? 'CENTER_ADMIN',
      channel: payload.channel ?? 'IN_APP',
      status: 'PENDING',
      eventKey: payload.dedupKey ?? payload.type,
      title: {
        en: payload.titleEn,
        ar: payload.titleAr,
        he: payload.titleHe,
      },
      body: {
        en: payload.messageEn,
        ar: payload.messageAr,
        he: payload.messageHe,
      },
      scheduledAt: payload.scheduledAt ?? null,
    };

    const metadata = {
      ...(payload.metadata ?? {}),
      ...(payload.actionUrl ? { actionUrl: payload.actionUrl } : {}),
    };

    if (Object.keys(metadata).length > 0) {
      notifData.metadata = metadata;
    }

    const notification = await prisma.notification.create({
      data: notifData,
      select: { id: true },
    });

    if ((payload.targetAudience ?? 'CENTER_ADMIN') === 'CENTER_ADMIN') {
      this.tenantNotificationStreams.get(payload.centerId)?.next({
        data: {
          id: notification.id,
          type: payload.type,
        },
      });
    }
  }

  async updateStatus(
    id: string,
    status: 'SENT' | 'FAILED' | 'CANCELLED',
  ): Promise<{ success: boolean }> {
    const prisma = await this.prisma.getClient();
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!notification) {
      throw new NotFoundException({ message: 'Notification not found.' });
    }
    await prisma.notification.update({
      where: { id },
      data: { status },
    });
    return { success: true };
  }

  async getPendingNotifications() {
    const prisma = await this.prisma.getClient();
    return prisma.notification.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        centerId: true,
        type: true,
        channel: true,
        eventKey: true,
        title: true,
        body: true,
        scheduledAt: true,
        createdAt: true,
      },
    });
  }

  async markAsSent(notificationId: string): Promise<void> {
    const prisma = await this.prisma.getClient();
    const now = new Date();

    await prisma.$transaction([
      prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: now },
      }),
      prisma.notificationLog.create({
        data: {
          notificationId,
          channel: 'IN_APP',
          success: true,
          sentAt: now,
        },
      }),
    ]);
  }

  async markAsFailed(
    notificationId: string,
    errorMessage: string,
  ): Promise<void> {
    const prisma = await this.prisma.getClient();
    const now = new Date();

    await prisma.$transaction([
      prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          failedAt: now,
          failureReason: errorMessage,
        },
      }),
      prisma.notificationLog.create({
        data: {
          notificationId,
          channel: 'IN_APP',
          success: false,
          errorMessage,
          sentAt: now,
        },
      }),
    ]);
  }

  async logManualWhatsApp(
    notificationId: string,
    payload: {
      phone: string;
      message: string;
      action: 'OPENED_WHATSAPP' | 'COPIED_MESSAGE';
      actorId?: string;
    },
  ): Promise<{ logged: boolean }> {
    const prisma = await this.prisma.getClient();

    const [notification, actor] = await Promise.all([
      prisma.notification.findUnique({
        where: { id: notificationId },
        select: { id: true },
      }),
      payload.actorId
        ? prisma.user.findUnique({
            where: { id: payload.actorId },
            select: { email: true },
          })
        : Promise.resolve(null),
    ]);

    if (!notification) {
      throw new NotFoundException({ message: 'Notification not found.' });
    }

    const meta: Record<string, unknown> = {
      manual: true,
      action: payload.action,
      phone: payload.phone,
      messagePreview: payload.message.slice(0, 200),
    };

    if (payload.actorId) {
      meta.actorId = payload.actorId;
    }
    if (actor?.email) {
      meta.actorEmail = actor.email;
    }

    await prisma.notificationLog.create({
      data: {
        notificationId,
        channel: 'WHATSAPP',
        success: true,
        metadata: meta as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return { logged: true };
  }

  async listForSuperAdmin(query: {
    category?: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    centerId?: string;
  }) {
    const prisma = await this.prisma.getClient();
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = {
      targetAudience: 'SUPER_ADMIN' as NotificationTargetAudience,
      ...(query.unreadOnly ? { readAt: null } : {}),
      ...(query.type ? { type: query.type as NotificationType } : {}),
      ...(query.status
        ? {
            status: query.status as 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED',
          }
        : {}),
      ...(query.centerId ? { centerId: query.centerId } : {}),
    };

    const categoryWhere = this.buildSuperAdminCategoryWhere(query.category);
    const finalWhere = {
      ...where,
      ...categoryWhere,
    };

    const [rawData, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: finalWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          centerId: true,
          type: true,
          channel: true,
          status: true,
          targetAudience: true,
          eventKey: true,
          title: true,
          body: true,
          scheduledAt: true,
          sentAt: true,
          failedAt: true,
          failureReason: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
          readAt: true,
          readByUserId: true,
          center: {
            select: {
              id: true,
              name: true,
              slug: true,
              subscriptions: {
                orderBy: { createdAt: 'desc' as const },
                take: 1,
                select: { notificationPhone: true },
              },
              owner: {
                select: { phone: true },
              },
            },
          },
          logs: {
            where: { channel: 'WHATSAPP' },
            orderBy: { sentAt: 'desc' },
            take: 1,
            select: {
              id: true,
              channel: true,
              errorMessage: true,
              metadata: true,
              sentAt: true,
              success: true,
            },
          },
          _count: {
            select: {
              logs: { where: { channel: 'WHATSAPP' } },
            },
          },
        },
      }),
      prisma.notification.count({ where: finalWhere }),
    ]);

    const data = rawData.map(({ _count, logs, ...n }) => {
      const latestLog = logs[0];
      const meta = latestLog?.metadata as
        | Record<string, unknown>
        | null
        | undefined;
      return {
        ...n,
        actionUrl: this.resolveActionUrl(n),
        centerName: n.center.name,
        logs,
        manualAttempts: _count.logs,
        manualWhatsApp: {
          attemptsCount: _count.logs,
          lastAction:
            typeof meta?.action === 'string'
              ? (meta.action as 'OPENED_WHATSAPP' | 'COPIED_MESSAGE')
              : null,
          lastPhone: typeof meta?.phone === 'string' ? meta.phone : null,
          lastAt:
            latestLog?.sentAt instanceof Date
              ? latestLog.sentAt.toISOString()
              : null,
        },
      };
    });

    const pendingCount = await prisma.notification.count({
      where: { status: 'PENDING', targetAudience: 'SUPER_ADMIN' },
    });
    const sentCount = await prisma.notification.count({
      where: { status: 'SENT', targetAudience: 'SUPER_ADMIN' },
    });
    const failedCount = await prisma.notification.count({
      where: { status: 'FAILED', targetAudience: 'SUPER_ADMIN' },
    });
    const unreadCount = await prisma.notification.count({
      where: { readAt: null, targetAudience: 'SUPER_ADMIN' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sentTodayCount = await prisma.notification.count({
      where: {
        status: 'SENT',
        sentAt: { gte: today },
        targetAudience: 'SUPER_ADMIN',
      },
    });

    return {
      data,
      pagination: { page, pageSize, total },
      stats: {
        total,
        pending: pendingCount,
        sent: sentCount,
        failed: failedCount,
        sentToday: sentTodayCount,
        unread: unreadCount,
      },
    };
  }

  async markAsRead(
    notificationId: string,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const prisma = await this.prisma.getClient();
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        targetAudience: 'SUPER_ADMIN',
      },
      select: { id: true, readAt: true },
    });

    if (!notification) {
      throw new NotFoundException({ message: 'Notification not found.' });
    }

    if (!notification.readAt) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date(), readByUserId: userId ?? null },
        select: { id: true },
      });
    }

    return { success: true };
  }

  async markAllAsRead(
    userId?: string,
  ): Promise<{ success: boolean; count: number }> {
    const prisma = await this.prisma.getClient();
    const result = await prisma.notification.updateMany({
      where: {
        readAt: null,
        targetAudience: 'SUPER_ADMIN',
      },
      data: { readAt: new Date(), readByUserId: userId ?? null },
    });

    return { success: true, count: result.count };
  }

  async createSuperAdminSubscriptionNotification(
    payload: Omit<
      CreateNotificationPayload,
      'actionUrl' | 'channel' | 'targetAudience'
    > & { actionUrl?: string },
  ): Promise<void> {
    await this.createNotification({
      ...payload,
      actionUrl:
        payload.actionUrl ??
        `/super-admin/subscriptions?centerId=${payload.centerId}`,
      channel: 'IN_APP',
      targetAudience: 'SUPER_ADMIN',
    });
  }

  private buildSuperAdminCategoryWhere(
    category?: string,
  ): Prisma.NotificationWhereInput {
    if (!category || category === 'all') return {};
    if (category === 'subscriptions') {
      return {
        type: {
          in: [
            'SUBSCRIPTION_EXPIRING',
            'SUBSCRIPTION_EXPIRED',
            'SUBSCRIPTION_RENEWAL_REQUEST',
            'SUBSCRIPTION_SUSPENDED',
            'SUBSCRIPTION_RENEWED',
            'TRIAL_ENDING_SOON',
            'MISSING_WHATSAPP_PHONE',
          ],
        },
      };
    }
    if (category === 'renewal_requests') {
      return { type: 'SUBSCRIPTION_RENEWAL_REQUEST' };
    }
    if (category === 'system_alerts') {
      return {
        type: {
          in: [
            'SUBSCRIPTION_EXPIRING',
            'SUBSCRIPTION_EXPIRED',
            'SUBSCRIPTION_SUSPENDED',
            'TRIAL_ENDING_SOON',
            'MISSING_WHATSAPP_PHONE',
          ],
        },
      };
    }
    return {};
  }

  private resolveActionUrl(notification: {
    centerId: string;
    metadata: Prisma.JsonValue | null;
  }) {
    const metadata =
      notification.metadata &&
      typeof notification.metadata === 'object' &&
      !Array.isArray(notification.metadata)
        ? (notification.metadata as Record<string, unknown>)
        : {};
    return typeof metadata.actionUrl === 'string'
      ? metadata.actionUrl
      : `/super-admin/subscriptions?centerId=${notification.centerId}`;
  }
}
