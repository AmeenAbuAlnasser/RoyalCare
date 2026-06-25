import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type RecurringIntervalUnit,
  type ServiceFollowUpMode,
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
  followUpMode: true,
  defaultIntervalDays: true,
  totalRecommendedSessions: true,
  recurringIntervalValue: true,
  recurringIntervalUnit: true,
  autoWhatsappReminderEnabled: true,
  autoReminderDaysBefore: true,
  autoCreateNextReminder: true,
  reminderMessageAr: true,
  reminderMessageEn: true,
  reminderMessageHe: true,
  followUpRules: true,
  treatmentTemplates: {
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      nameHe: true,
      totalSessions: true,
      defaultIntervalDays: true,
      phases: true,
      isDefault: true,
      isActive: true,
      sortOrder: true,
    },
  },
  durationMinutes: true,
  price: true,
  currency: true,
  coverImageUrl: true,
  coverImageBlurhash: true,
  coverImageAlt: true,
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

function parseReminderDaysField(value: number | string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3650) {
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

function isValidCoverImageUrl(value: string): boolean {
  if (
    value.startsWith('/uploads/') ||
    value.startsWith('/images/') ||
    value.startsWith('/assets/')
  ) {
    return true;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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

function calculateTotalSessionsFromRules(
  rules: Array<{ toSessionNumber: number }> | null | undefined,
) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return null;
  }

  const totals = rules
    .map((rule) => rule.toSessionNumber)
    .filter((value) => Number.isInteger(value) && value > 0);

  return totals.length > 0 ? Math.max(...totals) : null;
}

type TreatmentTemplateInput =
  NonNullable<CreateTenantServiceDto['treatmentTemplates']>[number];

type NormalizedTreatmentTemplate = {
  id: string | null;
  nameAr: string;
  nameEn: string;
  nameHe: string;
  totalSessions: number;
  defaultIntervalDays: number | null;
  phases: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

function parseTreatmentTemplates(
  value: CreateTenantServiceDto['treatmentTemplates'],
) {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value)) return 'invalid' as const;

  const normalized: NormalizedTreatmentTemplate[] = [];
  let defaultSeen = false;

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index] as TreatmentTemplateInput | undefined;
    if (!item) return 'invalid' as const;

    const totalSessions = Number(item.totalSessions);
    const defaultIntervalDays =
      item.defaultIntervalDays === null ||
      item.defaultIntervalDays === undefined ||
      item.defaultIntervalDays === ''
        ? null
        : Number(item.defaultIntervalDays);
    const sortOrder =
      item.sortOrder === null ||
      item.sortOrder === undefined ||
      item.sortOrder === ''
        ? index
        : Number(item.sortOrder);

    if (
      !Number.isInteger(totalSessions) ||
      totalSessions <= 0 ||
      totalSessions > 200 ||
      (defaultIntervalDays !== null &&
        (!Number.isInteger(defaultIntervalDays) ||
          defaultIntervalDays <= 0 ||
          defaultIntervalDays > 3650)) ||
      !Number.isInteger(sortOrder)
    ) {
      return 'invalid' as const;
    }

    const phases = parseFollowUpRules(
      (item.phases ?? null) as CreateTenantServiceDto['followUpRules'],
    );
    if (phases === 'invalid') return 'invalid' as const;
    const normalizedPhases = phases ?? null;
    const derivedTotalSessions =
      Array.isArray(normalizedPhases) && normalizedPhases.length > 0
        ? calculateTotalSessionsFromRules(normalizedPhases)
        : null;

    const isDefault = item.isDefault === true && !defaultSeen;
    if (isDefault) defaultSeen = true;

    normalized.push({
      id: optionalTrimmed(item.id) ?? null,
      nameAr: optionalTrimmed(item.nameAr) ?? '',
      nameEn: optionalTrimmed(item.nameEn) ?? '',
      nameHe: optionalTrimmed(item.nameHe) ?? '',
      totalSessions: derivedTotalSessions ?? totalSessions,
      defaultIntervalDays,
      phases: normalizedPhases === null ? Prisma.JsonNull : normalizedPhases,
      isDefault,
      isActive: item.isActive !== false,
      sortOrder,
    });
  }

  if (!defaultSeen && normalized.length > 0) {
    normalized[0].isDefault = true;
  }

  return normalized;
}

function normalizeFollowUpMode(
  dto: CreateTenantServiceDto | UpdateTenantServiceDto,
  isCreate: boolean,
): ServiceFollowUpMode | undefined {
  if (dto.followUpMode) {
    return dto.followUpMode;
  }

  if (dto.followUpEnabled !== undefined) {
    return dto.followUpEnabled ? 'SESSION_BASED_PLAN' : 'NONE';
  }

  return isCreate ? 'NONE' : undefined;
}

function isValidRecurringIntervalUnit(
  value: unknown,
): value is RecurringIntervalUnit {
  return value === 'DAY' || value === 'WEEK' || value === 'MONTH' || value === 'YEAR';
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
    const templates = this.validateTreatmentTemplates(dto);
    const prisma = await this.prisma.getClient();

    const created = await prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          centerId,
          ...validated,
        },
        select: { id: true },
      });

      if (templates !== undefined) {
        await this.syncTreatmentTemplates(tx, service.id, templates);
      }

      return service;
    });

    return this.getById(centerId, permissions, created.id);
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
    const templates = this.validateTreatmentTemplates(dto);
    const prisma = await this.prisma.getClient();

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.service.updateMany({
        where: { id: serviceId, centerId },
        data: validated,
      });

      if (updateResult.count === 1 && templates !== undefined) {
        await this.syncTreatmentTemplates(tx, serviceId, templates);
      }

      return updateResult;
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

  private validateTreatmentTemplates(
    dto: CreateTenantServiceDto | UpdateTenantServiceDto,
  ) {
    const parsed = parseTreatmentTemplates(dto.treatmentTemplates);
    if (parsed === 'invalid') {
      throw validationFailed({
        treatmentTemplates: 'Enter valid treatment plan templates.',
      });
    }
    return parsed;
  }

  private async syncTreatmentTemplates(
    tx: Prisma.TransactionClient,
    serviceId: string,
    templates: NormalizedTreatmentTemplate[],
  ) {
    const incomingIds = templates
      .map((template) => template.id)
      .filter((id): id is string => Boolean(id));

    await tx.serviceTreatmentTemplate.deleteMany({
      where: {
        serviceId,
        ...(incomingIds.length > 0 ? { id: { notIn: incomingIds } } : {}),
      },
    });

    for (const template of templates) {
      const data = {
        defaultIntervalDays: template.defaultIntervalDays,
        isActive: template.isActive,
        isDefault: template.isDefault,
        nameAr: template.nameAr,
        nameEn: template.nameEn,
        nameHe: template.nameHe,
        phases: template.phases,
        sortOrder: template.sortOrder,
        totalSessions: template.totalSessions,
      };

      if (template.id) {
        await tx.serviceTreatmentTemplate.updateMany({
          where: { id: template.id, serviceId },
          data,
        });
      } else {
        await tx.serviceTreatmentTemplate.create({
          data: {
            serviceId,
            ...data,
          },
        });
      }
    }

    const defaultTemplate = templates.find((template) => template.isDefault);
    if (defaultTemplate) {
      const resolvedDefault = await tx.serviceTreatmentTemplate.findFirst({
        where: {
          serviceId,
          ...(defaultTemplate.id
            ? { id: defaultTemplate.id }
            : {
                nameAr: defaultTemplate.nameAr,
                nameEn: defaultTemplate.nameEn,
                nameHe: defaultTemplate.nameHe,
                sortOrder: defaultTemplate.sortOrder,
              }),
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });

      if (resolvedDefault) {
        await tx.serviceTreatmentTemplate.updateMany({
          where: { serviceId, id: { not: resolvedDefault.id } },
          data: { isDefault: false },
        });
        await tx.serviceTreatmentTemplate.update({
          where: { id: resolvedDefault.id },
          data: { isDefault: true },
        });
      }
    }
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
      followUpMode:
        (data.followUpMode as ServiceFollowUpMode | undefined) ?? 'NONE',
      defaultIntervalDays:
        (data.defaultIntervalDays as number | null | undefined) ?? null,
      totalRecommendedSessions:
        (data.totalRecommendedSessions as number | null | undefined) ?? null,
      recurringIntervalValue:
        (data.recurringIntervalValue as number | null | undefined) ?? null,
      recurringIntervalUnit:
        (data.recurringIntervalUnit as RecurringIntervalUnit | null | undefined) ??
        null,
      autoWhatsappReminderEnabled:
        (data.autoWhatsappReminderEnabled as boolean | undefined) ?? false,
      autoReminderDaysBefore:
        (data.autoReminderDaysBefore as number | null | undefined) ?? null,
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
      coverImageUrl: (data.coverImageUrl as string | null | undefined) ?? null,
      coverImageBlurhash:
        (data.coverImageBlurhash as string | null | undefined) ?? null,
      coverImageAlt: (data.coverImageAlt as string | null | undefined) ?? null,
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

    // Cover image (optional). URL is validated; blurhash/alt are free text.
    if (isCreate || dto.coverImageUrl !== undefined) {
      const coverImageUrl = optionalTrimmed(dto.coverImageUrl);
      if (coverImageUrl) {
        if (coverImageUrl.length > 800 || !isValidCoverImageUrl(coverImageUrl)) {
          errors.coverImageUrl = 'Enter a valid cover image.';
        } else {
          data.coverImageUrl = coverImageUrl;
        }
      } else {
        data.coverImageUrl = null;
      }
    }

    if (isCreate || dto.coverImageBlurhash !== undefined) {
      const blurhash = optionalTrimmed(dto.coverImageBlurhash);
      data.coverImageBlurhash = blurhash ? blurhash.slice(0, 120) : null;
    }

    if (isCreate || dto.coverImageAlt !== undefined) {
      const alt = optionalTrimmed(dto.coverImageAlt);
      data.coverImageAlt = alt ? alt.slice(0, 200) : null;
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

    const followUpMode = normalizeFollowUpMode(dto, isCreate);

    if (followUpMode !== undefined) {
      if (
        followUpMode !== 'NONE' &&
        followUpMode !== 'SESSION_BASED_PLAN' &&
        followUpMode !== 'RECURRING_CONTINUOUS'
      ) {
        errors.followUpMode = 'Select a valid follow-up type.';
      } else {
        data.followUpMode = followUpMode;
        data.followUpEnabled = followUpMode !== 'NONE';
      }
    } else if (dto.followUpEnabled !== undefined) {
      if (typeof dto.followUpEnabled !== 'boolean') {
        errors.followUpEnabled = 'Select a valid follow-up setting.';
      } else {
        data.followUpEnabled = dto.followUpEnabled;
      }
    }

    const recurringIntervalValue = parsePositiveIntegerField(
      dto.recurringIntervalValue,
    );
    if (recurringIntervalValue === 'invalid') {
      errors.recurringIntervalValue = 'Enter a valid recurring interval.';
    } else if (recurringIntervalValue !== undefined) {
      data.recurringIntervalValue = recurringIntervalValue;
    }

    if (isCreate || dto.recurringIntervalUnit !== undefined) {
      if (
        dto.recurringIntervalUnit !== undefined &&
        dto.recurringIntervalUnit !== null &&
        !isValidRecurringIntervalUnit(dto.recurringIntervalUnit)
      ) {
        errors.recurringIntervalUnit = 'Select a valid recurring interval unit.';
      } else {
        data.recurringIntervalUnit =
          dto.recurringIntervalUnit === undefined
            ? null
            : dto.recurringIntervalUnit;
      }
    }

    if (isCreate || dto.autoWhatsappReminderEnabled !== undefined) {
      if (
        dto.autoWhatsappReminderEnabled !== undefined &&
        typeof dto.autoWhatsappReminderEnabled !== 'boolean'
      ) {
        errors.autoWhatsappReminderEnabled =
          'Select a valid automatic WhatsApp reminder setting.';
      } else {
        data.autoWhatsappReminderEnabled =
          dto.autoWhatsappReminderEnabled ?? false;
      }
    }

    const autoReminderDaysBefore = parseReminderDaysField(
      dto.autoReminderDaysBefore,
    );
    if (autoReminderDaysBefore === 'invalid') {
      errors.autoReminderDaysBefore =
        'Enter a valid reminder lead time.';
    } else if (autoReminderDaysBefore !== undefined) {
      data.autoReminderDaysBefore = autoReminderDaysBefore;
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
      if (Array.isArray(followUpRules)) {
        data.totalRecommendedSessions =
          calculateTotalSessionsFromRules(followUpRules);
      }
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

    const nextMode =
      (data.followUpMode as ServiceFollowUpMode | undefined) ??
      (dto.followUpEnabled === false ? 'NONE' : undefined);

    if (nextMode === 'NONE') {
      data.followUpEnabled = false;
      data.recurringIntervalValue = null;
      data.recurringIntervalUnit = null;
      data.autoWhatsappReminderEnabled = false;
      data.autoReminderDaysBefore = null;
    }

    if (nextMode === 'RECURRING_CONTINUOUS') {
      data.followUpEnabled = true;
      data.totalRecommendedSessions = null;
      data.followUpRules = Prisma.JsonNull;

      const hasRecurringValue =
        data.recurringIntervalValue !== undefined &&
        data.recurringIntervalValue !== null;
      const hasRecurringUnit =
        data.recurringIntervalUnit !== undefined &&
        data.recurringIntervalUnit !== null;

      if (!hasRecurringValue) {
        errors.recurringIntervalValue = 'Enter a recurring interval.';
      }

      if (!hasRecurringUnit) {
        errors.recurringIntervalUnit = 'Select a recurring interval unit.';
      }
    }

    if (nextMode === 'SESSION_BASED_PLAN') {
      const rules = data.followUpRules;
      const hasRules = Array.isArray(rules) && rules.length > 0;
      if (hasRules) {
        data.totalRecommendedSessions = calculateTotalSessionsFromRules(
          rules as Array<{ toSessionNumber: number }>,
        );
      }
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    return data;
  }
}
