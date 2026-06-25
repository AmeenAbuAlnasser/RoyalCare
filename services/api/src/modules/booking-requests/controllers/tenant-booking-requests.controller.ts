import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../../auth/services/center-session.service';
import { BookingRequestsService } from '../booking-requests.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('tenant/booking-requests')
export class TenantBookingRequestsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly bookingRequestsService: BookingRequestsService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    const session = await this.getSession(request);
    return this.bookingRequestsService.list(
      session.center.id,
      session.permissions,
      status,
      branchId,
    );
  }

  @Patch(':requestId/accept')
  async accept(
    @Req() request: Request,
    @Param('requestId') requestId: string,
    @Body() body?: { patientResolution?: 'CREATE_NEW' | 'LINK_EXISTING' },
  ) {
    const session = await this.getSession(request);
    return this.bookingRequestsService.accept(
      session.center.id,
      session.permissions,
      session.user.id,
      requestId,
      body?.patientResolution,
    );
  }

  @Patch(':requestId/prepare-conversion')
  async prepareConversion(
    @Req() request: Request,
    @Param('requestId') requestId: string,
  ) {
    const session = await this.getSession(request);
    return this.bookingRequestsService.prepareConversion(
      session.center.id,
      session.permissions,
      session.user.id,
      requestId,
    );
  }

  @Patch(':requestId/link')
  async link(
    @Req() request: Request,
    @Param('requestId') requestId: string,
    @Body() body: { appointmentId?: string },
  ) {
    const session = await this.getSession(request);
    return this.bookingRequestsService.linkAppointment(
      session.center.id,
      session.permissions,
      session.user.id,
      requestId,
      body?.appointmentId ?? '',
    );
  }

  @Patch(':requestId/reject')
  async reject(@Req() request: Request, @Param('requestId') requestId: string) {
    const session = await this.getSession(request);
    return this.bookingRequestsService.reject(
      session.center.id,
      session.permissions,
      session.user.id,
      requestId,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
