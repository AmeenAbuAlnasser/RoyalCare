import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { parsePagination } from '../../common/utils/pagination';
import type { Prisma } from '../../../../../packages/database/node_modules/@prisma/client';
import { CreateCenterDto } from './dto/create-center.dto';
import { ListCentersQueryDto } from './dto/list-centers-query.dto';

const ACTIVE_USER_ROLE_STATUS = 'ACTIVE';
const DEFAULT_BILLING_INTERVAL = 'MONTHLY';
const DEFAULT_CENTER_STATUS = 'TRIAL';
const DEFAULT_SUBSCRIPTION_STATUS = 'TRIALING';
const DEFAULT_USER_STATUS = 'ACTIVE';
const DEFAULT_TIMEZONE = 'Asia/Jerusalem';

function optionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function createUniqueSlug(
  tx: Prisma.TransactionClient,
  name: string,
  requestedSlug?: string,
) {
  const baseSlug =
    normalizeSlug(requestedSlug || name) || `center-${Date.now()}`;
  let candidate = baseSlug;
  let suffix = 1;

  while (await tx.center.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

function validateCreateCenterDto(dto: CreateCenterDto) {
  const errors: Record<string, string> = {};

  if (!dto.name?.trim()) {
    errors.name = 'Center name is required.';
  }

  if (!dto.admin?.email?.trim()) {
    errors.adminEmail = 'Owner/admin email is required.';
  }

  if (!dto.subscription?.planCode?.trim()) {
    errors.subscriptionPlan = 'Subscription plan is required.';
  }

  const defaultLanguage = dto.branding?.defaultLanguage ?? dto.primaryLanguage;
  if (!defaultLanguage) {
    errors.defaultLanguage = 'Default language is required.';
  }

  if (!dto.branding?.enabledLanguages?.length) {
    errors.enabledLanguages = 'At least one enabled language is required.';
  }

  if (
    defaultLanguage &&
    dto.branding?.enabledLanguages?.length &&
    !dto.branding.enabledLanguages.includes(defaultLanguage)
  ) {
    errors.enabledLanguages =
      'Enabled languages must include the default language.';
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({
      message: 'Center creation validation failed.',
      errors,
    });
  }
}

@Injectable()
export class CentersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListCentersQueryDto) {
    const prisma = await this.prisma.getClient();
    const { page, pageSize, skip, take } = parsePagination(query);
    const where: Prisma.CenterWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.center.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          owner: true,
          branding: true,
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          domains: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            take: 1,
          },
        },
      }),
      prisma.center.count({ where }),
    ]);

    return {
      data,
      pagination: { page, pageSize, total },
    };
  }

  async getById(centerId: string) {
    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      include: {
        owner: true,
        branding: true,
        subscriptions: { orderBy: { createdAt: 'desc' } },
        domains: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        userRoles: {
          where: { status: ACTIVE_USER_ROLE_STATUS },
          include: { role: true, user: true },
        },
      },
    });

    if (!center) {
      throw new NotFoundException('Center not found.');
    }

    return center;
  }

  async create(dto: CreateCenterDto) {
    validateCreateCenterDto(dto);
    const prisma = await this.prisma.getClient();

    return prisma.$transaction(async (tx) => {
      const adminUser = dto.admin
        ? await tx.user.upsert({
            where: dto.admin.userId
              ? { id: dto.admin.userId }
              : dto.admin.email
                ? { email: dto.admin.email }
                : { phone: dto.admin.phone },
            create: {
              email: dto.admin.email,
              phone: dto.admin.phone,
              fullName: dto.admin.fullName?.trim() || dto.name,
              status: DEFAULT_USER_STATUS,
            },
            update: {
              fullName: dto.admin.fullName?.trim() || dto.name,
              ...(dto.admin.email ? { email: dto.admin.email } : {}),
              ...(dto.admin.phone ? { phone: dto.admin.phone } : {}),
            },
          })
        : null;

      const slug = await createUniqueSlug(tx, dto.name, dto.slug);
      const primaryLanguage =
        dto.primaryLanguage ?? dto.branding?.defaultLanguage ?? 'EN';

      const center = await tx.center.create({
        data: {
          name: dto.name,
          slug,
          type: dto.type,
          status: dto.status ?? DEFAULT_CENTER_STATUS,
          primaryLanguage,
          timezone: dto.timezone ?? DEFAULT_TIMEZONE,
          ownerUserId: adminUser?.id,
        },
      });

      if (dto.admin && adminUser) {
        const permissionPreset =
          dto.admin.permissionsPreset ?? 'standardManagement';
        const role = await tx.role.create({
          data: {
            centerId: center.id,
            key: `center_admin_${permissionPreset}`,
            name: 'Center Admin',
            description: `Initial center admin role from ${permissionPreset} preset.`,
            scope: 'CENTER',
          },
        });

        await tx.userRole.create({
          data: {
            centerId: center.id,
            roleId: role.id,
            userId: adminUser.id,
            status: ACTIVE_USER_ROLE_STATUS,
          },
        });
      }

      if (dto.branding) {
        await tx.brandingSettings.create({
          data: {
            centerId: center.id,
            defaultLanguage: dto.branding.defaultLanguage,
            enabledLanguages: dto.branding.enabledLanguages,
            logoUrl: dto.branding.logoUrl,
            primaryColor: dto.branding.primaryColor,
            secondaryColor: dto.branding.secondaryColor,
            theme: dto.branding.theme as Prisma.InputJsonValue | undefined,
          },
        });
      }

      if (dto.subscription) {
        await tx.subscription.create({
          data: {
            centerId: center.id,
            planCode: dto.subscription.planCode,
            planName: dto.subscription.planName,
            billingInterval:
              dto.subscription.billingInterval ?? DEFAULT_BILLING_INTERVAL,
            status: dto.subscription.status ?? DEFAULT_SUBSCRIPTION_STATUS,
            currentPeriodStart: new Date(dto.subscription.currentPeriodStart),
            currentPeriodEnd: new Date(dto.subscription.currentPeriodEnd),
            trialEndsAt: optionalDate(dto.subscription.trialEndsAt),
          },
        });
      }

      if (dto.domain?.hostname?.trim()) {
        await tx.domain.create({
          data: {
            centerId: center.id,
            hostname: dto.domain.hostname.trim().toLowerCase(),
            type: dto.domain.type ?? 'CUSTOM',
            status: dto.domain.status ?? 'PENDING',
            isPrimary: dto.domain.isPrimary ?? true,
          },
        });
      }

      return tx.center.findUniqueOrThrow({
        where: { id: center.id },
        include: {
          branding: true,
          domains: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
          owner: true,
          subscriptions: { orderBy: { createdAt: 'desc' } },
          userRoles: {
            include: { role: true, user: true },
          },
        },
      });
    });
  }
}
