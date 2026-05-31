import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PermissionsService } from '../permissions/services/permissions.service';
import { CenterLeadsService } from './center-leads.service';
import type {
  CreateCenterLeadDto,
  UpdateCenterLeadStatusDto,
} from './center-leads.service';

async function requireSuperAdmin(
  permissionsService: PermissionsService,
  userId?: string | string[],
) {
  const id = Array.isArray(userId) ? userId[0] : userId;
  if (!id) {
    throw new ForbiddenException({
      message: 'Permission denied',
      errors: { role: 'SUPER_ADMIN role is required.' },
    });
  }
  const ctx = await permissionsService.getUserPermissions(id);
  const roles = ctx.roles as Array<{ key: string }>;
  if (!ctx.user || !roles.some((r) => r.key === 'super_admin')) {
    throw new ForbiddenException({
      message: 'Permission denied',
      errors: { role: 'SUPER_ADMIN role is required.' },
    });
  }
}

// ─── Public: no auth ─────────────────────────────────────────────────────────
@Controller('public/center-leads')
export class PublicCenterLeadsController {
  constructor(private readonly centerLeadsService: CenterLeadsService) {}

  @Post()
  createLead(@Body() dto: CreateCenterLeadDto) {
    return this.centerLeadsService.createLead(dto);
  }
}

// ─── Super Admin: requires x-royalcare-super-admin-user-id header ─────────────
@Controller('super-admin/center-leads')
export class SuperAdminCenterLeadsController {
  constructor(
    private readonly centerLeadsService: CenterLeadsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async listLeads(
    @Headers('x-royalcare-super-admin-user-id') userId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    await requireSuperAdmin(this.permissionsService, userId);
    return this.centerLeadsService.listLeads({
      search,
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Patch(':id')
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCenterLeadStatusDto,
    @Headers('x-royalcare-super-admin-user-id') userId?: string,
  ) {
    await requireSuperAdmin(this.permissionsService, userId);
    return this.centerLeadsService.updateLeadStatus(id, dto);
  }
}
