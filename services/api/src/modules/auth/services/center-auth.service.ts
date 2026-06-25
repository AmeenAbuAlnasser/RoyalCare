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
const EXPENSE_PERMISSION_KEYS = [
  'expenses:view',
  'expenses:create',
  'expenses:edit',
  'expenses:delete',
  'expenses:reports',
] as const;

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
    'expenses:view',
    'expenses:create',
    'expenses:edit',
    'expenses:reports',
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
    'expenses:view',
    'expenses:create',
    'expenses:edit',
    'expenses:reports',
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
const PROFILE_LANGUAGES = ['AR', 'EN', 'HE'] as const;
const PROFILE_SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
] as const;

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

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanOptionalText(value: unknown): string | null {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 20;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidImageUrl(value: string): boolean {
  if (!value) return true;
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

  async getAccountProfile(payload: CenterSessionPayload | null) {
    const session = await this.getSession(payload);
    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findUnique({
      where: { id: session.center.id },
      select: {
        branding: { select: { logoUrl: true } },
        primaryLanguage: true,
        subscriptions: {
          where: { status: { in: [...PROFILE_SUBSCRIPTION_STATUSES] } },
          orderBy: { currentPeriodEnd: 'desc' },
          select: { notificationPhone: true },
          take: 1,
        },
      },
    });

    return {
      avatarUrl: center?.branding?.logoUrl ?? null,
      email: session.user.email ?? '',
      fullName: session.user.fullName,
      phone: session.user.phone ?? '',
      preferredLanguage:
        center?.primaryLanguage ?? session.center.primaryLanguage,
      whatsappPhone: center?.subscriptions[0]?.notificationPhone ?? '',
    };
  }

  async updateAccountProfile(
    payload: CenterSessionPayload | null,
    dto: unknown,
  ) {
    const session = await this.getSession(payload);

    if (session.role.key !== 'CENTER_OWNER') {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: {
          profile:
            'Only the center owner can update the center account profile.',
        },
      });
    }

    const source =
      dto && typeof dto === 'object' ? (dto as Record<string, unknown>) : {};
    const fullName = cleanText(source.fullName);
    const phone = cleanText(source.phone);
    const whatsappPhone = cleanText(source.whatsappPhone);
    const email = cleanText(source.email).toLowerCase();
    const preferredLanguage = cleanText(source.preferredLanguage).toUpperCase();
    const avatarUrl = cleanOptionalText(source.avatarUrl);
    const errors: Record<string, string> = {};

    if (!fullName) errors.fullName = 'Full name is required.';
    if (fullName.length > 160)
      errors.fullName = 'Full name must be 160 characters or fewer.';
    if (!phone) errors.phone = 'Main phone is required.';
    else if (!isValidPhone(phone)) errors.phone = 'Phone must be 7-20 digits.';
    if (!whatsappPhone) errors.whatsappPhone = 'Main WhatsApp is required.';
    else if (!isValidPhone(whatsappPhone))
      errors.whatsappPhone = 'WhatsApp must be 7-20 digits.';
    if (!email) errors.email = 'Email is required.';
    else if (!isValidEmail(email)) errors.email = 'Email must be valid.';
    if (
      !PROFILE_LANGUAGES.includes(
        preferredLanguage as (typeof PROFILE_LANGUAGES)[number],
      )
    ) {
      errors.preferredLanguage = 'Select a valid preferred language.';
    }
    if (avatarUrl && !isValidImageUrl(avatarUrl)) {
      errors.avatarUrl = 'Image URL must be a valid upload or http(s) URL.';
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    const prisma = await this.prisma.getClient();
    const subscription = await prisma.subscription.findFirst({
      where: { centerId: session.center.id },
      orderBy: [{ currentPeriodEnd: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });

    if (!subscription) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          whatsappPhone:
            'A subscription is required before setting primary WhatsApp.',
        },
      });
    }

    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { email, fullName, phone },
          select: { id: true },
        }),
        prisma.center.update({
          where: { id: session.center.id },
          data: {
            primaryLanguage:
              preferredLanguage as (typeof PROFILE_LANGUAGES)[number],
          },
          select: { id: true },
        }),
        prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            notificationLanguage:
              preferredLanguage as (typeof PROFILE_LANGUAGES)[number],
            notificationPhone: whatsappPhone,
          },
          select: { id: true },
        }),
        prisma.brandingSettings.upsert({
          where: { centerId: session.center.id },
          create: {
            centerId: session.center.id,
            defaultLanguage:
              preferredLanguage as (typeof PROFILE_LANGUAGES)[number],
            enabledLanguages: [preferredLanguage],
            logoUrl: avatarUrl,
          },
          update: {
            defaultLanguage:
              preferredLanguage as (typeof PROFILE_LANGUAGES)[number],
            logoUrl: avatarUrl,
          },
          select: { centerId: true },
        }),
      ]);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: {
            email: 'Email or phone is already used by another account.',
            phone: 'Email or phone is already used by another account.',
          },
        });
      }
      throw error;
    }

    return this.getAccountProfile(payload);
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

    const storedPermissions = rolePerms.map((rp) => rp.permission.key);

    if (roleKey === 'CENTER_MANAGER') {
      return normalizeTenantPermissionKeys([
        ...storedPermissions,
        ...EXPENSE_PERMISSION_KEYS,
      ]);
    }

    return normalizeTenantPermissionKeys(storedPermissions);
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
