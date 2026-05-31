import { Module } from '@nestjs/common';
import { ScheduleService } from '../../common/schedule/schedule.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenantBookingRequestsController } from './controllers/tenant-booking-requests.controller';
import { BookingRequestsService } from './booking-requests.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [TenantBookingRequestsController],
  providers: [BookingRequestsService, ScheduleService],
})
export class BookingRequestsModule {}
