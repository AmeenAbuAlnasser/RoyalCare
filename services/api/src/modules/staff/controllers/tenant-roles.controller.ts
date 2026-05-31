import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../../auth/services/center-session.service';
import { UpdateRolePermissionsDto } from '../dto/update-role-permissions.dto';
import { TenantRolesService } from '../services/tenant-roles.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('tenant/roles')
export class TenantRolesController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly tenantRolesService: TenantRolesService,
  ) {}

  @Get()
  async listRoles(@Req() request: Request) {
    const session = await this.getSession(request);
    this.tenantRolesService.requireView(session.permissions);

    return this.tenantRolesService.listRoles(session.center.id);
  }

  @Get(':roleId/permissions')
  async getRolePermissions(
    @Req() request: Request,
    @Param('roleId') roleId: string,
  ) {
    const session = await this.getSession(request);
    this.tenantRolesService.requireView(session.permissions);

    return this.tenantRolesService.getRolePermissions(
      session.center.id,
      roleId,
    );
  }

  @Patch(':roleId/permissions')
  async updateRolePermissions(
    @Req() request: Request,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantRolesService.updateRolePermissions(
      session.center.id,
      session.permissions,
      session.role.key,
      roleId,
      dto.permissions ?? [],
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
