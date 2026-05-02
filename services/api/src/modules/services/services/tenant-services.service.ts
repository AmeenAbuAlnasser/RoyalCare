import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../../../packages/database/node_modules/@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import type { CreateTenantServiceDto } from '../dto/create-service.dto';
import type { UpdateTenantServiceStatusDto } from '../dto/update-service-status.dto';
import type { UpdateTenantServiceDto } from '../dto/update-service.dto';

type ServicePermission =
  | 'services.view'
  | 'services.create'
  | 'services.update'
  | 'services.archive'
  | 'services.activate';

type ServiceLanguage = 'EN' | 'AR' | 'HE';

type LocalizedServiceFields = {
  name: 'nameEn' | 'nameAr' | 'nameHe';
};

const rolePermissions: Record<string, ServicePermission[]> = {
  CENTER_OWNER: [
    'services.view',
    'services.create',
    'services.update',
    'services.archive',
    'services.activate',
  ],
  CENTER_MANAGER: [
    'services.view',
    'services.create',
    'services.update',
    'services.archive',
    'services.activate',
  ],
  DOCTOR: ['services.view'],
  RECEPTIONIST: ['services.view'],
  ACCOUNTANT: ['services.view'],
  STAFF: ['services.view'],
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

function hasPermission(roleKey: string, permission: ServicePermission) {
  return rolePermissions[roleKey]?.includes(permission) ?? false;
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

  async list(centerId: string, roleKey: string) {
    this.requirePermission(roleKey, 'services.view');

    const prisma = await this.prisma.getClient();
    const [items, total] = await Promise.all([
      prisma.service.findMany({
        where: { centerId },
        orderBy: { createdAt: 'desc' },
        select: serviceSelect,
      }),
      prisma.service.count({ where: { centerId } }),
    ]);

    return { items, total };
  }

  async create(
    centerId: string,
    roleKey: string,
    primaryLanguage: ServiceLanguage,
    dto: CreateTenantServiceDto,
  ) {
    this.requirePermission(roleKey, 'services.create');

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

  async getById(centerId: string, roleKey: string, serviceId: string) {
    this.requirePermission(roleKey, 'services.view');

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

    return service;
  }

  async update(
    centerId: string,
    roleKey: string,
    primaryLanguage: ServiceLanguage,
    serviceId: string,
    dto: UpdateTenantServiceDto,
  ) {
    this.requirePermission(roleKey, 'services.update');
    await this.getById(centerId, roleKey, serviceId);

    const validated = this.validateUpdate(dto, primaryLanguage);
    const prisma = await this.prisma.getClient();

    return prisma.service.update({
      where: { id: serviceId },
      data: validated,
      select: serviceSelect,
    });
  }

  async updateStatus(
    centerId: string,
    roleKey: string,
    serviceId: string,
    dto: UpdateTenantServiceStatusDto,
  ) {
    if (dto.isActive === true) {
      this.requirePermission(roleKey, 'services.activate');
    } else if (dto.isActive === false) {
      this.requirePermission(roleKey, 'services.archive');
    } else {
      throw validationFailed({ isActive: 'Select a valid service status.' });
    }

    await this.getById(centerId, roleKey, serviceId);

    const prisma = await this.prisma.getClient();

    return prisma.service.update({
      where: { id: serviceId },
      data: {
        isActive: dto.isActive,
        archivedAt: dto.isActive ? null : new Date(),
      },
      select: serviceSelect,
    });
  }

  private requirePermission(roleKey: string, permission: ServicePermission) {
    if (!hasPermission(roleKey, permission)) {
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
