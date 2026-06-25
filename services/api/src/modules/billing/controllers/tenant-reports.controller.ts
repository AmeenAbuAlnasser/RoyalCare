import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../../auth/services/center-session.service';
import { TenantReportsService } from '../services/tenant-reports.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('tenant/reports')
export class TenantReportsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly tenantReportsService: TenantReportsService,
  ) {}

  @Get('financial')
  async getFinancial(
    @Req() request: Request,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('openOnly') openOnly?: string,
    @Query('overdueOnly') overdueOnly?: string,
    @Query('to') to?: string,
    @Query('allUnbilled') allUnbilled?: string,
  ) {
    const session = await this.getSession(request);
    return this.tenantReportsService.getFinancial(
      session.center.id,
      session.permissions,
      {
        period,
        from,
        openOnly,
        overdueOnly,
        to,
        allUnbilled,
      },
    );
  }

  @Get('top-patients')
  async getTopPatients(
    @Req() request: Request,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const session = await this.getSession(request);
    return this.tenantReportsService.getTopPatients(
      session.center.id,
      session.permissions,
      {
        period,
        from,
        to,
      },
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
