import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { ManualWhatsAppLogDto } from '../notifications/dto/manual-whatsapp-log.dto';
import { CreateSubscriptionInvoiceDto } from './dto/create-subscription-invoice.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionInvoicesQueryDto } from './dto/list-subscription-invoices-query.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { UpdateSubscriptionInvoiceStatusDto } from './dto/update-subscription-invoice-status.dto';
import { SubscriptionLifecycleJobService } from './subscription-lifecycle-job.service';
import { SubscriptionInvoicesService } from './subscription-invoices.service';
import { SubscriptionsService } from './subscriptions.service';

@Controller('super-admin/subscriptions')
@UseGuards(PermissionGuard)
export class SubscriptionsController {
  constructor(
    private readonly lifecycleJobService: SubscriptionLifecycleJobService,
    private readonly subscriptionInvoicesService: SubscriptionInvoicesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get()
  @RequirePermissions('view:reports')
  list(@Query() query: ListSubscriptionsQueryDto) {
    return this.subscriptionsService.list(query);
  }

  @Post()
  @RequirePermissions('manage:subscriptions')
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Get('invoices')
  @RequirePermissions('view:reports')
  listInvoices(@Query() query: ListSubscriptionInvoicesQueryDto) {
    return this.subscriptionInvoicesService.list(query);
  }

  @Post('invoices')
  @RequirePermissions('manage:subscriptions')
  createInvoice(
    @Body() dto: CreateSubscriptionInvoiceDto,
    @Headers('x-royalcare-super-admin-user-id') actorId?: string,
  ) {
    return this.subscriptionInvoicesService.create(dto, actorId);
  }

  @Patch('invoices/:invoiceId/mark-paid')
  @RequirePermissions('manage:subscriptions')
  markInvoicePaid(
    @Param('invoiceId') invoiceId: string,
    @Body() dto: UpdateSubscriptionInvoiceStatusDto,
    @Headers('x-royalcare-super-admin-user-id') actorId?: string,
  ) {
    return this.subscriptionInvoicesService.markPaid(invoiceId, dto, actorId);
  }

  @Patch('invoices/:invoiceId/cancel')
  @RequirePermissions('manage:subscriptions')
  cancelInvoice(
    @Param('invoiceId') invoiceId: string,
    @Body() dto: UpdateSubscriptionInvoiceStatusDto,
    @Headers('x-royalcare-super-admin-user-id') actorId?: string,
  ) {
    return this.subscriptionInvoicesService.cancel(invoiceId, dto, actorId);
  }

  @Get('invoices/:invoiceId/pdf')
  @RequirePermissions('view:reports')
  downloadInvoicePdf(
    @Param('invoiceId') invoiceId: string,
    @Query('locale') locale?: string,
    @Headers('x-royalcare-super-admin-user-id') actorId?: string,
  ) {
    return this.subscriptionInvoicesService.downloadPdf(
      invoiceId,
      locale,
      actorId,
    );
  }

  @Post('run-lifecycle-job')
  @RequirePermissions('manage:subscriptions')
  runLifecycleJob(
    @Headers('x-royalcare-super-admin-user-id') actorId?: string,
  ) {
    return this.lifecycleJobService.runNow(actorId ?? 'manual');
  }

  @Get('lifecycle-job/status')
  @RequirePermissions('manage:subscriptions')
  getLifecycleJobStatus() {
    return this.lifecycleJobService.getStatus();
  }

  @Get(':id/timeline')
  @RequirePermissions('view:reports')
  getTimeline(@Param('id') id: string) {
    return this.subscriptionsService.getTimeline(id);
  }

  @Post(':id/manual-whatsapp-log')
  @RequirePermissions('manage:subscriptions')
  logManualWhatsApp(
    @Param('id') id: string,
    @Body() dto: ManualWhatsAppLogDto,
    @Headers('x-royalcare-super-admin-user-id') actorId?: string,
  ) {
    return this.subscriptionsService.logManualWhatsApp(id, {
      action: dto.action,
      actorId,
      message: dto.message,
      phone: dto.phone,
    });
  }

  @Get(':id')
  @RequirePermissions('view:reports')
  getById(@Param('id') id: string) {
    return this.subscriptionsService.getById(id);
  }
}
