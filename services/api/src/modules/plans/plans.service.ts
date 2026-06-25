import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { ReorderPlansDto } from './dto/reorder-plans.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

// Statuses considered "in use" — deactivating a plan referenced by these blocks DELETE.
const ACTIVE_SUBSCRIPTION_STATUSES = ['ACTIVE', 'TRIALING', 'PAST_DUE'] as const;

function serializePlan(plan: {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  descriptionHe: string | null;
  yearlyPrice: Prisma.Decimal;
  currency: string;
  isActive: boolean;
  isPublic: boolean;
  isPopular: boolean;
  isContactPricing: boolean;
  displayOrder: number;
  maxUsers: number | null;
  maxPatients: number | null;
  maxAppointmentsPerMonth: number | null;
  features: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  subscriptionsCount?: number;
}) {
  return {
    id: plan.id,
    code: plan.code,
    nameEn: plan.nameEn,
    nameAr: plan.nameAr,
    nameHe: plan.nameHe,
    descriptionEn: plan.descriptionEn,
    descriptionAr: plan.descriptionAr,
    descriptionHe: plan.descriptionHe,
    yearlyPrice: Number(plan.yearlyPrice),
    currency: plan.currency,
    isActive: plan.isActive,
    isPublic: plan.isPublic,
    isPopular: plan.isPopular,
    isContactPricing: plan.isContactPricing,
    displayOrder: plan.displayOrder,
    maxUsers: plan.maxUsers,
    maxPatients: plan.maxPatients,
    maxAppointmentsPerMonth: plan.maxAppointmentsPerMonth,
    features: plan.features,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    ...(plan.subscriptionsCount !== undefined
      ? { subscriptionsCount: plan.subscriptionsCount }
      : {}),
  };
}

function validateCreateFields(dto: CreatePlanDto) {
  if (!dto.code || !dto.code.trim()) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { code: 'Plan code is required.' },
    });
  }
  if (!dto.nameEn || !dto.nameEn.trim()) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { nameEn: 'English name is required.' },
    });
  }
  if (!dto.nameAr || !dto.nameAr.trim()) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { nameAr: 'Arabic name is required.' },
    });
  }
  if (!dto.nameHe || !dto.nameHe.trim()) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { nameHe: 'Hebrew name is required.' },
    });
  }
  if (dto.yearlyPrice === undefined || dto.yearlyPrice === null) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { yearlyPrice: 'Yearly price is required.' },
    });
  }
  if (typeof dto.yearlyPrice !== 'number' || dto.yearlyPrice < 0) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { yearlyPrice: 'Yearly price must be a non-negative number.' },
    });
  }
  if (
    dto.displayOrder !== undefined &&
    (!Number.isInteger(dto.displayOrder) || dto.displayOrder < 0)
  ) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { displayOrder: 'Display order must be a non-negative integer.' },
    });
  }
  if (dto.features !== undefined && dto.features !== null && !Array.isArray(dto.features)) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { features: 'Features must be a JSON array.' },
    });
  }
}

function validateUpdateFields(dto: UpdatePlanDto) {
  if (dto.yearlyPrice !== undefined) {
    if (typeof dto.yearlyPrice !== 'number' || dto.yearlyPrice < 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { yearlyPrice: 'Yearly price must be a non-negative number.' },
      });
    }
  }
  if (dto.displayOrder !== undefined) {
    if (!Number.isInteger(dto.displayOrder) || dto.displayOrder < 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { displayOrder: 'Display order must be a non-negative integer.' },
      });
    }
  }
  if (dto.features !== undefined && dto.features !== null && !Array.isArray(dto.features)) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { features: 'Features must be a JSON array.' },
    });
  }
}

@Injectable()
export class PlansService {
  constructor(private readonly prismaService: PrismaService) {}

  async list() {
    const prisma = await this.prismaService.getClient();

    const plans = await prisma.plan.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    return plans.map((plan) =>
      serializePlan({
        ...plan,
        subscriptionsCount: plan._count.subscriptions,
      }),
    );
  }

  async findOne(id: string) {
    const prisma = await this.prismaService.getClient();

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException({
        message: 'Plan not found',
        errors: { id: `No plan found with id "${id}".` },
      });
    }

    return serializePlan({
      ...plan,
      subscriptionsCount: plan._count.subscriptions,
    });
  }

  async create(dto: CreatePlanDto) {
    validateCreateFields(dto);

    const prisma = await this.prismaService.getClient();
    const normalizedCode = dto.code.trim().toUpperCase();

    const existing = await prisma.plan.findUnique({ where: { code: normalizedCode } });
    if (existing) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: { code: `A plan with code "${normalizedCode}" already exists.` },
      });
    }

    const plan = await prisma.plan.create({
      data: {
        code: normalizedCode,
        nameEn: dto.nameEn.trim(),
        nameAr: dto.nameAr.trim(),
        nameHe: dto.nameHe.trim(),
        descriptionEn: dto.descriptionEn ?? null,
        descriptionAr: dto.descriptionAr ?? null,
        descriptionHe: dto.descriptionHe ?? null,
        yearlyPrice: dto.yearlyPrice,
        currency: (dto.currency ?? 'USD').toUpperCase(),
        isActive: dto.isActive ?? true,
        isPublic: dto.isPublic ?? true,
        isPopular: dto.isPopular ?? false,
        isContactPricing: dto.isContactPricing ?? false,
        displayOrder: dto.displayOrder ?? 0,
        maxUsers: dto.maxUsers ?? null,
        maxPatients: dto.maxPatients ?? null,
        maxAppointmentsPerMonth: dto.maxAppointmentsPerMonth ?? null,
        features: (dto.features as Prisma.InputJsonValue) ?? null,
      },
    });

    return serializePlan(plan);
  }

  async update(id: string, dto: UpdatePlanDto) {
    validateUpdateFields(dto);

    const prisma = await this.prismaService.getClient();

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        message: 'Plan not found',
        errors: { id: `No plan found with id "${id}".` },
      });
    }

    const data: Prisma.PlanUpdateInput = {};

    if (dto.nameEn !== undefined) data.nameEn = dto.nameEn.trim();
    if (dto.nameAr !== undefined) data.nameAr = dto.nameAr.trim();
    if (dto.nameHe !== undefined) data.nameHe = dto.nameHe.trim();
    if (dto.descriptionEn !== undefined) data.descriptionEn = dto.descriptionEn;
    if (dto.descriptionAr !== undefined) data.descriptionAr = dto.descriptionAr;
    if (dto.descriptionHe !== undefined) data.descriptionHe = dto.descriptionHe;
    if (dto.yearlyPrice !== undefined) data.yearlyPrice = dto.yearlyPrice;
    if (dto.currency !== undefined) data.currency = dto.currency.toUpperCase();
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
    if (dto.isPopular !== undefined) data.isPopular = dto.isPopular;
    if (dto.isContactPricing !== undefined) data.isContactPricing = dto.isContactPricing;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.maxUsers !== undefined) data.maxUsers = dto.maxUsers;
    if (dto.maxPatients !== undefined) data.maxPatients = dto.maxPatients;
    if (dto.maxAppointmentsPerMonth !== undefined)
      data.maxAppointmentsPerMonth = dto.maxAppointmentsPerMonth;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (dto.features !== undefined) data.features = dto.features as any;

    const updated = await prisma.plan.update({ where: { id }, data });
    return serializePlan(updated);
  }

  async reorder(dto: ReorderPlansDto) {
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { items: 'items must be a non-empty array.' },
      });
    }

    const prisma = await this.prismaService.getClient();

    await prisma.$transaction(
      dto.items.map((item) =>
        prisma.plan.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    return this.list();
  }

  async softDelete(id: string) {
    const prisma = await this.prismaService.getClient();

    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException({
        message: 'Plan not found',
        errors: { id: `No plan found with id "${id}".` },
      });
    }

    const activeSubscriptionsCount = await prisma.subscription.count({
      where: {
        planId: id,
        status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
      },
    });

    if (activeSubscriptionsCount > 0) {
      throw new ConflictException({
        message: 'Plan cannot be deactivated',
        errors: {
          subscriptions: `This plan has ${activeSubscriptionsCount} active subscription(s). Reassign or cancel them before deactivating this plan.`,
        },
      });
    }

    await prisma.plan.update({
      where: { id },
      data: { isActive: false, isPublic: false },
    });

    return { message: 'Plan deactivated successfully.' };
  }

  async listPublic() {
    const prisma = await this.prismaService.getClient();

    const plans = await prisma.plan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // Return only safe fields — no limits, no internal admin flags except isPopular
    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      nameEn: plan.nameEn,
      nameAr: plan.nameAr,
      nameHe: plan.nameHe,
      descriptionEn: plan.descriptionEn,
      descriptionAr: plan.descriptionAr,
      descriptionHe: plan.descriptionHe,
      yearlyPrice: Number(plan.yearlyPrice),
      currency: plan.currency,
      isPopular: plan.isPopular,
      isContactPricing: plan.isContactPricing,
      displayOrder: plan.displayOrder,
      features: plan.features,
    }));
  }
}
