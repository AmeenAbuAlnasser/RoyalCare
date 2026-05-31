import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { TenantRolesController } from './controllers/tenant-roles.controller';
import { TenantStaffController } from './controllers/tenant-staff.controller';
import { TenantRolesService } from './services/tenant-roles.service';
import { TenantStaffService } from './services/tenant-staff.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [TenantStaffController, TenantRolesController],
  providers: [TenantStaffService, TenantRolesService],
})
export class StaffModule {}
