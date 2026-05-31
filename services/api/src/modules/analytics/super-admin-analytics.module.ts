import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { SuperAdminAnalyticsController } from './super-admin-analytics.controller';
import { SuperAdminAnalyticsService } from './super-admin-analytics.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [SuperAdminAnalyticsController],
  providers: [SuperAdminAnalyticsService],
})
export class SuperAdminAnalyticsModule {}
