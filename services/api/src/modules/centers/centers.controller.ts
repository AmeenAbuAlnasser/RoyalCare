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
import { CentersService } from './centers.service';
import { CreateCenterInternalNoteDto } from './dto/create-center-internal-note.dto';
import { CreateCenterStaffDto } from './dto/create-center-staff.dto';
import { CreateCenterDto } from './dto/create-center.dto';
import { ListCentersQueryDto } from './dto/list-centers-query.dto';
import { ResetCenterStaffPasswordDto } from './dto/reset-center-staff-password.dto';
import { UpdateCenterStaffStatusDto } from './dto/update-center-staff-status.dto';
import { UpdateCenterStaffDto } from './dto/update-center-staff.dto';
import { UpdateCenterStatusDto } from './dto/update-center-status.dto';
import { UpdateCenterSubscriptionDto } from './dto/update-center-subscription.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@Controller('super-admin/centers')
@UseGuards(PermissionGuard)
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Get()
  @RequirePermissions('view:centers')
  list(@Query() query: ListCentersQueryDto) {
    return this.centersService.list(query);
  }

  @Post()
  @RequirePermissions('create:centers')
  create(@Body() dto: CreateCenterDto) {
    return this.centersService.create(dto);
  }

  @Get(':centerId/staff')
  @RequirePermissions('view:users')
  listStaff(@Param('centerId') centerId: string) {
    return this.centersService.listStaff(centerId);
  }

  @Post(':centerId/staff')
  @RequirePermissions('manage:users')
  createStaff(
    @Param('centerId') centerId: string,
    @Body() dto: CreateCenterStaffDto,
  ) {
    return this.centersService.createStaff(centerId, dto);
  }

  @Patch(':centerId/staff/:userId')
  @RequirePermissions('manage:users')
  updateStaff(
    @Param('centerId') centerId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateCenterStaffDto,
  ) {
    return this.centersService.updateStaff(centerId, userId, dto);
  }

  @Patch(':centerId/staff/:userId/status')
  @RequirePermissions('manage:users')
  updateStaffStatus(
    @Param('centerId') centerId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateCenterStaffStatusDto,
  ) {
    return this.centersService.updateStaffStatus(centerId, userId, dto);
  }

  @Post(':centerId/staff/:userId/reset-password')
  @RequirePermissions('manage:users')
  resetStaffPassword(
    @Param('centerId') centerId: string,
    @Param('userId') userId: string,
    @Body() dto: ResetCenterStaffPasswordDto,
  ) {
    return this.centersService.resetStaffPassword(centerId, userId, dto);
  }

  @Get(':centerId')
  @RequirePermissions('view:centers')
  getById(@Param('centerId') centerId: string) {
    return this.centersService.getById(centerId);
  }

  @Patch(':centerId/status')
  @RequirePermissions('suspend:centers')
  updateStatus(
    @Param('centerId') centerId: string,
    @Body() dto: UpdateCenterStatusDto,
    @Headers('x-royalcare-super-admin-user-id') authorId?: string,
  ) {
    return this.centersService.updateStatus(centerId, dto, authorId);
  }

  @Patch(':centerId/subscription')
  @RequirePermissions('manage:subscriptions')
  updateSubscription(
    @Param('centerId') centerId: string,
    @Body() dto: UpdateCenterSubscriptionDto,
    @Headers('x-royalcare-super-admin-user-id') authorId?: string,
  ) {
    return this.centersService.updateSubscription(centerId, dto, authorId);
  }

  @Patch(':centerId')
  @RequirePermissions('edit:centers')
  update(@Param('centerId') centerId: string, @Body() dto: UpdateCenterDto) {
    return this.centersService.update(centerId, dto);
  }

  @Get(':centerId/internal-notes')
  @RequirePermissions('view:internal_notes')
  listInternalNotes(@Param('centerId') centerId: string) {
    return this.centersService.listInternalNotes(centerId);
  }

  @Post(':centerId/internal-notes')
  @RequirePermissions('manage:internal_notes')
  createInternalNote(
    @Param('centerId') centerId: string,
    @Body() dto: CreateCenterInternalNoteDto,
    @Headers('x-royalcare-super-admin-user-id') authorId?: string,
  ) {
    return this.centersService.createInternalNote(centerId, dto, authorId);
  }
}

@Controller('centers')
@UseGuards(PermissionGuard)
export class CentersAliasController {
  constructor(private readonly centersService: CentersService) {}

  @Get()
  @RequirePermissions('view:centers')
  list(@Query() query: ListCentersQueryDto) {
    return this.centersService.list(query);
  }

  @Post()
  @RequirePermissions('create:centers')
  create(@Body() dto: CreateCenterDto) {
    return this.centersService.create(dto);
  }

  @Get(':centerId/staff')
  @RequirePermissions('view:users')
  listStaff(@Param('centerId') centerId: string) {
    return this.centersService.listStaff(centerId);
  }

  @Post(':centerId/staff')
  @RequirePermissions('manage:users')
  createStaff(
    @Param('centerId') centerId: string,
    @Body() dto: CreateCenterStaffDto,
  ) {
    return this.centersService.createStaff(centerId, dto);
  }

  @Patch(':centerId/staff/:userId')
  @RequirePermissions('manage:users')
  updateStaff(
    @Param('centerId') centerId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateCenterStaffDto,
  ) {
    return this.centersService.updateStaff(centerId, userId, dto);
  }

  @Patch(':centerId/staff/:userId/status')
  @RequirePermissions('manage:users')
  updateStaffStatus(
    @Param('centerId') centerId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateCenterStaffStatusDto,
  ) {
    return this.centersService.updateStaffStatus(centerId, userId, dto);
  }

  @Post(':centerId/staff/:userId/reset-password')
  @RequirePermissions('manage:users')
  resetStaffPassword(
    @Param('centerId') centerId: string,
    @Param('userId') userId: string,
    @Body() dto: ResetCenterStaffPasswordDto,
  ) {
    return this.centersService.resetStaffPassword(centerId, userId, dto);
  }

  @Get(':centerId')
  @RequirePermissions('view:centers')
  getById(@Param('centerId') centerId: string) {
    return this.centersService.getById(centerId);
  }

  @Patch(':centerId/status')
  @RequirePermissions('suspend:centers')
  updateStatus(
    @Param('centerId') centerId: string,
    @Body() dto: UpdateCenterStatusDto,
    @Headers('x-royalcare-super-admin-user-id') authorId?: string,
  ) {
    return this.centersService.updateStatus(centerId, dto, authorId);
  }

  @Patch(':centerId/subscription')
  @RequirePermissions('manage:subscriptions')
  updateSubscription(
    @Param('centerId') centerId: string,
    @Body() dto: UpdateCenterSubscriptionDto,
    @Headers('x-royalcare-super-admin-user-id') authorId?: string,
  ) {
    return this.centersService.updateSubscription(centerId, dto, authorId);
  }

  @Patch(':centerId')
  @RequirePermissions('edit:centers')
  update(@Param('centerId') centerId: string, @Body() dto: UpdateCenterDto) {
    return this.centersService.update(centerId, dto);
  }

  @Get(':centerId/internal-notes')
  @RequirePermissions('view:internal_notes')
  listInternalNotes(@Param('centerId') centerId: string) {
    return this.centersService.listInternalNotes(centerId);
  }

  @Post(':centerId/internal-notes')
  @RequirePermissions('manage:internal_notes')
  createInternalNote(
    @Param('centerId') centerId: string,
    @Body() dto: CreateCenterInternalNoteDto,
    @Headers('x-royalcare-super-admin-user-id') authorId?: string,
  ) {
    return this.centersService.createInternalNote(centerId, dto, authorId);
  }
}
