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
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdateInvoiceStatusDto } from '../dto/update-invoice-status.dto';
import { UseCreditDto } from '../dto/use-credit.dto';
import { TenantBillingService } from '../services/tenant-billing.service';
import { TenantCreditService } from '../services/tenant-credit.service';
import { TenantPaymentService } from '../services/tenant-payment.service';

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

@Controller('tenant/billing')
export class TenantBillingController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly tenantBillingService: TenantBillingService,
    private readonly tenantPaymentService: TenantPaymentService,
    private readonly tenantCreditService: TenantCreditService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantBillingService.list(session.center.id, session.role.key, {
      search,
      status,
    });
  }

  @Get('options')
  async getOptions(@Req() request: Request) {
    const session = await this.getSession(request);

    return this.tenantBillingService.getOptions(
      session.center.id,
      session.role.key,
    );
  }

  @Post()
  async create(@Req() request: Request, @Body() dto: CreateInvoiceDto) {
    const session = await this.getSession(request);

    return this.tenantBillingService.create(
      session.center.id,
      session.role.key,
      dto,
    );
  }

  @Get(':invoiceId')
  async getById(
    @Req() request: Request,
    @Param('invoiceId') invoiceId: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantBillingService.getById(
      session.center.id,
      session.role.key,
      invoiceId,
    );
  }

  @Patch(':invoiceId/status')
  async updateStatus(
    @Req() request: Request,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantBillingService.updateStatus(
      session.center.id,
      session.role.key,
      invoiceId,
      dto,
    );
  }

  @Post(':invoiceId/payments')
  async createPayment(
    @Req() request: Request,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantPaymentService.create(
      session.center.id,
      session.role.key,
      invoiceId,
      session.user.id,
      dto,
    );
  }

  @Get(':invoiceId/payments')
  async listPayments(
    @Req() request: Request,
    @Param('invoiceId') invoiceId: string,
  ) {
    const session = await this.getSession(request);

    return this.tenantPaymentService.list(
      session.center.id,
      session.role.key,
      invoiceId,
    );
  }

  @Post(':invoiceId/use-credit')
  async useCredit(
    @Req() request: Request,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: UseCreditDto,
  ) {
    const session = await this.getSession(request);

    return this.tenantCreditService.useCredit(
      session.center.id,
      session.role.key,
      invoiceId,
      session.user.id,
      dto,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
