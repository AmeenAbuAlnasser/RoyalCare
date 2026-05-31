import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CenterSubscriptionsController } from './center-subscriptions.controller';
import { SubscriptionLifecycleJobService } from './subscription-lifecycle-job.service';
import { SubscriptionInvoicesService } from './subscription-invoices.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [SubscriptionsController, CenterSubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionLifecycleJobService,
    SubscriptionInvoicesService,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionLifecycleJobService,
    SubscriptionInvoicesService,
  ],
})
export class SubscriptionsModule {}
