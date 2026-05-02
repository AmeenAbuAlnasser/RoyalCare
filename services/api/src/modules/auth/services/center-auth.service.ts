import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';
import { verifyPassword } from '../../../common/security/password-hashing';
import type { Prisma } from '../../../../../../packages/database/node_modules/@prisma/client';
import { CenterLoginDto } from '../dto/center-login.dto';
import type { CenterSessionPayload } from './center-session.service';

const CENTER_STAFF_ROLES = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'STAFF',
] as const;
const ACTIVE_USER_ROLE_STATUS = 'ACTIVE';
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
  constructor(private readonly prisma: PrismaService) {}

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

    return this.formatSession({
      center: assignment.center,
      role: assignment.role,
      user,
    });
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

    return this.formatSession({
      center: assignment.center,
      role: assignment.role,
      user: assignment.user,
    });
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
