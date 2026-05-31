import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { CenterAnalyticsService } from './center-analytics.service';
import type { TrackEventDto } from './center-analytics.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

// Public — no auth required. Called by center website pages.
@Controller('public/centers/:slug/track')
export class PublicCenterTrackController {
  constructor(private readonly analyticsService: CenterAnalyticsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async track(@Param('slug') slug: string, @Body() dto: TrackEventDto) {
    return this.analyticsService.trackEvent(slug, dto);
  }
}

// Tenant (authenticated) — returns analytics dashboard for the logged-in center.
@Controller('tenant/marketing/analytics')
export class TenantCenterAnalyticsController {
  constructor(
    private readonly analyticsService: CenterAnalyticsService,
    private readonly centerAuthService: CenterAuthService,
  ) {}

  @Get()
  async getDashboard(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.analyticsService.getDashboard(
      session.center.id,
      session.permissions,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
