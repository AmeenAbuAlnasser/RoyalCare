import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  centerSessionCookieName,
  centerSessionMaxAgeSeconds,
  createCenterSessionToken,
} from '../auth/services/center-session.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsService } from '../permissions/services/permissions.service';
import { CentersService } from './centers.service';
import { CreateAdminCenterManagerDto } from './dto/create-admin-center-manager.dto';
import { UpdateCenterStatusDto } from './dto/update-center-status.dto';

@Controller('admin/centers')
export class AdminCentersController {
  constructor(
    private readonly centersService: CentersService,
    private readonly permissionsService: PermissionsService,
    private readonly auditService: AuditService,
  ) {}

  private async requireSuperAdmin(userId?: string | string[]) {
    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;

    if (!normalizedUserId) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: {
          role: 'SUPER_ADMIN role is required.',
        },
      });
    }

    const permissionContext =
      await this.permissionsService.getUserPermissions(normalizedUserId);
    const roles = permissionContext.roles as Array<{ key: string }>;
    const isSuperAdmin = roles.some((role) => role.key === 'super_admin');

    if (!permissionContext.user || !isSuperAdmin) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: {
          role: 'SUPER_ADMIN role is required.',
        },
      });
    }

    return permissionContext.user;
  }

  @Get()
  async list(
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await this.requireSuperAdmin(superAdminUserId);
    return this.centersService.listAdminCenters();
  }

  @Get(':centerId')
  async getById(
    @Param('centerId') centerId: string,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await this.requireSuperAdmin(superAdminUserId);
    return this.centersService.getAdminCenter(centerId);
  }

  @Patch(':centerId/status')
  async updateStatus(
    @Param('centerId') centerId: string,
    @Body() dto: UpdateCenterStatusDto,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
    @Req() request?: Request,
  ) {
    const adminUser = await this.requireSuperAdmin(superAdminUserId);
    return this.centersService.updateAdminCenterStatus(
      centerId,
      dto,
      adminUser.id,
      {
        ip: request?.ip,
        userAgent: request?.headers['user-agent'],
      },
    );
  }

  @Post(':centerId/login-as')
  async loginAsCenterAdmin(
    @Param('centerId') centerId: string,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const adminUser = await this.requireSuperAdmin(superAdminUserId);
    const session = await this.centersService.createAdminCenterLogin(
      centerId,
      adminUser.id,
    );
    const token = createCenterSessionToken({
      centerId: session.center.id,
      impersonatorUserId: adminUser.id,
      role: session.role.key,
      userId: session.impersonatedUser.id,
    });

    response.cookie(centerSessionCookieName, token, {
      httpOnly: true,
      maxAge: centerSessionMaxAgeSeconds * 1000,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    await this.auditService.log({
      action: 'center.login_as',
      actorUserId: adminUser.id,
      targetUserId: session.impersonatedUser.id,
      centerId: session.center.id,
      metadata: { role: session.role.key },
    });

    return {
      token,
      redirectUrl: '/tenant/dashboard',
      center: session.center,
      role: session.role,
      user: session.impersonatedUser,
    };
  }

  @Patch(':centerId/public-visibility')
  async updatePublicVisibility(
    @Param('centerId') centerId: string,
    @Body('publicVisible') publicVisible: boolean,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    const adminUser = await this.requireSuperAdmin(superAdminUserId);
    return this.centersService.updateAdminCenterPublicVisibility(
      centerId,
      Boolean(publicVisible),
      adminUser.id,
    );
  }

  @Post(':centerId/manager')
  async createCenterManager(
    @Param('centerId') centerId: string,
    @Body() dto: CreateAdminCenterManagerDto,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId: string,
  ) {
    const adminUser = await this.requireSuperAdmin(superAdminUserId);
    const manager = await this.centersService.createAdminCenterManager(
      centerId,
      dto,
    );
    await this.auditService.log({
      action: 'user.center_role_assigned',
      actorUserId: adminUser.id,
      targetUserId: manager.id,
      centerId,
      metadata: {
        roleKey: 'CENTER_MANAGER',
        source: 'admin.center_manager.create',
      },
    });
    return manager;
  }
}
