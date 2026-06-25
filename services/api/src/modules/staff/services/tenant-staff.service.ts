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
} from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';
import { hashPassword } from '../../../common/security/password-hashing';
import { AuditService } from '../../audit/audit.service';
import type {
  CreateTenantStaffDto,
  TenantStaffRole,
  TenantStaffStatus,
} from '../dto/create-tenant-staff.dto';
import type { UpdateTenantStaffStatusDto } from '../dto/update-tenant-staff-status.dto';
import type { UpdateTenantStaffDto } from '../dto/update-tenant-staff.dto';

type StaffPermission =
  | 'staff:view'
  | 'staff:create'
  | 'staff:update'
  | 'staff:status';

const staffRoles = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'STAFF',
] as const;
const staffStatuses = ['ACTIVE', 'INACTIVE'] as const;
const defaultProviderRoles: TenantStaffRole[] = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'STAFF',
];

const staffAssignmentSelect = {
  id: true,
  centerId: true,
  status: true,
  providerEnabled: true,
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
  centerOwnerUserId?: string | null,
) {
  const isCenterOwner = centerOwnerUserId === assignment.user.id;
  const roles = [assignment.role.key as TenantStaffRole];

  if (isCenterOwner && !roles.includes('CENTER_OWNER')) {
    roles.unshift('CENTER_OWNER');
  }

  return {
    id: assignment.user.id,
    userId: assignment.user.id,
    name: assignment.user.fullName,
    fullName: assignment.user.fullName,
    email: assignment.user.email,
    phone: assignment.user.phone,
    role: assignment.role.key,
    roleName: assignment.role.name,
    roles,
    isCenterOwner,
    isActive: assignment.user.status === 'ACTIVE',
    providerEnabled: assignment.providerEnabled,
    status: assignment.user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    assignmentStatus: assignment.status,
    createdAt: assignment.user.createdAt,
    updatedAt: assignment.updatedAt,
  };
}

function aggregateStaffAssignments(
  assignments: Array<
    Prisma.UserRoleGetPayload<{
      select: typeof staffAssignmentSelect;
    }>
  >,
  centerOwnerUserId?: string | null,
) {
  const byUser = new Map<
    string,
    ReturnType<typeof formatStaffAssignment> & {
      roles: TenantStaffRole[];
      roleNames: string[];
    }
  >();

  for (const assignment of assignments) {
    const key = assignment.user.email?.trim().toLowerCase() || assignment.user.id;
    if (!key) continue;

    const role = assignment.role.key as TenantStaffRole;
    const current = byUser.get(key);

    if (!current) {
      byUser.set(key, {
        ...formatStaffAssignment(assignment, centerOwnerUserId),
        roleNames: [assignment.role.name],
      });
      continue;
    }

    if (!current.roles.includes(role)) {
      current.roles.push(role);
      current.roleNames.push(assignment.role.name);
    }

    current.providerEnabled =
      current.providerEnabled || assignment.providerEnabled;

    if (centerOwnerUserId === assignment.user.id) {
      current.isCenterOwner = true;
      if (!current.roles.includes('CENTER_OWNER')) {
        current.roles.unshift('CENTER_OWNER');
        current.roleNames.unshift('Center Owner');
      }
    }

    if (assignment.updatedAt > current.updatedAt) {
      current.updatedAt = assignment.updatedAt;
    }
  }

  const roleOrder = new Map<TenantStaffRole, number>(
    staffRoles.map((role, index) => [role, index]),
  );

  return [...byUser.values()].map((item) => {
    const roles = [...item.roles].sort(
      (a, b) => (roleOrder.get(a) ?? 99) - (roleOrder.get(b) ?? 99),
    );

    return {
      ...item,
      role: roles[0] ?? item.role,
      roles,
    };
  });
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
  const providerEnabled =
    typeof dto.providerEnabled === 'boolean' ? dto.providerEnabled : undefined;

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
    providerEnabled,
    role: role as TenantStaffRole | undefined,
    status: status as TenantStaffStatus | undefined,
  };
}

function defaultProviderEnabled(role?: TenantStaffRole) {
  return role ? defaultProviderRoles.includes(role) : false;
}

@Injectable()
export class TenantStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(
    centerId: string,
    permissions: string[],
    query?: { role?: string; search?: string; status?: string },
  ) {
    this.requirePermission(permissions, 'staff:view');

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
          in: [...staffRoles],
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

    const [items, center] = await Promise.all([
      prisma.userRole.findMany({
        where,
        orderBy: [{ user: { fullName: 'asc' } }, { assignedAt: 'asc' }],
        select: staffAssignmentSelect,
      }),
      prisma.center.findUnique({
        where: { id: centerId },
        select: { ownerUserId: true },
      }),
    ]);
    const aggregatedItems = aggregateStaffAssignments(
      items,
      center?.ownerUserId,
    ).filter((item) =>
      isAllowedValue(role, staffRoles) ? item.roles.includes(role) : true,
    );

    return {
      items: aggregatedItems,
      total: aggregatedItems.length,
    };
  }

  async create(
    centerId: string,
    permissions: string[],
    dto: CreateTenantStaffDto,
  ) {
    this.requirePermission(permissions, 'staff:create');
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
          providerEnabled:
            validation.providerEnabled ??
            defaultProviderEnabled(validation.role ?? 'STAFF'),
          roleId: role.id,
          status: validation.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          userId: user.id,
        },
        select: staffAssignmentSelect,
      });

      return formatStaffAssignment(assignment);
    });
  }

  async getById(centerId: string, permissions: string[], userId: string) {
    this.requirePermission(permissions, 'staff:view');

    const prisma = await this.prisma.getClient();
    const assignment = await this.getAssignment(prisma, centerId, userId);

    return formatStaffAssignment(assignment);
  }

  async update(
    centerId: string,
    permissions: string[],
    userId: string,
    dto: UpdateTenantStaffDto,
  ) {
    this.requirePermission(permissions, 'staff:update');
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
          ...(validation.providerEnabled !== undefined
            ? { providerEnabled: validation.providerEnabled }
            : {}),
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
    centerName: string,
    permissions: string[],
    actorUserId: string,
    actorName: string,
    impersonatorUserId: string | undefined,
    userId: string,
    dto: UpdateTenantStaffStatusDto,
  ) {
    this.requirePermission(permissions, 'staff:status');
    const status = optionalTrimmed(dto.status)?.toUpperCase();

    if (!isAllowedValue(status, staffStatuses)) {
      throw validationFailed({ status: 'Select a valid staff status.' });
    }

    const prisma = await this.prisma.getClient();
    let oldStatus: TenantStaffStatus = 'INACTIVE';

    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { ownerUserId: true },
    });

    if (center?.ownerUserId === userId && status !== 'ACTIVE') {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: {
          staff: 'The center owner cannot be deactivated.',
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const current = await this.getAssignment(tx, centerId, userId);
      oldStatus = current.user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
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

    try {
      const isImpersonated = Boolean(impersonatorUserId);
      await this.auditService.log({
        action: 'STAFF_STATUS_CHANGED',
        actorUserId: impersonatorUserId ?? actorUserId,
        centerId,
        targetUserId: userId,
        metadata: {
          actorName,
          centerName,
          impersonatedBySuperAdmin: isImpersonated,
          ...(impersonatorUserId ? { impersonatorUserId } : {}),
          newStatus: result.status,
          oldStatus,
          source: 'TENANT_STAFF',
          targetEmail: result.email ?? null,
          targetName: result.fullName,
          tenantActorUserId: actorUserId,
        },
      });
    } catch (error) {
      console.error(
        '[TenantStaffService] Failed to write staff status audit log:',
        error,
      );
    }

    return result;
  }

  private requirePermission(
    permissions: string[],
    permission: StaffPermission,
  ) {
    if (!hasTenantPermission(permissions, permission)) {
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
