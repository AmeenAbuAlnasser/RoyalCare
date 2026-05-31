import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { TenantScheduleService } from './tenant-schedule.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('tenant/schedule')
export class TenantScheduleController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly tenantScheduleService: TenantScheduleService,
  ) {}

  @Get()
  async getSchedule(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.tenantScheduleService.getSchedule(
      session.center.id,
      session.permissions,
    );
  }

  @Patch('center-hours')
  async updateCenterHours(
    @Req() request: Request,
    @Body() dto: { hours?: unknown[] },
  ) {
    const session = await this.getSession(request);
    return this.tenantScheduleService.updateCenterHours(
      session.center.id,
      session.permissions,
      (dto.hours ?? []) as never[],
    );
  }

  @Post('closed-days')
  async addClosedDay(
    @Req() request: Request,
    @Body() dto: { date?: string; reason?: string | null },
  ) {
    const session = await this.getSession(request);
    return this.tenantScheduleService.addClosedDay(
      session.center.id,
      session.permissions,
      dto,
    );
  }

  @Delete('closed-days/:id')
  async deleteClosedDay(@Req() request: Request, @Param('id') id: string) {
    const session = await this.getSession(request);
    return this.tenantScheduleService.deleteClosedDay(
      session.center.id,
      session.permissions,
      id,
    );
  }

  @Get('providers/:providerId')
  async getProviderSchedule(
    @Req() request: Request,
    @Param('providerId') providerId: string,
  ) {
    const session = await this.getSession(request);
    return this.tenantScheduleService.getProviderSchedule(
      session.center.id,
      session.permissions,
      providerId,
    );
  }

  @Patch('providers/:providerId/hours')
  async updateProviderHours(
    @Req() request: Request,
    @Param('providerId') providerId: string,
    @Body() dto: { hours?: unknown[] },
  ) {
    const session = await this.getSession(request);
    return this.tenantScheduleService.updateProviderHours(
      session.center.id,
      session.permissions,
      providerId,
      (dto.hours ?? []) as never[],
    );
  }

  @Post('providers/:providerId/leave')
  async addProviderLeave(
    @Req() request: Request,
    @Param('providerId') providerId: string,
    @Body() dto: { date?: string; reason?: string | null },
  ) {
    const session = await this.getSession(request);
    return this.tenantScheduleService.addProviderLeave(
      session.center.id,
      session.permissions,
      providerId,
      dto,
    );
  }

  @Delete('providers/leave/:id')
  async deleteProviderLeave(@Req() request: Request, @Param('id') id: string) {
    const session = await this.getSession(request);
    return this.tenantScheduleService.deleteProviderLeave(
      session.center.id,
      session.permissions,
      id,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
