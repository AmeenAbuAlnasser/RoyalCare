import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class TenantNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTenant(
    centerId: string,
    query: { page?: number; pageSize?: number; unreadOnly?: boolean },
  ) {
    const prisma = await this.prisma.getClient();
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = {
      centerId,
      targetAudience: 'CENTER_ADMIN' as const,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          type: true,
          channel: true,
          status: true,
          eventKey: true,
          title: true,
          body: true,
          scheduledAt: true,
          sentAt: true,
          readAt: true,
          readByUserId: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { centerId, readAt: null, targetAudience: 'CENTER_ADMIN' },
      }),
    ]);

    return {
      data: notifications,
      pagination: { page, pageSize, total },
      unreadCount,
    };
  }

  async markAsRead(
    centerId: string,
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const prisma = await this.prisma.getClient();

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, centerId, targetAudience: 'CENTER_ADMIN' },
      select: { id: true, readAt: true },
    });

    if (!notification) {
      throw new NotFoundException({ message: 'Notification not found.' });
    }

    if (notification.readAt) {
      return;
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date(), readByUserId: userId },
      select: { id: true },
    });
  }

  async getUnreadCount(centerId: string): Promise<number> {
    const prisma = await this.prisma.getClient();
    return prisma.notification.count({
      where: { centerId, readAt: null, targetAudience: 'CENTER_ADMIN' },
    });
  }

  async getLatestForDashboard(centerId: string, take = 5) {
    const prisma = await this.prisma.getClient();
    return prisma.notification.findMany({
      where: { centerId, targetAudience: 'CENTER_ADMIN' },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        status: true,
        readAt: true,
        createdAt: true,
      },
    });
  }
}
