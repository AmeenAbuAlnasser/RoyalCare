import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../../auth/services/center-session.service';
import { CreateTenantStaffDto } from '../dto/create-tenant-staff.dto';
import { UpdateTenantStaffStatusDto } from '../dto/update-tenant-staff-status.dto';
import { UpdateTenantStaffDto } from '../dto/update-tenant-staff.dto';
import { TenantStaffService } from '../services/tenant-staff.service';

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

@Controller('tenant/staff')
export class TenantStaffController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly tenantStaffService: TenantStaffService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantStaffService.list(
      session.center.id,
      session.permissions,
      {
        role,
        search,
        status,
      },
    );
  }

  @Post()
  async create(@Req() request: Request, @Body() dto: CreateTenantStaffDto) {
    const session = await this.getSession(request);

    return this.tenantStaffService.create(
      session.center.id,
      session.permissions,
      dto,
    );
  }

  @Get(':staffId')
  async getById(@Req() request: Request, @Param('staffId') staffId: string) {
    const session = await this.getSession(request);

    return this.tenantStaffService.getById(
      session.center.id,
      session.permissions,
      staffId,
    );
  }

  @Patch(':staffId')
  async update(
    @Req() request: Request,
    @Param('staffId') staffId: string,
    @Body() dto: UpdateTenantStaffDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantStaffService.update(
      session.center.id,
      session.permissions,
      staffId,
      dto,
    );
  }

  @Patch(':staffId/status')
  async updateStatus(
    @Req() request: Request,
    @Param('staffId') staffId: string,
    @Body() dto: UpdateTenantStaffStatusDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantStaffService.updateStatus(
      session.center.id,
      session.center.name,
      session.permissions,
      session.user.id,
      session.user.fullName,
      session.impersonation?.impersonatorUserId,
      staffId,
      dto,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
