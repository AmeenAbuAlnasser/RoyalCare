import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantMarketingSettingsController } from './tenant-marketing-settings.controller';
import { TenantMarketingSettingsService } from './tenant-marketing-settings.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantMarketingSettingsController],
  providers: [TenantMarketingSettingsService],
})
export class MarketingSettingsModule {}
