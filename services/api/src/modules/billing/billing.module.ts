import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantBillingController } from './controllers/tenant-billing.controller';
import { TenantBillingService } from './services/tenant-billing.service';
import { TenantCreditService } from './services/tenant-credit.service';
import { TenantPaymentService } from './services/tenant-payment.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantBillingController],
  providers: [TenantBillingService, TenantPaymentService, TenantCreditService],
})
export class BillingModule {}
