import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';
import {
  hashPassword,
  verifyPassword,
} from '../../../common/security/password-hashing';
import type { Prisma } from '@royalcare/db';
import {
  normalizeTenantPermissionKeys,
  setTenantPermissionDebugContext,
  tenantPermissionKeys,
} from '../../../common/permissions/tenant-permissions';
import { CenterLoginDto } from '../dto/center-login.dto';
import type { CenterSessionPayload } from './center-session.service';
import { TenantSubscriptionAccessService } from './tenant-subscription-access.service';

const CENTER_STAFF_ROLES = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'STAFF',
] as const;
const ACTIVE_USER_ROLE_STATUS = 'ACTIVE';

const ALL_PERMISSION_KEYS = [...tenantPermissionKeys];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  CENTER_OWNER: [...ALL_PERMISSION_KEYS],
  CENTER_MANAGER: [...ALL_PERMISSION_KEYS],
  DOCTOR: [
    'staff:view',
    'services:view',
    'appointments:view',
    'appointments:update',
    'appointments:status',
    'payments:view',
  ],
  RECEPTIONIST: [
    'staff:view',
    'services:view',
    'appointments:view',
    'appointments:create',
    'appointments:update',
    'appointments:cancel',
    'appointments:status',
    'billing:view',
    'billing:create',
    'payments:view',
    'payments:create',
  ],
  ACCOUNTANT: [
    'staff:view',
    'services:view',
    'appointments:view',
    'billing:view',
    'billing:create',
    'billing:update',
    'payments:view',
    'payments:create',
  ],
  STAFF: [
    'staff:view',
    'services:view',
    'appointments:view',
    'billing:view',
    'payments:view',
  ],
};
const BLOCKED_CENTER_STATUSES = ['SUSPENDED', 'CANCELLED', 'ARCHIVED'];

const safeCenterSelect = {
  id: true,
  name: true,
  slug: true,
  type: true,
  status: true,
  primaryLanguage: true,
  timezone: true,
  branding: {
    select: {
      logoUrl: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CenterSelect;

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

function normalizeSlug(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

function invalidCredentials() {
  return new UnauthorizedException({
    message: 'Invalid credentials',
    errors: {
      credentials: 'Email or password is incorrect.',
    },
  });
}

@Injectable()
export class CenterAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionAccess: TenantSubscriptionAccessService,
  ) {}

  async resolveCenterLogin(centerSlug: string) {
    const slug = normalizeSlug(centerSlug);

    if (!slug) {
      throw new NotFoundException({
        message: 'Center not found',
        errors: { center: 'Center not found.' },
      });
    }

    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findUnique({
      where: { slug },
      select: safeCenterSelect,
    });

    if (!center) {
      throw new NotFoundException({
        message: 'Center not found',
        errors: { center: 'Center not found.' },
      });
    }

    return {
      center,
      loginAllowed: !BLOCKED_CENTER_STATUSES.includes(center.status),
    };
  }

  async login(dto: CenterLoginDto) {
    const email = normalizeEmail(dto.email);
    const password = dto.password ?? '';
    const centerSlug = normalizeSlug(dto.centerSlug);

    if (!email || !password) {
      throw invalidCredentials();
    }

    const prisma = await this.prisma.getClient();
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ...safeUserSelect,
        passwordHash: true,
        deletedAt: true,
        roles: {
          where: {
            centerId: { not: null },
            status: ACTIVE_USER_ROLE_STATUS,
            role: {
              scope: 'CENTER',
              key: { in: [...CENTER_STAFF_ROLES] },
              status: 'ACTIVE',
            },
            ...(centerSlug
              ? {
                  center: {
                    slug: centerSlug,
                  },
                }
              : {}),
          },
          orderBy: { assignedAt: 'asc' },
          take: 1,
          include: {
            center: { select: safeCenterSelect },
            role: {
              select: {
                id: true,
                key: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (
      !user ||
      user.deletedAt ||
      user.status !== 'ACTIVE' ||
      !user.passwordHash
    ) {
      throw invalidCredentials();
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw invalidCredentials();
    }

    const assignment = user.roles[0];

    if (!assignment?.center || !assignment.role) {
      throw invalidCredentials();
    }

    if (BLOCKED_CENTER_STATUSES.includes(assignment.center.status)) {
      throw new ForbiddenException({
        message: 'Center access is blocked',
        errors: {
          center: 'This center is not active.',
        },
      });
    }

    const permissions = await this.getEffectivePermissions(
      assignment.center.id,
      assignment.role.key,
    );
    const subscriptionAccess = await this.subscriptionAccess.getAccessState(
      assignment.center.id,
    );
    setTenantPermissionDebugContext({
      centerId: assignment.center.id,
      roleKey: assignment.role.key,
      userId: user.id,
    });

    return {
      ...this.formatSession({
        center: assignment.center,
        role: assignment.role,
        user,
      }),
      permissions,
      subscriptionAccess,
    };
  }

  async getSession(payload: CenterSessionPayload | null) {
    if (!payload) {
      throw new UnauthorizedException({
        message: 'Not authenticated',
        errors: {
          session: 'Please log in again.',
        },
      });
    }

    const prisma = await this.prisma.getClient();
    const assignment = await prisma.userRole.findFirst({
      where: {
        centerId: payload.centerId,
        userId: payload.userId,
        status: ACTIVE_USER_ROLE_STATUS,
        role: {
          scope: 'CENTER',
          key: payload.role,
          status: 'ACTIVE',
        },
        user: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      },
      include: {
        center: { select: safeCenterSelect },
        role: { select: { id: true, key: true, name: true } },
        user: { select: safeUserSelect },
      },
    });

    if (!assignment?.center) {
      throw invalidCredentials();
    }

    if (BLOCKED_CENTER_STATUSES.includes(assignment.center.status)) {
      throw new ForbiddenException({
        message: 'Center access is blocked',
        errors: {
          center: 'This center is not active.',
        },
      });
    }

    const permissions = await this.getEffectivePermissions(
      assignment.center.id,
      assignment.role.key,
    );
    const subscriptionAccess = await this.subscriptionAccess.getAccessState(
      assignment.center.id,
    );
    setTenantPermissionDebugContext({
      centerId: assignment.center.id,
      roleKey: assignment.role.key,
      userId: assignment.user.id,
    });

    return {
      ...this.formatSession({
        center: assignment.center,
        role: assignment.role,
        user: assignment.user,
      }),
      impersonation: payload.impersonatorUserId
        ? {
            impersonatedUserId: payload.userId,
            impersonatorUserId: payload.impersonatorUserId,
          }
        : null,
      permissions,
      subscriptionAccess,
    };
  }

  async changePassword(
    payload: CenterSessionPayload | null,
    dto: { currentPassword?: string; newPassword?: string },
  ) {
    if (!payload) {
      throw new UnauthorizedException({
        message: 'Not authenticated',
        errors: { session: 'Please log in again.' },
      });
    }

    const errors: Record<string, string> = {};
    const currentPassword = dto.currentPassword?.trim() ?? '';
    const newPassword = dto.newPassword?.trim() ?? '';

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters.';
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    const session = await this.getSession(payload);
    const prisma = await this.prisma.getClient();
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        roles: {
          some: {
            centerId: session.center.id,
            status: ACTIVE_USER_ROLE_STATUS,
            role: {
              key: session.role.key,
              scope: 'CENTER',
              status: 'ACTIVE',
            },
          },
        },
      },
      select: { id: true, passwordHash: true, deletedAt: true, status: true },
    });

    if (
      !user ||
      user.deletedAt ||
      user.status !== 'ACTIVE' ||
      !user.passwordHash
    ) {
      throw new UnauthorizedException({
        message: 'Not authenticated',
        errors: { session: 'Please log in again.' },
      });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { currentPassword: 'Current password is incorrect.' },
      });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
      select: { id: true },
    });

    return { success: true };
  }

  private async getEffectivePermissions(
    centerId: string,
    roleKey: string,
  ): Promise<string[]> {
    if (roleKey === 'CENTER_OWNER') {
      return normalizeTenantPermissionKeys(ALL_PERMISSION_KEYS);
    }

    const prisma = await this.prisma.getClient();

    const role = await prisma.role.findFirst({
      where: { centerId, key: roleKey, scope: 'CENTER' },
      select: { id: true },
    });

    if (!role) {
      return normalizeTenantPermissionKeys(
        DEFAULT_ROLE_PERMISSIONS[roleKey] ?? [],
      );
    }

    const rolePerms = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });

    if (rolePerms.length === 0) {
      return normalizeTenantPermissionKeys(
        DEFAULT_ROLE_PERMISSIONS[roleKey] ?? [],
      );
    }

    return normalizeTenantPermissionKeys(
      rolePerms.map((rp) => rp.permission.key),
    );
  }

  private formatSession(session: {
    center: Prisma.CenterGetPayload<{ select: typeof safeCenterSelect }>;
    role: { id: string; key: string; name: string };
    user: Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;
  }) {
    return {
      center: session.center,
      role: {
        id: session.role.id,
        key: session.role.key,
        name: session.role.name,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone,
        fullName: session.user.fullName,
        status: session.user.status,
        createdAt: session.user.createdAt,
      },
    };
  }
}
