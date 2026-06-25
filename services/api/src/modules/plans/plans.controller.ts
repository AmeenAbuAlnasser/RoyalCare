import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { ReorderPlansDto } from './dto/reorder-plans.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlansService } from './plans.service';

@Controller('super-admin/plans')
@UseGuards(PermissionGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @RequirePermissions('manage:plans')
  list() {
    return this.plansService.list();
  }

  @Post()
  @RequirePermissions('manage:plans')
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  // Declared before PATCH /:id so NestJS does not match "reorder" as a plan id.
  @Patch('reorder')
  @RequirePermissions('manage:plans')
  reorder(@Body() dto: ReorderPlansDto) {
    return this.plansService.reorder(dto);
  }

  @Get(':id')
  @RequirePermissions('manage:plans')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('manage:plans')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('manage:plans')
  softDelete(@Param('id') id: string) {
    return this.plansService.softDelete(id);
  }
}
