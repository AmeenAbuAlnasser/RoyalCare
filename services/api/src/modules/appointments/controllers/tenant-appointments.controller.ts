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
import { CancelTenantAppointmentDto } from '../dto/cancel-tenant-appointment.dto';
import { CreateTenantAppointmentDto } from '../dto/create-tenant-appointment.dto';
import { UpdateTenantAppointmentStatusDto } from '../dto/update-tenant-appointment-status.dto';
import { UpdateTenantAppointmentDto } from '../dto/update-tenant-appointment.dto';
import { TenantAppointmentsService } from '../services/tenant-appointments.service';

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

@Controller('tenant/appointments')
export class TenantAppointmentsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly tenantAppointmentsService: TenantAppointmentsService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('provider') provider?: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantAppointmentsService.list(
      session.center.id,
      session.role.key,
      { date, provider, search, status },
    );
  }

  @Get('options')
  async options(@Req() request: Request) {
    const session = await this.getSession(request);

    return this.tenantAppointmentsService.options(
      session.center.id,
      session.role.key,
    );
  }

  @Post()
  async create(
    @Req() request: Request,
    @Body() dto: CreateTenantAppointmentDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantAppointmentsService.create(
      session.center.id,
      session.role.key,
      session.user.id,
      dto,
    );
  }

  @Get(':appointmentId')
  async getById(
    @Req() request: Request,
    @Param('appointmentId') appointmentId: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantAppointmentsService.getById(
      session.center.id,
      session.role.key,
      appointmentId,
    );
  }

  @Patch(':appointmentId')
  async update(
    @Req() request: Request,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateTenantAppointmentDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantAppointmentsService.update(
      session.center.id,
      session.role.key,
      appointmentId,
      dto,
    );
  }

  @Patch(':appointmentId/status')
  async updateStatus(
    @Req() request: Request,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateTenantAppointmentStatusDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantAppointmentsService.updateStatus(
      session.center.id,
      session.role.key,
      appointmentId,
      dto,
    );
  }

  @Patch(':appointmentId/cancel')
  async cancel(
    @Req() request: Request,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CancelTenantAppointmentDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantAppointmentsService.cancel(
      session.center.id,
      session.role.key,
      appointmentId,
      dto,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
