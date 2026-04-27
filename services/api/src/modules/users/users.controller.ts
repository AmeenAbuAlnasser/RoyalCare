import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AssignCenterRoleDto } from './dto/assign-center-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';

@Controller('super-admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':userId')
  getById(@Param('userId') userId: string) {
    return this.usersService.getById(userId);
  }

  @Post(':userId/center-roles')
  assignCenterRole(
    @Param('userId') userId: string,
    @Body() dto: AssignCenterRoleDto,
  ) {
    return this.usersService.assignCenterRole(userId, dto);
  }
}
