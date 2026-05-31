import { Module } from '@nestjs/common';
import { CenterAuthController } from './controllers/center-auth.controller';
import { PlatformAuthController } from './controllers/platform-auth.controller';
import { TenantDashboardController } from './controllers/tenant-dashboard.controller';
import { TenantSubscriptionAccessMiddleware } from './middleware/tenant-subscription-access.middleware';
import { CenterAuthService } from './services/center-auth.service';
import { PlatformAuthService } from './services/platform-auth.service';
import { TenantDashboardService } from './services/tenant-dashboard.service';
import { TenantSubscriptionAccessService } from './services/tenant-subscription-access.service';

@Module({
  controllers: [CenterAuthController, PlatformAuthController, TenantDashboardController],
  providers: [
    CenterAuthService,
    PlatformAuthService,
    TenantDashboardService,
    TenantSubscriptionAccessMiddleware,
    TenantSubscriptionAccessService,
  ],
  exports: [
    CenterAuthService,
    PlatformAuthService,
    TenantSubscriptionAccessMiddleware,
    TenantSubscriptionAccessService,
  ],
})
export class AuthModule {}
