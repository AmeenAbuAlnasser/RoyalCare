import { Controller, Get, Param, Patch, Query, Req, Sse } from '@nestjs/common';
import type { Request } from 'express';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { CenterAuthService } from '../auth/services/center-auth.service';
import { TenantNotificationsService } from './tenant-notifications.service';
import { NotificationsService } from './notifications.service';

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

@Controller('tenant/notifications')
export class TenantNotificationsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly notificationsService: NotificationsService,
    private readonly tenantNotificationsService: TenantNotificationsService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantNotificationsService.listForTenant(session.center.id, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Patch(':id/read')
  async markAsRead(@Req() request: Request, @Param('id') id: string) {
    const session = await this.getSession(request);

    await this.tenantNotificationsService.markAsRead(
      session.center.id,
      id,
      session.user.id,
    );

    return { success: true };
  }

  @Sse('stream')
  async stream(@Req() request: Request) {
    const session = await this.getSession(request);

    return this.notificationsService.streamTenantNotifications(
      session.center.id,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
