import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicCenterTrackController,
  TenantCenterAnalyticsController,
} from './center-analytics.controller';
import { CenterAnalyticsService } from './center-analytics.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PublicCenterTrackController, TenantCenterAnalyticsController],
  providers: [CenterAnalyticsService],
})
export class CenterAnalyticsModule {}
