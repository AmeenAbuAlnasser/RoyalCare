import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  hasTenantPermission,
  normalizeTenantPermissionKeys,
  tenantPermissionKeys,
  type TenantPermissionKey,
} from '../../../common/permissions/tenant-permissions';

const CENTER_ROLE_KEYS = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'STAFF',
] as const;

type CenterRoleKey = (typeof CENTER_ROLE_KEYS)[number];

const ROLE_DISPLAY_NAMES: Record<CenterRoleKey, string> = {
  CENTER_OWNER: 'Center Owner',
  CENTER_MANAGER: 'Center Manager',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  ACCOUNTANT: 'Accountant',
  STAFF: 'Staff',
};

const ALL_PERMISSION_KEYS = [...tenantPermissionKeys];

const DEFAULT_ROLE_PERMISSIONS: Record<CenterRoleKey, TenantPermissionKey[]> = {
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

@Injectable()
export class TenantRolesService {
  constructor(private readonly prismaService: PrismaService) {}

  async listRoles(centerId: string) {
    const prisma = await this.prismaService.getClient();
    await this.ensureCenterRolesExist(prisma, centerId);

    return prisma.role.findMany({
      where: { centerId, scope: 'CENTER' },
      select: { id: true, key: true, name: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getRolePermissions(centerId: string, roleId: string) {
    const prisma = await this.prismaService.getClient();

    const role = await prisma.role.findFirst({
      where: { id: roleId, centerId, scope: 'CENTER' },
    });

    if (!role) {
      throw new NotFoundException({ message: 'Role not found' });
    }

    const rolePerms = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    if (rolePerms.length === 0) {
      const defaults =
        DEFAULT_ROLE_PERMISSIONS[role.key as CenterRoleKey] ?? [];
      return {
        roleId: role.id,
        roleKey: role.key,
        permissions: normalizeTenantPermissionKeys(defaults),
      };
    }

    return {
      roleId: role.id,
      roleKey: role.key,
      permissions: normalizeTenantPermissionKeys(
        rolePerms.map((rp) => rp.permission.key),
      ),
    };
  }

  async updateRolePermissions(
    centerId: string,
    callerPermissions: string[],
    callerRoleKey: string,
    targetRoleId: string,
    permissionKeys: string[],
  ) {
    this.requirePermission(callerPermissions, 'permissions:update');

    if (!['CENTER_OWNER', 'CENTER_MANAGER'].includes(callerRoleKey)) {
      throw new ForbiddenException({ message: 'Permission denied' });
    }

    const prisma = await this.prismaService.getClient();

    const role = await prisma.role.findFirst({
      where: { id: targetRoleId, centerId, scope: 'CENTER' },
    });

    if (!role) {
      throw new NotFoundException({ message: 'Role not found' });
    }

    if (role.key === 'CENTER_OWNER') {
      throw new ForbiddenException({
        message: 'Cannot modify owner permissions',
      });
    }

    const validKeys = normalizeTenantPermissionKeys(permissionKeys);

    await this.ensurePermissionsExist(prisma);

    const permissions = await prisma.permission.findMany({
      where: { key: { in: validKeys }, scope: 'CENTER' },
      select: { id: true, key: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: targetRoleId } });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId: targetRoleId,
            permissionId: p.id,
          })),
        });
      }
    });

    return {
      roleId: targetRoleId,
      roleKey: role.key,
      permissions: validKeys,
    };
  }

  requireView(permissions: string[]) {
    this.requirePermission(permissions, 'permissions:view');
  }

  private requirePermission(
    permissions: string[],
    permission: 'permissions:view' | 'permissions:update',
  ) {
    if (!hasTenantPermission(permissions, permission)) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { permission: `Missing permission: ${permission}` },
      });
    }
  }

  private async ensureCenterRolesExist(
    prisma: PrismaServiceClient,
    centerId: string,
  ) {
    const existing = await prisma.role.findMany({
      where: { centerId, scope: 'CENTER' },
      select: { key: true },
    });

    const existingKeys = new Set(existing.map((r) => r.key));
    const missing = CENTER_ROLE_KEYS.filter((k) => !existingKeys.has(k));

    if (missing.length > 0) {
      await prisma.role.createMany({
        data: missing.map((key) => ({
          centerId,
          key,
          name: ROLE_DISPLAY_NAMES[key],
          scope: 'CENTER',
          isSystem: true,
        })),
        skipDuplicates: true,
      });
    }
  }

  private async ensurePermissionsExist(prisma: PrismaServiceClient) {
    const existing = await prisma.permission.findMany({
      where: { scope: 'CENTER' },
      select: { key: true },
    });

    const existingKeys = new Set(existing.map((r) => r.key));
    const missing = ALL_PERMISSION_KEYS.filter((k) => !existingKeys.has(k));

    if (missing.length > 0) {
      await prisma.permission.createMany({
        data: missing.map((key) => ({
          key,
          name: key,
          scope: 'CENTER',
        })),
        skipDuplicates: true,
      });
    }
  }
}

type PrismaServiceClient = Awaited<ReturnType<PrismaService['getClient']>>;
