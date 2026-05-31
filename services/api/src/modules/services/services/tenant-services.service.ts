import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type ServiceFollowUpType,
} from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';
import type { CreateTenantServiceDto } from '../dto/create-service.dto';
import type { UpdateTenantServiceStatusDto } from '../dto/update-service-status.dto';
import type { UpdateTenantServiceDto } from '../dto/update-service.dto';

type ServicePermission =
  | 'services:view'
  | 'services:create'
  | 'services:update'
  | 'services:archive'
  | 'services:status'
  | 'services:delete';

type ServiceLanguage = 'EN' | 'AR' | 'HE';

type LocalizedServiceFields = {
  name: 'nameEn' | 'nameAr' | 'nameHe';
};

const serviceSelect = {
  id: true,
  centerId: true,
  nameEn: true,
  nameAr: true,
  nameHe: true,
  descriptionEn: true,
  descriptionAr: true,
  descriptionHe: true,
  bufferMinutes: true,
  followUpEnabled: true,
  followUpType: true,
  defaultIntervalDays: true,
  totalRecommendedSessions: true,
  autoCreateNextReminder: true,
  reminderMessageAr: true,
  reminderMessageEn: true,
  reminderMessageHe: true,
  followUpRules: true,
  durationMinutes: true,
  price: true,
  currency: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;

function optionalTrimmed(value?: string | null) {
  return typeof value === 'string' ? value.trim() : value;
}

function forbidden(permission: ServicePermission) {
  return new ForbiddenException({
    message: 'Permission denied',
    errors: {
      permission: `Missing permission: ${permission}`,
    },
  });
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({
    message: 'Validation failed',
    errors,
  });
}

function parseIntegerField(value: number | string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 'invalid';
  }

  return parsed;
}

function parseBufferMinutesField(value: number | string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 240) {
    return 'invalid';
  }

  return parsed;
}

function parsePositiveIntegerField(value: number | string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 3650) {
    return 'invalid';
  }

  return parsed;
}

function parsePriceField(value: number | string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 'invalid';
  }

  return new Prisma.Decimal(parsed.toFixed(2));
}

function normalizeCurrency(value?: string | null) {
  return optionalTrimmed(value)?.toUpperCase() ?? 'ILS';
}

function isValidCurrency(value: string) {
  return /^[A-Z]{3}$/.test(value);
}

function parseFollowUpRules(value: CreateTenantServiceDto['followUpRules']) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return 'invalid';
  }

  const normalized = value.map((rule) => ({
    fromSessionNumber: Number(rule?.fromSessionNumber),
    intervalDays: Number(rule?.intervalDays),
    toSessionNumber: Number(rule?.toSessionNumber),
  }));

  const isInvalid = normalized.some(
    (rule) =>
      !Number.isInteger(rule.fromSessionNumber) ||
      !Number.isInteger(rule.toSessionNumber) ||
      !Number.isInteger(rule.intervalDays) ||
      rule.fromSessionNumber <= 0 ||
      rule.toSessionNumber < rule.fromSessionNumber ||
      rule.intervalDays <= 0 ||
      rule.intervalDays > 3650,
  );

  if (isInvalid) {
    return 'invalid';
  }

  return normalized;
}

function localizedFieldsForLanguage(language: string): LocalizedServiceFields {
  if (language === 'AR') {
    return { name: 'nameAr' };
  }

  if (language === 'HE') {
    return { name: 'nameHe' };
  }

  return { name: 'nameEn' };
}

@Injectable()
export class TenantServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(centerId: string, permissions: string[]) {
    this.requirePermission(permissions, 'services:view');

    const t0 = Date.now();
    const prisma = await this.prisma.getClient();
    const [items, total] = await Promise.all([
      prisma.service.findMany({
        where: { centerId },
        orderBy: { createdAt: 'desc' },
        select: serviceSelect,
      }),
      prisma.service.count({ where: { centerId } }),
    ]);

    if (items.length === 0) {
      return { items: [], total };
    }

    const serviceIds = items.map((s) => s.id);

    const [appointmentGroups, invoiceGroups, bookingGroups, followUpGroups] =
      await Promise.all([
        prisma.appointment.groupBy({
          by: ['serviceId'],
          where: { serviceId: { in: serviceIds } },
          _count: { _all: true },
        }),
        prisma.invoice.groupBy({
          by: ['serviceId'],
          where: { serviceId: { in: serviceIds } },
          _count: { _all: true },
        }),
        prisma.bookingRequest.groupBy({
          by: ['serviceId'],
          where: { serviceId: { in: serviceIds } },
          _count: { _all: true },
        }),
        prisma.patientFollowUp.groupBy({
          by: ['serviceId'],
          where: { serviceId: { in: serviceIds } },
          _count: { _all: true },
        }),
      ]);

    const linkedIds = new Set<string>(
      [
        ...appointmentGroups,
        ...invoiceGroups,
        ...bookingGroups,
        ...followUpGroups,
      ]
        .filter((r) => r.serviceId !== null && r._count._all > 0)
        .map((r) => r.serviceId as string),
    );

    console.debug(
      `[services:list] centerId=${centerId} found=${total} in ${Date.now() - t0}ms`,
    );

    return {
      items: items.map((s) => ({
        ...s,
        safeDeleteAllowed: !linkedIds.has(s.id),
      })),
      total,
    };
  }

  async create(
    centerId: string,
    permissions: string[],
    primaryLanguage: ServiceLanguage,
    dto: CreateTenantServiceDto,
  ) {
    this.requirePermission(permissions, 'services:create');

    const validated = this.validateCreate(dto, primaryLanguage);
    const prisma = await this.prisma.getClient();

    return prisma.service.create({
      data: {
        centerId,
        ...validated,
      },
      select: serviceSelect,
    });
  }

  async getById(centerId: string, permissions: string[], serviceId: string) {
    this.requirePermission(permissions, 'services:view');

    const prisma = await this.prisma.getClient();
    const service = await prisma.service.findFirst({
      where: { centerId, id: serviceId },
      select: serviceSelect,
    });

    if (!service) {
      throw new NotFoundException({
        message: 'Service not found',
        errors: { service: 'Service not found.' },
      });
    }

    const [appointmentCount, invoiceCount, bookingCount, followUpCount] =
      await Promise.all([
        prisma.appointment.count({ where: { serviceId } }),
        prisma.invoice.count({ where: { serviceId } }),
        prisma.bookingRequest.count({ where: { serviceId } }),
        prisma.patientFollowUp.count({ where: { serviceId } }),
      ]);

    return {
      ...service,
      safeDeleteAllowed:
        appointmentCount === 0 &&
        invoiceCount === 0 &&
        bookingCount === 0 &&
        followUpCount === 0,
    };
  }

  async update(
    centerId: string,
    permissions: string[],
    primaryLanguage: ServiceLanguage,
    serviceId: string,
    dto: UpdateTenantServiceDto,
  ) {
    this.requirePermission(permissions, 'services:update');
    await this.getById(centerId, permissions, serviceId);

    const validated = this.validateUpdate(dto, primaryLanguage);
    const prisma = await this.prisma.getClient();

    const result = await prisma.service.updateMany({
      where: { id: serviceId, centerId },
      data: validated,
    });

    if (result.count !== 1) {
      throw new NotFoundException({
        message: 'Service not found',
        errors: { service: 'Service not found.' },
      });
    }

    return this.getById(centerId, permissions, serviceId);
  }

  async updateStatus(
    centerId: string,
    permissions: string[],
    serviceId: string,
    dto: UpdateTenantServiceStatusDto,
  ) {
    if (dto.isActive === true) {
      this.requirePermission(permissions, 'services:status');
    } else if (dto.isActive === false) {
      this.requirePermission(permissions, 'services:archive');
    } else {
      throw validationFailed({ isActive: 'Select a valid service status.' });
    }

    await this.getById(centerId, permissions, serviceId);

    const prisma = await this.prisma.getClient();

    const result = await prisma.service.updateMany({
      where: { id: serviceId, centerId },
      data: {
        isActive: dto.isActive,
        archivedAt: dto.isActive ? null : new Date(),
      },
    });

    if (result.count !== 1) {
      throw new NotFoundException({
        message: 'Service not found',
        errors: { service: 'Service not found.' },
      });
    }

    return this.getById(centerId, permissions, serviceId);
  }

  async safeDelete(centerId: string, permissions: string[], serviceId: string) {
    this.requirePermission(permissions, 'services:delete');

    const prisma = await this.prisma.getClient();

    const service = await prisma.service.findFirst({
      where: { centerId, id: serviceId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException({
        message: 'Service not found',
        errors: { service: 'Service not found.' },
      });
    }

    const [appointmentCount, invoiceCount, bookingCount, followUpCount] =
      await Promise.all([
        prisma.appointment.count({ where: { serviceId } }),
        prisma.invoice.count({ where: { serviceId } }),
        prisma.bookingRequest.count({ where: { serviceId } }),
        prisma.patientFollowUp.count({ where: { serviceId } }),
      ]);

    if (
      appointmentCount > 0 ||
      invoiceCount > 0 ||
      bookingCount > 0 ||
      followUpCount > 0
    ) {
      throw new BadRequestException({
        message: 'Delete blocked',
        errors: {
          service:
            'This service cannot be deleted because it has linked records.',
        },
        counts: {
          appointments: appointmentCount,
          invoices: invoiceCount,
          bookingRequests: bookingCount,
          followUps: followUpCount,
        },
      });
    }

    await prisma.service.delete({ where: { id: serviceId } });

    return { deleted: true };
  }

  private requirePermission(
    permissions: string[],
    permission: ServicePermission,
  ) {
    if (!hasTenantPermission(permissions, permission)) {
      throw forbidden(permission);
    }
  }

  private validateCreate(
    dto: CreateTenantServiceDto,
    primaryLanguage: ServiceLanguage,
  ) {
    const data = this.validateShared(dto, true, primaryLanguage);

    return {
      nameEn: (data.nameEn as string | undefined) ?? '',
      nameAr: (data.nameAr as string | undefined) ?? '',
      nameHe: (data.nameHe as string | undefined) ?? '',
      descriptionEn: (data.descriptionEn as string | null | undefined) ?? null,
      descriptionAr: (data.descriptionAr as string | null | undefined) ?? null,
      descriptionHe: (data.descriptionHe as string | null | undefined) ?? null,
      durationMinutes:
        (data.durationMinutes as number | null | undefined) ?? null,
      bufferMinutes: (data.bufferMinutes as number | undefined) ?? 0,
      followUpEnabled: (data.followUpEnabled as boolean | undefined) ?? false,
      followUpType:
        (data.followUpType as ServiceFollowUpType | undefined) ??
        'FIXED_INTERVAL',
      defaultIntervalDays:
        (data.defaultIntervalDays as number | null | undefined) ?? null,
      totalRecommendedSessions:
        (data.totalRecommendedSessions as number | null | undefined) ?? null,
      autoCreateNextReminder:
        (data.autoCreateNextReminder as boolean | undefined) ?? true,
      reminderMessageAr:
        (data.reminderMessageAr as string | null | undefined) ?? null,
      reminderMessageEn:
        (data.reminderMessageEn as string | null | undefined) ?? null,
      reminderMessageHe:
        (data.reminderMessageHe as string | null | undefined) ?? null,
      followUpRules:
        (data.followUpRules as Prisma.InputJsonValue | null | undefined) ??
        Prisma.JsonNull,
      price: (data.price as Prisma.Decimal | null | undefined) ?? null,
      currency: data.currency as string,
      isActive: (data.isActive as boolean | undefined) ?? true,
    };
  }

  private validateUpdate(
    dto: UpdateTenantServiceDto,
    primaryLanguage: ServiceLanguage,
  ) {
    return this.validateShared(dto, false, primaryLanguage);
  }

  private validateShared(
    dto: CreateTenantServiceDto | UpdateTenantServiceDto,
    isCreate: boolean,
    primaryLanguage: ServiceLanguage,
  ) {
    const errors: Record<string, string> = {};
    const data: Prisma.ServiceUpdateInput = {};
    const requiredFields = localizedFieldsForLanguage(primaryLanguage);

    for (const field of ['nameEn', 'nameAr', 'nameHe'] as const) {
      const value = optionalTrimmed(dto[field]);
      const isRequired = field === requiredFields.name;

      if (isCreate || dto[field] !== undefined) {
        if (!value) {
          if (isRequired) {
            errors[field] = 'Service name is required.';
          } else {
            data[field] = '';
          }
        } else {
          data[field] = value;
        }
      }
    }

    for (const field of [
      'descriptionEn',
      'descriptionAr',
      'descriptionHe',
    ] as const) {
      const value = optionalTrimmed(dto[field]);
      if (isCreate || dto[field] !== undefined) {
        data[field] = value || null;
      }
    }

    const durationMinutes = parseIntegerField(dto.durationMinutes);

    if (durationMinutes === 'invalid') {
      errors.durationMinutes = 'Enter a valid duration.';
    } else if (durationMinutes !== undefined) {
      data.durationMinutes = durationMinutes;
    }

    const bufferMinutes = parseBufferMinutesField(dto.bufferMinutes);

    if (bufferMinutes === 'invalid') {
      errors.bufferMinutes = 'Enter a valid buffer time from 0 to 240 minutes.';
    } else if (bufferMinutes !== undefined) {
      data.bufferMinutes = bufferMinutes ?? 0;
    }

    if (isCreate || dto.followUpEnabled !== undefined) {
      if (
        dto.followUpEnabled !== undefined &&
        typeof dto.followUpEnabled !== 'boolean'
      ) {
        errors.followUpEnabled = 'Select a valid follow-up setting.';
      } else {
        data.followUpEnabled = dto.followUpEnabled ?? false;
      }
    }

    if (isCreate || dto.followUpType !== undefined) {
      if (
        dto.followUpType &&
        dto.followUpType !== 'FIXED_INTERVAL' &&
        dto.followUpType !== 'SESSION_PLAN'
      ) {
        errors.followUpType = 'Select a valid follow-up type.';
      } else {
        data.followUpType = dto.followUpType ?? 'FIXED_INTERVAL';
      }
    }

    const defaultIntervalDays = parsePositiveIntegerField(
      dto.defaultIntervalDays,
    );
    if (defaultIntervalDays === 'invalid') {
      errors.defaultIntervalDays = 'Enter a valid follow-up interval.';
    } else if (defaultIntervalDays !== undefined) {
      data.defaultIntervalDays = defaultIntervalDays;
    }

    const totalRecommendedSessions = parsePositiveIntegerField(
      dto.totalRecommendedSessions,
    );
    if (totalRecommendedSessions === 'invalid') {
      errors.totalRecommendedSessions =
        'Enter a valid number of recommended sessions.';
    } else if (totalRecommendedSessions !== undefined) {
      data.totalRecommendedSessions = totalRecommendedSessions;
    }

    if (isCreate || dto.autoCreateNextReminder !== undefined) {
      if (
        dto.autoCreateNextReminder !== undefined &&
        typeof dto.autoCreateNextReminder !== 'boolean'
      ) {
        errors.autoCreateNextReminder =
          'Select a valid automatic reminder setting.';
      } else {
        data.autoCreateNextReminder = dto.autoCreateNextReminder ?? true;
      }
    }

    for (const field of [
      'reminderMessageAr',
      'reminderMessageEn',
      'reminderMessageHe',
    ] as const) {
      const value = optionalTrimmed(dto[field]);
      if (isCreate || dto[field] !== undefined) {
        data[field] = value || null;
      }
    }

    const followUpRules = parseFollowUpRules(dto.followUpRules);
    if (followUpRules === 'invalid') {
      errors.followUpRules = 'Enter valid session-plan follow-up rules.';
    } else if (followUpRules !== undefined) {
      data.followUpRules =
        followUpRules === null ? Prisma.JsonNull : followUpRules;
    }

    const price = parsePriceField(dto.price);

    if (price === 'invalid') {
      errors.price = 'Enter a valid price.';
    } else if (price !== undefined) {
      data.price = price;
    }

    const currency = normalizeCurrency(dto.currency);

    if (isCreate || dto.currency !== undefined) {
      if (!isValidCurrency(currency)) {
        errors.currency = 'Enter a valid currency code.';
      } else {
        data.currency = currency;
      }
    }

    if (dto.isActive !== undefined) {
      if (typeof dto.isActive !== 'boolean') {
        errors.isActive = 'Select a valid service status.';
      } else {
        data.isActive = dto.isActive;
        data.archivedAt = dto.isActive ? null : new Date();
      }
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    return data;
  }
}
