import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../../auth/services/center-session.service';
import { CreateTenantServiceDto } from '../dto/create-service.dto';
import { UpdateTenantServiceStatusDto } from '../dto/update-service-status.dto';
import { UpdateTenantServiceDto } from '../dto/update-service.dto';
import { TenantServicesService } from '../services/tenant-services.service';

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

@Controller('tenant/services')
export class TenantServicesController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly tenantServicesService: TenantServicesService,
  ) {}

  @Get()
  async list(@Req() request: Request) {
    const session = await this.getSession(request);

    return this.tenantServicesService.list(
      session.center.id,
      session.permissions,
    );
  }

  @Post()
  async create(@Req() request: Request, @Body() dto: CreateTenantServiceDto) {
    const session = await this.getSession(request);

    return this.tenantServicesService.create(
      session.center.id,
      session.permissions,
      session.center.primaryLanguage,
      dto,
    );
  }

  @Get(':serviceId')
  async getById(
    @Req() request: Request,
    @Param('serviceId') serviceId: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantServicesService.getById(
      session.center.id,
      session.permissions,
      serviceId,
    );
  }

  @Patch(':serviceId')
  async update(
    @Req() request: Request,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateTenantServiceDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantServicesService.update(
      session.center.id,
      session.permissions,
      session.center.primaryLanguage,
      serviceId,
      dto,
    );
  }

  @Patch(':serviceId/status')
  async updateStatus(
    @Req() request: Request,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateTenantServiceStatusDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantServicesService.updateStatus(
      session.center.id,
      session.permissions,
      serviceId,
      dto,
    );
  }

  @Delete(':serviceId')
  async safeDelete(
    @Req() request: Request,
    @Param('serviceId') serviceId: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantServicesService.safeDelete(
      session.center.id,
      session.permissions,
      serviceId,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
