import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Prisma,
  UserStatus,
} from '../../../../../../packages/database/node_modules/@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';
import { hashPassword } from '../../../common/security/password-hashing';
import type {
  CreateTenantStaffDto,
  TenantStaffRole,
  TenantStaffStatus,
} from '../dto/create-tenant-staff.dto';
import type { UpdateTenantStaffStatusDto } from '../dto/update-tenant-staff-status.dto';
import type { UpdateTenantStaffDto } from '../dto/update-tenant-staff.dto';

type StaffPermission =
  | 'staff.view'
  | 'staff.create'
  | 'staff.update'
  | 'staff.activate';

const staffRoles = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'STAFF',
] as const;
const staffStatuses = ['ACTIVE', 'INACTIVE'] as const;

const rolePermissions: Record<string, StaffPermission[]> = {
  CENTER_OWNER: [
    'staff.view',
    'staff.create',
    'staff.update',
    'staff.activate',
  ],
  CENTER_MANAGER: [
    'staff.view',
    'staff.create',
    'staff.update',
    'staff.activate',
  ],
  DOCTOR: ['staff.view'],
  RECEPTIONIST: ['staff.view'],
  ACCOUNTANT: ['staff.view'],
  STAFF: ['staff.view'],
};

const staffAssignmentSelect = {
  id: true,
  centerId: true,
  status: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, key: true, name: true } },
  user: { select: safeUserSelect },
} satisfies Prisma.UserRoleSelect;

function optionalTrimmed(value?: string | null) {
  return typeof value === 'string' ? value.trim() : undefined;
}

function optionalLowerTrimmed(value?: string | null) {
  return optionalTrimmed(value)?.toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAllowedValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
): value is T[number] {
  return typeof value === 'string' && allowedValues.includes(value);
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({
    message: 'Validation failed',
    errors,
  });
}

function forbidden(permission: StaffPermission) {
  return new ForbiddenException({
    message: 'Permission denied',
    errors: {
      permission: `Missing permission: ${permission}`,
    },
  });
}

function formatStaffAssignment(
  assignment: Prisma.UserRoleGetPayload<{
    select: typeof staffAssignmentSelect;
  }>,
) {
  return {
    id: assignment.user.id,
    fullName: assignment.user.fullName,
    email: assignment.user.email,
    role: assignment.role.key,
    roleName: assignment.role.name,
    status: assignment.user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    assignmentStatus: assignment.status,
    createdAt: assignment.user.createdAt,
    updatedAt: assignment.updatedAt,
  };
}

function getRoleName(roleKey: TenantStaffRole) {
  return roleKey
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function getStaffValidation(
  dto: CreateTenantStaffDto | UpdateTenantStaffDto,
  isCreate: boolean,
) {
  const errors: Record<string, string> = {};
  const fullName = optionalTrimmed(dto.fullName);
  const email = optionalLowerTrimmed(dto.email);
  const password = optionalTrimmed(
    'password' in dto ? dto.password : undefined,
  );
  const role = optionalTrimmed(dto.role)?.toUpperCase();
  const status = optionalTrimmed(dto.status)?.toUpperCase();

  if ((isCreate || dto.fullName !== undefined) && !fullName) {
    errors.fullName = 'Staff name is required.';
  }

  if (
    (isCreate || dto.email !== undefined) &&
    (!email || !isValidEmail(email))
  ) {
    errors.email = 'Enter a valid staff email.';
  }

  if (
    (isCreate || dto.role !== undefined) &&
    !isAllowedValue(role, staffRoles)
  ) {
    errors.role = 'Select a valid staff role.';
  }

  if (dto.status !== undefined && !isAllowedValue(status, staffStatuses)) {
    errors.status = 'Select a valid staff status.';
  }

  if (isCreate && !password) {
    errors.password = 'Password is required.';
  } else if (password && password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (Object.keys(errors).length > 0) {
    throw validationFailed(errors);
  }

  return {
    email,
    fullName,
    password,
    role: role as TenantStaffRole | undefined,
    status: status as TenantStaffStatus | undefined,
  };
}

@Injectable()
export class TenantStaffService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    centerId: string,
    roleKey: string,
    query?: { role?: string; search?: string; status?: string },
  ) {
    this.requirePermission(roleKey, 'staff.view');

    const prisma = await this.prisma.getClient();
    const role = optionalTrimmed(query?.role)?.toUpperCase();
    const status = optionalTrimmed(query?.status)?.toUpperCase();
    const search = optionalTrimmed(query?.search);
    const where: Prisma.UserRoleWhereInput = {
      centerId,
      status: { not: 'REVOKED' },
      role: {
        scope: 'CENTER',
        key: {
          in: isAllowedValue(role, staffRoles) ? [role] : [...staffRoles],
        },
        status: 'ACTIVE',
      },
      user: {
        deletedAt: null,
        ...(isAllowedValue(status, staffStatuses)
          ? { status: status as UserStatus }
          : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    };

    const [items, total] = await Promise.all([
      prisma.userRole.findMany({
        where,
        orderBy: [{ user: { fullName: 'asc' } }, { assignedAt: 'asc' }],
        select: staffAssignmentSelect,
      }),
      prisma.userRole.count({ where }),
    ]);

    return {
      items: items.map(formatStaffAssignment),
      total,
    };
  }

  async create(centerId: string, roleKey: string, dto: CreateTenantStaffDto) {
    this.requirePermission(roleKey, 'staff.create');
    const validation = getStaffValidation(dto, true);
    const prisma = await this.prisma.getClient();

    await this.throwDuplicateEmail(validation.email);

    const passwordHash = await hashPassword(validation.password as string);

    return prisma.$transaction(async (tx) => {
      const role = await this.ensureCenterRole(
        tx,
        centerId,
        validation.role ?? 'STAFF',
      );
      const user = await tx.user.create({
        data: {
          email: validation.email,
          fullName: validation.fullName ?? '',
          passwordHash,
          status: validation.status ?? 'ACTIVE',
        },
        select: { id: true },
      });
      const assignment = await tx.userRole.create({
        data: {
          centerId,
          roleId: role.id,
          status: validation.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          userId: user.id,
        },
        select: staffAssignmentSelect,
      });

      return formatStaffAssignment(assignment);
    });
  }

  async getById(centerId: string, roleKey: string, userId: string) {
    this.requirePermission(roleKey, 'staff.view');

    const prisma = await this.prisma.getClient();
    const assignment = await this.getAssignment(prisma, centerId, userId);

    return formatStaffAssignment(assignment);
  }

  async update(
    centerId: string,
    roleKey: string,
    userId: string,
    dto: UpdateTenantStaffDto,
  ) {
    this.requirePermission(roleKey, 'staff.update');
    const validation = getStaffValidation(dto, false);
    const prisma = await this.prisma.getClient();

    await this.throwDuplicateEmail(validation.email, userId);

    const passwordHash = validation.password
      ? await hashPassword(validation.password)
      : undefined;

    return prisma.$transaction(async (tx) => {
      const current = await this.getAssignment(tx, centerId, userId);
      const nextRole = validation.role
        ? await this.ensureCenterRole(tx, centerId, validation.role)
        : current.role;

      await tx.user.update({
        where: { id: userId },
        data: {
          ...(validation.email !== undefined
            ? { email: validation.email }
            : {}),
          ...(validation.fullName !== undefined
            ? { fullName: validation.fullName }
            : {}),
          ...(passwordHash ? { passwordHash } : {}),
          ...(validation.status !== undefined
            ? { status: validation.status }
            : {}),
        },
        select: { id: true },
      });

      const assignment = await tx.userRole.update({
        where: { id: current.id },
        data: {
          roleId: nextRole.id,
          ...(validation.status !== undefined
            ? { status: validation.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' }
            : {}),
          revokedAt: null,
        },
        select: staffAssignmentSelect,
      });

      return formatStaffAssignment(assignment);
    });
  }

  async updateStatus(
    centerId: string,
    roleKey: string,
    userId: string,
    dto: UpdateTenantStaffStatusDto,
  ) {
    this.requirePermission(roleKey, 'staff.activate');
    const status = optionalTrimmed(dto.status)?.toUpperCase();

    if (!isAllowedValue(status, staffStatuses)) {
      throw validationFailed({ status: 'Select a valid staff status.' });
    }

    const prisma = await this.prisma.getClient();

    return prisma.$transaction(async (tx) => {
      const current = await this.getAssignment(tx, centerId, userId);
      await tx.user.update({
        where: { id: userId },
        data: { status: status },
        select: { id: true },
      });
      const assignment = await tx.userRole.update({
        where: { id: current.id },
        data: {
          revokedAt: null,
          status: status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        },
        select: staffAssignmentSelect,
      });

      return formatStaffAssignment(assignment);
    });
  }

  private requirePermission(roleKey: string, permission: StaffPermission) {
    if (!rolePermissions[roleKey]?.includes(permission)) {
      throw forbidden(permission);
    }
  }

  private async throwDuplicateEmail(email?: string, userId?: string) {
    if (!email) {
      return;
    }

    const prisma = await this.prisma.getClient();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: {
          email: 'Email is already used by another user.',
        },
      });
    }
  }

  private async getAssignment(
    prisma: Prisma.TransactionClient | PrismaServiceClient,
    centerId: string,
    userId: string,
  ) {
    const assignment = await prisma.userRole.findFirst({
      where: {
        centerId,
        userId,
        status: { not: 'REVOKED' },
        role: {
          key: { in: [...staffRoles] },
          scope: 'CENTER',
        },
        user: { deletedAt: null },
      },
      select: staffAssignmentSelect,
    });

    if (!assignment) {
      throw new NotFoundException({
        message: 'Staff member not found',
        errors: { staff: 'Staff member not found.' },
      });
    }

    return assignment;
  }

  private async ensureCenterRole(
    tx: Prisma.TransactionClient,
    centerId: string,
    roleKey: TenantStaffRole,
  ) {
    const existing = await tx.role.findFirst({
      where: { centerId, key: roleKey, scope: 'CENTER', status: 'ACTIVE' },
      select: { id: true, key: true, name: true },
    });

    if (existing) {
      return existing;
    }

    return tx.role.create({
      data: {
        centerId,
        description: `${getRoleName(roleKey)} center staff role.`,
        key: roleKey,
        name: getRoleName(roleKey),
        scope: 'CENTER',
      },
      select: { id: true, key: true, name: true },
    });
  }
}

type PrismaServiceClient = Awaited<ReturnType<PrismaService['getClient']>>;
