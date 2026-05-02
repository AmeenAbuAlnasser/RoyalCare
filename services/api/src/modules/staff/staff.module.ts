import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantStaffController } from './controllers/tenant-staff.controller';
import { TenantStaffService } from './services/tenant-staff.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantStaffController],
  providers: [TenantStaffService],
})
export class StaffModule {}
