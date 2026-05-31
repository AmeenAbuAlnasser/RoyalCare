import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { SuperAdminAnalyticsService } from './super-admin-analytics.service';

@Controller('super-admin/analytics')
@UseGuards(PermissionGuard)
export class SuperAdminAnalyticsController {
  constructor(private readonly analyticsService: SuperAdminAnalyticsService) {}

  @Get('dashboard')
  @RequirePermissions('view:reports')
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('centers-at-risk')
  @RequirePermissions('view:reports')
  getCentersAtRisk() {
    return this.analyticsService.getCentersAtRisk();
  }
}
