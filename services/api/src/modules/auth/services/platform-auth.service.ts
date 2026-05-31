import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { verifyPassword } from '../../../common/security/password-hashing';
import type { PlatformSessionPayload } from './platform-session.service';

const PLATFORM_ROLE_KEYS = [
  'super_admin',
  'platform_admin',
  'finance_admin',
  'support_admin',
  'read_only_admin',
] as const;

function normalizeEmail(value?: string) {
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
export class PlatformAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      throw invalidCredentials();
    }

    const prisma = await this.prisma.getClient();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        passwordHash: true,
        deletedAt: true,
        roles: {
          where: {
            centerId: null,
            status: 'ACTIVE',
            role: {
              scope: 'PLATFORM',
              key: { in: [...PLATFORM_ROLE_KEYS] },
              status: 'ACTIVE',
            },
          },
          take: 1,
          include: {
            role: { select: { id: true, key: true, name: true } },
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

    if (user.roles.length === 0) {
      throw invalidCredentials();
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
      },
      roles: user.roles.map((assignment) => ({
        id: assignment.role.id,
        key: assignment.role.key,
        name: assignment.role.name,
      })),
    };
  }

  async getSession(payload: PlatformSessionPayload | null) {
    if (!payload) {
      throw new UnauthorizedException({
        message: 'Not authenticated',
        errors: { session: 'Please log in again.' },
      });
    }

    const prisma = await this.prisma.getClient();
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        roles: {
          where: {
            centerId: null,
            status: 'ACTIVE',
            role: {
              scope: 'PLATFORM',
              key: { in: [...PLATFORM_ROLE_KEYS] },
              status: 'ACTIVE',
            },
          },
          include: {
            role: { select: { id: true, key: true, name: true } },
          },
        },
      },
    });

    if (!user || user.roles.length === 0) {
      throw new UnauthorizedException({
        message: 'Not authenticated',
        errors: { session: 'Please log in again.' },
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
      },
      roles: user.roles.map((assignment) => ({
        id: assignment.role.id,
        key: assignment.role.key,
        name: assignment.role.name,
      })),
    };
  }
}
