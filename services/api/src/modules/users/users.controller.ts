import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { AuditService } from '../audit/audit.service';
import { AssignCenterRoleDto } from './dto/assign-center-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

@Controller('super-admin/users')
@UseGuards(PermissionGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions('view:users')
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Post()
  @RequirePermissions('manage:users')
  async create(
    @Body() dto: CreateUserDto,
    @Headers('x-royalcare-super-admin-user-id') actorId: string,
  ) {
    const result = await this.usersService.create(dto);
    await this.auditService.log({
      action: 'user.created',
      actorUserId: actorId,
      targetUserId: result.id,
      metadata: { email: dto.email, fullName: dto.fullName },
    });
    return result;
  }

  @Get(':userId')
  @RequirePermissions('view:users')
  getById(@Param('userId') userId: string) {
    return this.usersService.getById(userId);
  }

  @Patch(':userId')
  @RequirePermissions('manage:users')
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
    @Headers('x-royalcare-super-admin-user-id') actorId: string,
  ) {
    return this.usersService.update(userId, dto, actorId);
  }

  @Patch(':userId/status')
  @RequirePermissions('manage:users')
  async updateStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
    @Headers('x-royalcare-super-admin-user-id') actorId: string,
  ) {
    return this.usersService.updateStatus(userId, dto, actorId);
  }

  @Post(':userId/reset-password')
  @RequirePermissions('manage:users')
  async resetPassword(
    @Param('userId') userId: string,
    @Body() dto: ResetUserPasswordDto,
    @Headers('x-royalcare-super-admin-user-id') actorId: string,
  ) {
    return this.usersService.resetPassword(userId, dto, actorId);
  }

  @Post(':userId/center-roles')
  @RequirePermissions('manage:users')
  async assignCenterRole(
    @Param('userId') userId: string,
    @Body() dto: AssignCenterRoleDto,
    @Headers('x-royalcare-super-admin-user-id') actorId: string,
  ) {
    const result = await this.usersService.assignCenterRole(userId, dto);
    await this.auditService.log({
      action: 'user.center_role_assigned',
      actorUserId: actorId,
      targetUserId: userId,
      centerId: dto.centerId,
      metadata: { roleKey: dto.roleKey },
    });
    return result;
  }
}
