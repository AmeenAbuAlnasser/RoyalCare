import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenantBillingController } from './controllers/tenant-billing.controller';
import { TenantReportsController } from './controllers/tenant-reports.controller';
import { TenantBillingService } from './services/tenant-billing.service';
import { TenantCreditService } from './services/tenant-credit.service';
import { TenantPaymentService } from './services/tenant-payment.service';
import { TenantReportsService } from './services/tenant-reports.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [TenantBillingController, TenantReportsController],
  providers: [
    TenantBillingService,
    TenantPaymentService,
    TenantCreditService,
    TenantReportsService,
  ],
})
export class BillingModule {}
