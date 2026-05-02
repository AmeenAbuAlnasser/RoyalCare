import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantAppointmentsController } from './controllers/tenant-appointments.controller';
import { TenantAppointmentsService } from './services/tenant-appointments.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantAppointmentsController],
  providers: [TenantAppointmentsService],
})
export class AppointmentsModule {}
