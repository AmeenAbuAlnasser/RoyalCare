import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../services/center-session.service';
import { CenterAuthService } from '../services/center-auth.service';
import { TenantDashboardService } from '../services/tenant-dashboard.service';

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

@Controller('tenant/dashboard')
export class TenantDashboardController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly tenantDashboardService: TenantDashboardService,
  ) {}

  @Get('stats')
  async getStats(@Req() request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    const session = await this.centerAuthService.getSession(
      verifyCenterSessionToken(token),
    );

    return this.tenantDashboardService.getStats(session.center.id);
  }
}
