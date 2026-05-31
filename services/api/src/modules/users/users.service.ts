import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';
import { safeUserSelect } from '../../common/database/safe-user-select';
import { hashPassword } from '../../common/security/password-hashing';
import { parsePagination } from '../../common/utils/pagination';
import { AuditService } from '../audit/audit.service';
import type { Prisma } from '@royalcare/db';
import { AssignCenterRoleDto } from './dto/assign-center-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

const ACTIVE_USER_ROLE_STATUS = 'ACTIVE';
const DEFAULT_USER_STATUS = 'INVITED';
const allowedUserStatuses = [
  'INVITED',
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
] as const;
const centerRoleKeys = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'STAFF',
] as const;
const centerRoleNames: Record<(typeof centerRoleKeys)[number], string> = {
  ACCOUNTANT: 'Accountant',
  CENTER_MANAGER: 'Center Manager',
  CENTER_OWNER: 'Center Owner',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  STAFF: 'Staff',
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ListUsersQueryDto) {
    const prisma = await this.prisma.getClient();
    const { page, pageSize, skip, take } = parsePagination(query);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.role
        ? {
            roles: {
              some: {
                status: ACTIVE_USER_ROLE_STATUS,
                role: { key: query.role },
              },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total, totalUsers, activeUsers, pendingUsers, suspendedUsers] =
      await prisma.$transaction([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            ...safeUserSelect,
            roles: {
              where: { status: ACTIVE_USER_ROLE_STATUS },
              include: { center: true, role: true },
            },
          },
        }),
        prisma.user.count({ where }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        prisma.user.count({ where: { deletedAt: null, status: 'INVITED' } }),
        prisma.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      ]);

    return {
      data,
      pagination: { page, pageSize, total },
      stats: {
        activeUsers,
        pendingUsers,
        suspendedUsers,
        totalUsers,
      },
    };
  }

  async getById(userId: string) {
    const prisma = await this.prisma.getClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...safeUserSelect,
        ownedCenters: true,
        roles: {
          include: { center: true, role: true },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const prisma = await this.prisma.getClient();
    this.validateRequiredUserFields(dto.fullName, dto.email);
    const password = dto.temporaryPassword ?? dto.password;

    if (!password || password.length < 8) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          temporaryPassword:
            'Temporary password must be at least 8 characters.',
        },
      });
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email?.trim().toLowerCase() || null,
            phone: dto.phone || null,
            passwordHash: await hashPassword(password),
            fullName: dto.fullName.trim(),
            status: dto.status ?? DEFAULT_USER_STATUS,
          },
          select: safeUserSelect,
        });

        if (dto.platformRoleKey) {
          await this.assignPlatformRoleWithClient(
            tx,
            user.id,
            dto.platformRoleKey,
          );
        }

        if (dto.centerId && dto.centerRoleKey) {
          await this.assignCenterRoleWithClient(tx, user.id, {
            centerId: dto.centerId,
            roleKey: dto.centerRoleKey,
          });
        }

        return this.getByIdWithClient(tx, user.id);
      });
    } catch (error) {
      this.handleUniqueUserError(error);
      throw error;
    }
  }

  async update(userId: string, dto: UpdateUserDto, actorUserId?: string) {
    const prisma = await this.prisma.getClient();
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        fullName: true,
        id: true,
        status: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found.');
    }

    if (dto.fullName !== undefined && !dto.fullName.trim()) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { fullName: 'Full name is required.' },
      });
    }

    const normalizedEmail =
      dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;

    if (normalizedEmail !== undefined && !this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { email: 'Valid email is required.' },
      });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
          ...(dto.fullName !== undefined
            ? { fullName: dto.fullName.trim() }
            : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        select: safeUserSelect,
      });
    } catch (error) {
      this.handleUniqueUserError(error);
      throw error;
    }

    const result = await this.getById(userId);

    try {
      const actor = actorUserId
        ? await prisma.user.findFirst({
            where: { id: actorUserId, deletedAt: null },
            select: { email: true, fullName: true },
          })
        : null;

      await this.auditService.log({
        action: 'USER_UPDATED',
        actorUserId,
        targetUserId: userId,
        metadata: {
          actorEmail: actor?.email ?? null,
          actorName: actor?.fullName ?? null,
          email: result.email ?? null,
          name: result.fullName,
          oldEmail: existingUser.email ?? null,
          oldName: existingUser.fullName,
          oldStatus: existingUser.status,
          newStatus: result.status,
          updatedFields: Object.keys(dto),
        },
      });
    } catch (error) {
      console.error(
        '[UsersService] Failed to write user update audit log:',
        error,
      );
    }

    return result;
  }

  async updateStatus(
    userId: string,
    dto: UpdateUserStatusDto,
    actorUserId?: string,
  ) {
    if (!allowedUserStatuses.includes(dto.status)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { status: 'Invalid user status.' },
      });
    }

    const prisma = await this.prisma.getClient();
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        fullName: true,
        id: true,
        status: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
      select: safeUserSelect,
    });

    const result = await this.getById(userId);

    try {
      const actor = actorUserId
        ? await prisma.user.findFirst({
            where: { id: actorUserId, deletedAt: null },
            select: { email: true, fullName: true },
          })
        : null;

      await this.auditService.log({
        action: 'USER_STATUS_CHANGED',
        actorUserId,
        targetUserId: userId,
        metadata: {
          actorEmail: actor?.email ?? null,
          actorName: actor?.fullName ?? null,
          newStatus: dto.status,
          oldStatus: existingUser.status,
          targetEmail: existingUser.email ?? null,
          targetName: existingUser.fullName,
        },
      });
    } catch (error) {
      console.error(
        '[UsersService] Failed to write user status audit log:',
        error,
      );
    }

    return result;
  }

  async resetPassword(
    userId: string,
    dto: ResetUserPasswordDto,
    actorUserId?: string,
  ) {
    const prisma = await this.prisma.getClient();
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        fullName: true,
        id: true,
        status: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found.');
    }

    const temporaryPassword =
      dto.temporaryPassword && dto.temporaryPassword.length >= 8
        ? dto.temporaryPassword
        : `Royal-${randomBytes(6).toString('base64url')}9!`;

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(temporaryPassword) },
      select: safeUserSelect,
    });

    const result = {
      resetComplete: true,
      temporaryPassword,
      user: await this.getById(userId),
    };

    try {
      const actor = actorUserId
        ? await prisma.user.findFirst({
            where: { id: actorUserId, deletedAt: null },
            select: { email: true, fullName: true },
          })
        : null;

      await this.auditService.log({
        action: 'PASSWORD_RESET',
        actorUserId,
        targetUserId: userId,
        metadata: {
          actorEmail: actor?.email ?? null,
          actorName: actor?.fullName ?? null,
          email: existingUser.email ?? null,
          name: existingUser.fullName,
          oldStatus: existingUser.status,
          newStatus: existingUser.status,
        },
      });
    } catch (error) {
      console.error(
        '[UsersService] Failed to write password reset audit log:',
        error,
      );
    }

    return result;
  }

  async assignCenterRole(userId: string, dto: AssignCenterRoleDto) {
    await this.getById(userId);
    const prisma = await this.prisma.getClient();

    return this.assignCenterRoleWithClient(prisma, userId, dto);
  }

  private async getByIdWithClient(prisma: PrismaServiceClient, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...safeUserSelect,
        ownedCenters: true,
        roles: {
          include: { center: true, role: true },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  private async assignCenterRoleWithClient(
    prisma: PrismaServiceClient,
    userId: string,
    dto: AssignCenterRoleDto,
  ) {
    if (!dto.centerId) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { centerId: 'Center is required.' },
      });
    }

    const center = await prisma.center.findUnique({
      where: { id: dto.centerId },
      select: { id: true },
    });

    if (!center) {
      throw new NotFoundException('Center not found.');
    }

    const role = dto.roleId
      ? await prisma.role.findFirst({
          where: { id: dto.roleId, centerId: dto.centerId, scope: 'CENTER' },
        })
      : await this.ensureCenterRole(prisma, dto.centerId, dto.roleKey);

    if (!role) {
      throw new NotFoundException('Center role not found.');
    }

    return prisma.userRole.upsert({
      where: {
        userId_roleId_centerId: {
          userId,
          roleId: role.id,
          centerId: dto.centerId,
        },
      },
      create: {
        userId,
        roleId: role.id,
        centerId: dto.centerId,
        status: ACTIVE_USER_ROLE_STATUS,
      },
      update: {
        status: ACTIVE_USER_ROLE_STATUS,
        revokedAt: null,
      },
      include: {
        center: true,
        role: true,
        user: { select: safeUserSelect },
      },
    });
  }

  private async assignPlatformRoleWithClient(
    prisma: PrismaServiceClient,
    userId: string,
    roleKey: string,
  ) {
    const role = await prisma.role.findFirst({
      where: {
        centerId: null,
        key: roleKey,
        scope: 'PLATFORM',
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (!role) {
      throw new NotFoundException('Platform role not found.');
    }

    const existing = await prisma.userRole.findFirst({
      where: { centerId: null, roleId: role.id, userId },
      select: { id: true },
    });

    if (existing) {
      return prisma.userRole.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', revokedAt: null },
      });
    }

    return prisma.userRole.create({
      data: { userId, roleId: role.id, centerId: null, status: 'ACTIVE' },
    });
  }

  private async ensureCenterRole(
    prisma: PrismaServiceClient,
    centerId: string,
    roleKey?: string,
  ) {
    if (!roleKey || !(centerRoleKeys as readonly string[]).includes(roleKey)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { role: 'Invalid center role.' },
      });
    }

    const key = roleKey as (typeof centerRoleKeys)[number];
    const existing = await prisma.role.findFirst({
      where: { centerId, key, scope: 'CENTER' },
    });

    if (existing) {
      return existing;
    }

    return prisma.role.create({
      data: {
        centerId,
        key,
        name: centerRoleNames[key],
        scope: 'CENTER',
        isSystem: true,
      },
    });
  }

  private validateRequiredUserFields(fullName?: string, email?: string | null) {
    const errors: Record<string, string> = {};

    if (!fullName?.trim()) {
      errors.fullName = 'Full name is required.';
    }

    if (!email || !this.isValidEmail(email)) {
      errors.email = 'Valid email is required.';
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private handleUniqueUserError(error: unknown): never | void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      const target = (error as { meta?: { target?: string[] } }).meta?.target;
      const field = target?.includes('phone') ? 'phone' : 'email';

      throw new ConflictException({
        message: 'Validation failed',
        errors: {
          [field]: `${field === 'phone' ? 'Phone' : 'Email'} is already used.`,
        },
      });
    }
  }
}

type PrismaServiceClient =
  | Awaited<ReturnType<PrismaService['getClient']>>
  | Prisma.TransactionClient;
