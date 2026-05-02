import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AssignPlatformRoleDto } from '../dto/assign-platform-role.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { PermissionsService } from '../services/permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('me')
  getCurrentPermissions(
    @Headers('x-royalcare-super-admin-user-id') userId?: string,
  ) {
    return this.permissionsService.getUserPermissions(userId);
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
