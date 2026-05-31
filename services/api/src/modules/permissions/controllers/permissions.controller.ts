import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../../auth/services/center-session.service';
import { PlatformAuthService } from '../../auth/services/platform-auth.service';
import {
  platformSessionCookieName,
  verifyPlatformSessionToken,
} from '../../auth/services/platform-session.service';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AssignPlatformRoleDto } from '../dto/assign-platform-role.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { PermissionsService } from '../services/permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly permissionsService: PermissionsService,
    private readonly platformAuthService: PlatformAuthService,
  ) {}

  @Get('me')
  getCurrentPermissions(@Req() request: Request) {
    const platformToken = getCookie(request, platformSessionCookieName);
    const platformPayload = verifyPlatformSessionToken(platformToken);

    if (platformPayload) {
      return this.platformAuthService.getSession(platformPayload);
    }

    const centerSessionToken = getCookie(request, centerSessionCookieName);

    if (centerSessionToken) {
      return this.centerAuthService.getSession(
        verifyCenterSessionToken(centerSessionToken),
      );
    }

    return this.permissionsService.getUserPermissions(undefined);
  }

  @Get('platform-roles')
  @UseGuards(PermissionGuard)
  @RequirePermissions('view:users')
  listPlatformRoles() {
    return this.permissionsService.listPlatformRoles();
  }

  @Post('platform-users/:userId/roles')
  @UseGuards(PermissionGuard)
  @RequirePermissions('manage:users')
  assignPlatformRole(
    @Param('userId') userId: string,
    @Body() dto: AssignPlatformRoleDto,
  ) {
    return this.permissionsService.assignPlatformRole(userId, dto.roleKey);
  }
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
