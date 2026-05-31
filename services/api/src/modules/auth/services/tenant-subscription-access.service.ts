import { ForbiddenException, Injectable } from '@nestjs/common';
import type { SubscriptionStatus } from '@royalcare/db';
import {
  normalizeSubscriptionLifecycle,
  type NormalizedSubscriptionLifecycle,
} from '../../../common/subscriptions/subscription-lifecycle';
import { PrismaService } from '../../../common/database/prisma.service';

export type TenantSubscriptionAccessState = {
  daysRemaining: number | null;
  graceDaysRemaining: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isInGracePeriod: boolean;
  isSuspended: boolean;
  planName: string | null;
  status: NormalizedSubscriptionLifecycle | SubscriptionStatus | null;
};

const expiredMessage = {
  ar: 'انتهى اشتراكك، يرجى التواصل مع الإدارة لتجديده.',
  en: 'Your subscription has expired. Please contact administration to renew it.',
  he: 'המנוי שלך פג. אנא צור קשר עם ההנהלה לחידוש.',
};

const suspendedMessage = {
  ar: 'تم إيقاف حسابك، يرجى التواصل مع الإدارة.',
  en: 'Your account has been suspended. Please contact administration.',
  he: 'החשבון שלך הושעה. אנא צור קשר עם ההנהלה.',
};

@Injectable()
export class TenantSubscriptionAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccessState(
    centerId: string,
  ): Promise<TenantSubscriptionAccessState> {
    const prisma = await this.prisma.getClient();
    const subscription = await prisma.subscription.findFirst({
      where: { centerId },
      orderBy: { createdAt: 'desc' },
      select: {
        currentPeriodEnd: true,
        gracePeriodEndsAt: true,
        planName: true,
        status: true,
        center: { select: { status: true } },
      },
    });

    if (!subscription) {
      return {
        daysRemaining: null,
        graceDaysRemaining: null,
        isExpired: false,
        isExpiringSoon: false,
        isInGracePeriod: false,
        isSuspended: false,
        planName: null,
        status: null,
      };
    }

    const lifecycle = normalizeSubscriptionLifecycle(subscription);
    const isSuspended =
      lifecycle.lifecycle === 'SUSPENDED' ||
      lifecycle.lifecycle === 'CANCELLED';

    return {
      daysRemaining: lifecycle.daysRemaining,
      graceDaysRemaining: lifecycle.graceDaysRemaining,
      isExpired: lifecycle.isExpired,
      isExpiringSoon: lifecycle.isExpiringSoon,
      isInGracePeriod: lifecycle.isInGracePeriod,
      isSuspended,
      planName: subscription.planName,
      status: lifecycle.lifecycle,
    };
  }

  async assertCanWrite(centerId: string) {
    const access = await this.getAccessState(centerId);

    if (access.isSuspended || access.status === 'CANCELLED') {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_SUSPENDED',
        errorCode: 'SUBSCRIPTION_SUSPENDED',
        message: suspendedMessage,
      });
    }

    // Grace period allows full write access — only block after grace period ends
    if (access.isExpired && !access.isInGracePeriod) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_EXPIRED',
        errorCode: 'SUBSCRIPTION_EXPIRED',
        message: expiredMessage,
      });
    }
  }
}
