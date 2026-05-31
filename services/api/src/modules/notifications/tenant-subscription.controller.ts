import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { CenterAuthService } from '../auth/services/center-auth.service';
import { ListSubscriptionInvoicesQueryDto } from '../subscriptions/dto/list-subscription-invoices-query.dto';
import { SubscriptionInvoicesService } from '../subscriptions/subscription-invoices.service';
import { TenantSubscriptionService } from './tenant-subscription.service';
import { CreateRenewalRequestDto } from './dto/create-renewal-request.dto';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('tenant/subscription')
export class TenantSubscriptionController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly subscriptionInvoicesService: SubscriptionInvoicesService,
    private readonly tenantSubscriptionService: TenantSubscriptionService,
  ) {}

  @Get('invoices')
  async listInvoices(
    @Req() request: Request,
    @Query() query: ListSubscriptionInvoicesQueryDto,
  ) {
    const session = await this.getSession(request);
    return this.subscriptionInvoicesService.listForCenter(
      session.center.id,
      query,
    );
  }

  @Post('renewal-request')
  @HttpCode(201)
  async requestRenewal(
    @Req() request: Request,
    @Body() dto: CreateRenewalRequestDto,
  ) {
    const session = await this.getSession(request);

    const result = await this.tenantSubscriptionService.requestRenewal({
      centerId: session.center.id,
      actorUserId: session.user.id,
      note: dto.note,
    });

    return { success: true, notificationId: result.id };
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
