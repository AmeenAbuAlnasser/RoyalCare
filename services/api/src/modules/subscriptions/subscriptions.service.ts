import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { parsePagination } from '../../common/utils/pagination';
import type { Prisma } from '../../../../../packages/database/node_modules/@prisma/client';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';

const DEFAULT_BILLING_INTERVAL = 'MONTHLY';
const DEFAULT_SUBSCRIPTION_STATUS = 'TRIALING';

function optionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListSubscriptionsQueryDto) {
    const prisma = await this.prisma.getClient();
    const { page, pageSize, skip, take } = parsePagination(query);
    const where: Prisma.SubscriptionWhereInput = {
      ...(query.centerId ? { centerId: query.centerId } : {}),
      ...(query.status ? { status: query.status } : {}),
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

    const [data, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { center: true },
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      data,
      pagination: { page, pageSize, total },
    };
  }

  async getById(subscriptionId: string) {
    const prisma = await this.prisma.getClient();
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { center: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    return subscription;
  }

  async getLatestForCenter(centerId: string) {
    const prisma = await this.prisma.getClient();
    const subscription = await prisma.subscription.findFirst({
      where: { centerId },
      orderBy: { createdAt: 'desc' },
      include: { center: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for center.');
    }

    return subscription;
  }

  async create(dto: CreateSubscriptionDto) {
    const prisma = await this.prisma.getClient();

    return prisma.subscription.create({
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
        externalProvider: dto.externalProvider,
        externalSubscriptionId: dto.externalSubscriptionId,
      },
      include: { center: true },
    });
  }
}
