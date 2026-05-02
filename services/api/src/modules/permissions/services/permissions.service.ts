import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';
import type { Prisma } from '../../../../../../packages/database/node_modules/@prisma/client';
import {
  platformPermissionKeys,
  platformRoleDefinitions,
  type PlatformPermissionKey,
  type PlatformRoleKey,
} from './platform-permissions';

const ACTIVE_USER_ROLE_STATUS = 'ACTIVE';
const DEFAULT_SYSTEM_ADMIN_EMAIL = 'super.admin@royalcare.local';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private foundationReady: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensurePlatformRbacFoundation();
  }

  async ensurePlatformRbacFoundation() {
    if (!this.foundationReady) {
      this.foundationReady = this.seedPlatformRbacFoundation();
    }

    return this.foundationReady;
  }

  async getCurrentPlatformUser(userId?: string) {
    await this.ensurePlatformRbacFoundation();
    const prisma = await this.prisma.getClient();

    if (userId) {
      return prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
        },
      });
    }

    return prisma.user.findFirst({
      where: { email: DEFAULT_SYSTEM_ADMIN_EMAIL, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
      },
    });
  }

  async getUserPermissions(userId?: string) {
    await this.ensurePlatformRbacFoundation();
    const prisma = await this.prisma.getClient();
    const user = await this.getCurrentPlatformUser(userId);

    if (!user) {
      return { permissions: [], roles: [], user: null };
    }

    const assignments = await prisma.userRole.findMany({
      where: {
        centerId: null,
        status: ACTIVE_USER_ROLE_STATUS,
        userId: user.id,
        role: { scope: 'PLATFORM', status: 'ACTIVE' },
      },
      include: {
        role: {
          include: {
            permissions: {
              where: { permission: { status: 'ACTIVE' } },
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();

    for (const assignment of assignments) {
      for (const rolePermission of assignment.role.permissions) {
        permissions.add(rolePermission.permission.key);
      }
    }

    return {
      permissions: Array.from(permissions).sort(),
      roles: assignments.map((assignment) => ({
        id: assignment.role.id,
        key: assignment.role.key,
        name: assignment.role.name,
      })),
      user,
    };
  }

  async userHasPermissions(
    userId: string | undefined,
    requiredPermissions: PlatformPermissionKey[],
  ) {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const { permissions } = await this.getUserPermissions(userId);
    const granted = new Set(permissions);

    return requiredPermissions.every((permission) => granted.has(permission));
  }

  async listPlatformRoles() {
    await this.ensurePlatformRbacFoundation();
    const prisma = await this.prisma.getClient();

    const roles = await prisma.role.findMany({
      where: {
        centerId: null,
        scope: 'PLATFORM',
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        permissions: {
          select: {
            permission: {
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

    return {
      data: roles.map((role) => ({
        ...role,
        permissions: role.permissions
          .map((rolePermission) => rolePermission.permission)
          .sort((first, second) => first.key.localeCompare(second.key)),
      })),
    };
  }

  async assignPlatformRole(userId: string, roleKey: PlatformRoleKey) {
    await this.ensurePlatformRbacFoundation();

    const roleDefinition = platformRoleDefinitions.find(
      (definition) => definition.key === roleKey,
    );

    if (!roleDefinition) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          roleKey: 'Invalid platform role.',
        },
      });
    }

    const prisma = await this.prisma.getClient();
    const [user, role] = await Promise.all([
      prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: safeUserSelect,
      }),
      prisma.role.findFirst({
        where: {
          centerId: null,
          key: roleKey,
          scope: 'PLATFORM',
          status: 'ACTIVE',
        },
        select: { id: true, key: true, name: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!role) {
      throw new NotFoundException('Platform role not found.');
    }

    const existingAssignment = await prisma.userRole.findFirst({
      where: {
        centerId: null,
        roleId: role.id,
        userId,
      },
      select: { id: true },
    });

    const assignment = existingAssignment
      ? await prisma.userRole.update({
          where: { id: existingAssignment.id },
          data: {
            revokedAt: null,
            status: ACTIVE_USER_ROLE_STATUS,
          },
          include: {
            role: true,
            user: { select: safeUserSelect },
          },
        })
      : await prisma.userRole.create({
          data: {
            centerId: null,
            roleId: role.id,
            status: ACTIVE_USER_ROLE_STATUS,
            userId,
          },
          include: {
            role: true,
            user: { select: safeUserSelect },
          },
        });

    return assignment;
  }

  private async seedPlatformRbacFoundation() {
    const prisma = await this.prisma.getClient();

    await prisma.$transaction(async (tx) => {
      const permissionsByKey = await this.upsertPermissions(tx);
      const superAdminRole = await this.upsertRolesAndPermissions(
        tx,
        permissionsByKey,
      );
      await this.ensureDefaultSuperAdminUser(tx, superAdminRole.id);
    });
  }

  private async upsertPermissions(tx: Prisma.TransactionClient) {
    const permissionsByKey = new Map<string, { id: string }>();

    for (const key of platformPermissionKeys) {
      const permission = await tx.permission.upsert({
        where: { key },
        create: {
          key,
          name: this.humanizePermissionKey(key),
          description: `Allows ${key}.`,
          scope: 'PLATFORM',
          status: 'ACTIVE',
        },
        update: {
          name: this.humanizePermissionKey(key),
          description: `Allows ${key}.`,
          scope: 'PLATFORM',
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      permissionsByKey.set(key, permission);
    }

    return permissionsByKey;
  }

  private async upsertRolesAndPermissions(
    tx: Prisma.TransactionClient,
    permissionsByKey: Map<string, { id: string }>,
  ) {
    let superAdminRole: { id: string } | null = null;

    for (const roleDefinition of platformRoleDefinitions) {
      const existingRole = await tx.role.findFirst({
        where: {
          centerId: null,
          key: roleDefinition.key,
          scope: 'PLATFORM',
        },
        select: { id: true },
      });
      const role = existingRole
        ? await tx.role.update({
            where: { id: existingRole.id },
            data: {
              name: roleDefinition.name,
              description: roleDefinition.description,
              status: 'ACTIVE',
              isSystem: true,
            },
            select: { id: true },
          })
        : await tx.role.create({
            data: {
              key: roleDefinition.key,
              name: roleDefinition.name,
              description: roleDefinition.description,
              scope: 'PLATFORM',
              status: 'ACTIVE',
              isSystem: true,
            },
            select: { id: true },
          });

      if (roleDefinition.key === 'super_admin') {
        superAdminRole = role;
      }

      for (const permissionKey of roleDefinition.permissions) {
        const permission = permissionsByKey.get(permissionKey);

        if (!permission) {
          continue;
        }

        await tx.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
          update: {},
        });
      }
    }

    if (!superAdminRole) {
      throw new Error('Super Admin role was not created.');
    }

    return superAdminRole;
  }

  private async ensureDefaultSuperAdminUser(
    tx: Prisma.TransactionClient,
    roleId: string,
  ) {
    const user = await tx.user.upsert({
      where: { email: DEFAULT_SYSTEM_ADMIN_EMAIL },
      create: {
        email: DEFAULT_SYSTEM_ADMIN_EMAIL,
        fullName: 'RoyalCare Super Admin',
        status: 'ACTIVE',
      },
      update: {
        fullName: 'RoyalCare Super Admin',
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const existingAssignment = await tx.userRole.findFirst({
      where: {
        centerId: null,
        roleId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (existingAssignment) {
      await tx.userRole.update({
        where: { id: existingAssignment.id },
        data: {
          revokedAt: null,
          status: ACTIVE_USER_ROLE_STATUS,
        },
      });
      return;
    }

    await tx.userRole.create({
      data: {
        centerId: null,
        roleId,
        status: ACTIVE_USER_ROLE_STATUS,
        userId: user.id,
      },
    });
  }

  private humanizePermissionKey(key: PlatformPermissionKey) {
    return key
      .split(':')
      .reverse()
      .join(' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
