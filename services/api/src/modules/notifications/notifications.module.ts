import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionInvoicesService } from '../subscriptions/subscription-invoices.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TenantNotificationsController } from './tenant-notifications.controller';
import { TenantNotificationsService } from './tenant-notifications.service';
import { TenantSubscriptionController } from './tenant-subscription.controller';
import { TenantSubscriptionService } from './tenant-subscription.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [
    NotificationsController,
    TenantNotificationsController,
    TenantSubscriptionController,
  ],
  providers: [
    NotificationsService,
    SubscriptionInvoicesService,
    TenantNotificationsService,
    TenantSubscriptionService,
  ],
  exports: [
    NotificationsService,
    TenantNotificationsService,
    TenantSubscriptionService,
  ],
})
export class NotificationsModule {}
