import { Body, Controller, Get, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { TenantMarketingSettingsService } from './tenant-marketing-settings.service';
import type { TenantMarketingSettingsDto } from './tenant-marketing-settings.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('tenant/settings/marketing')
export class TenantMarketingSettingsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly marketingSettingsService: TenantMarketingSettingsService,
  ) {}

  @Get()
  async getSettings(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.marketingSettingsService.getSettings(
      session.center.id,
      session.permissions,
    );
  }

  @Get('logs')
  async getLogs(@Req() request: Request, @Query('limit') limit?: string) {
    const session = await this.getSession(request);
    return this.marketingSettingsService.getLogs(
      session.center.id,
      session.permissions,
      limit,
    );
  }

  @Patch()
  async updateSettings(
    @Req() request: Request,
    @Body() dto: TenantMarketingSettingsDto,
  ) {
    const session = await this.getSession(request);
    return this.marketingSettingsService.updateSettings(
      session.center.id,
      session.permissions,
      dto,
    );
  }

  @Post('test-meta-capi')
  async testMetaCapi(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.marketingSettingsService.testMetaCapi(
      session.center.id,
      session.permissions,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
