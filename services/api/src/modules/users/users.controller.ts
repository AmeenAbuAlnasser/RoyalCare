import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { AssignCenterRoleDto } from './dto/assign-center-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';

@Controller('super-admin/users')
@UseGuards(PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('view:users')
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Post()
  @RequirePermissions('manage:users')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':userId')
  @RequirePermissions('view:users')
  getById(@Param('userId') userId: string) {
    return this.usersService.getById(userId);
  }

  @Post(':userId/center-roles')
  @RequirePermissions('manage:users')
  assignCenterRole(
    @Param('userId') userId: string,
    @Body() dto: AssignCenterRoleDto,
  ) {
    return this.usersService.assignCenterRole(userId, dto);
  }
}
