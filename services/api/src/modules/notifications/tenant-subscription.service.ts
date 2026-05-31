import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { Prisma } from '@royalcare/db';

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class TenantSubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async requestRenewal(params: {
    centerId: string;
    actorUserId: string;
    note?: string;
  }): Promise<{ id: string }> {
    const prismaClient = await this.prisma.getClient();
    const dedupAfter = new Date(Date.now() - DEDUP_WINDOW_MS);

    const existing = await prismaClient.notification.findFirst({
      where: {
        centerId: params.centerId,
        targetAudience: 'SUPER_ADMIN',
        type: 'SUBSCRIPTION_RENEWAL_REQUEST',
        createdAt: { gte: dedupAfter },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({
        message:
          'A renewal request was already submitted in the last 24 hours.',
        code: 'RENEWAL_REQUEST_DUPLICATE',
      });
    }

    const centerForPhone = await prismaClient.center.findFirst({
      where: { id: params.centerId },
      select: {
        subscriptions: {
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: { notificationPhone: true },
        },
        owner: {
          select: { phone: true },
        },
      },
    });

    const resolvedPhone =
      centerForPhone?.subscriptions?.[0]?.notificationPhone ??
      centerForPhone?.owner?.phone ??
      null;

    const metadata: Record<string, unknown> = {};
    if (params.note?.trim()) {
      metadata.note = params.note.trim();
    }
    metadata.requestedByUserId = params.actorUserId;
    if (resolvedPhone) {
      metadata.notificationPhone = resolvedPhone;
    }

    const notifData: Prisma.NotificationUncheckedCreateInput = {
      centerId: params.centerId,
      type: 'SUBSCRIPTION_RENEWAL_REQUEST',
      targetAudience: 'SUPER_ADMIN',
      channel: 'IN_APP',
      status: 'PENDING',
      eventKey: 'SUBSCRIPTION_RENEWAL_REQUEST',
      title: {
        en: 'Subscription Renewal Request',
        ar: 'طلب تجديد الاشتراك',
        he: 'בקשת חידוש מינוי',
      },
      body: {
        en: params.note?.trim()
          ? `Renewal request submitted with note: ${params.note.trim()}`
          : 'A renewal request has been submitted.',
        ar: params.note?.trim()
          ? `تم تقديم طلب التجديد مع ملاحظة: ${params.note.trim()}`
          : 'تم تقديم طلب تجديد الاشتراك.',
        he: params.note?.trim()
          ? `בקשת חידוש הוגשה עם הערה: ${params.note.trim()}`
          : 'בקשת חידוש מינוי הוגשה.',
      },
      metadata: metadata as Prisma.InputJsonValue,
    };

    const notification = await prismaClient.notification.create({
      data: notifData,
      select: { id: true },
    });

    await this.audit.log({
      action: 'SUBSCRIPTION_RENEWAL_REQUESTED',
      actorUserId: params.actorUserId,
      centerId: params.centerId,
      metadata: {
        notificationId: notification.id,
        ...(params.note?.trim() ? { note: params.note.trim() } : {}),
      },
    });

    return { id: notification.id };
  }
}
