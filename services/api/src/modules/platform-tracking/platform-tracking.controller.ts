import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PermissionsService } from '../permissions/services/permissions.service';
import { PlatformTrackingService } from './platform-tracking.service';
import type { PlatformTrackingConfigDto } from './platform-tracking.service';

async function requireSuperAdminUser(
  permissionsService: PermissionsService,
  userId?: string | string[],
) {
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
  if (!normalizedUserId) {
    throw new ForbiddenException({
      message: 'Permission denied',
      errors: { role: 'SUPER_ADMIN role is required.' },
    });
  }
  const permissionContext =
    await permissionsService.getUserPermissions(normalizedUserId);
  const roles = permissionContext.roles as Array<{ key: string }>;
  const isSuperAdmin = roles.some((role) => role.key === 'super_admin');
  if (!permissionContext.user || !isSuperAdmin) {
    throw new ForbiddenException({
      message: 'Permission denied',
      errors: { role: 'SUPER_ADMIN role is required.' },
    });
  }
  return permissionContext.user;
}

@Controller('super-admin/platform-tracking')
export class PlatformTrackingController {
  constructor(
    private readonly platformTrackingService: PlatformTrackingService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async getConfig(
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await requireSuperAdminUser(this.permissionsService, superAdminUserId);
    return this.platformTrackingService.getConfig();
  }

  @Patch()
  async updateConfig(
    @Body() dto: PlatformTrackingConfigDto,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await requireSuperAdminUser(this.permissionsService, superAdminUserId);
    return this.platformTrackingService.updateConfig(dto);
  }

  @Get('logs')
  async getLogs(
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
    @Query('limit') limit?: string,
  ) {
    await requireSuperAdminUser(this.permissionsService, superAdminUserId);
    return this.platformTrackingService.getLogs(limit);
  }

  @Post('test-meta-capi')
  async testMetaCapi(
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await requireSuperAdminUser(this.permissionsService, superAdminUserId);
    return this.platformTrackingService.testMetaCapi();
  }
}

// Public endpoint — no auth — for the PlatformMarketingInjector.
// Returns only pixel IDs (never tokens). Blocked when testMode is true.
@Controller('public/platform-tracking')
export class PublicPlatformTrackingController {
  constructor(
    private readonly platformTrackingService: PlatformTrackingService,
  ) {}

  @Get()
  getPublicConfig() {
    return this.platformTrackingService.getPublicConfig();
  }
}
