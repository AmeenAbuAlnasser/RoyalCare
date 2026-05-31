import { Module } from '@nestjs/common';
import { ScheduleService } from '../../common/schedule/schedule.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PatientFollowUpsModule } from '../patient-follow-ups/patient-follow-ups.module';
import { AppointmentReminderScheduler } from './appointment-reminder.scheduler';
import { TenantAppointmentsController } from './controllers/tenant-appointments.controller';
import { AppointmentReminderService } from './services/appointment-reminder.service';
import { TenantAppointmentsService } from './services/tenant-appointments.service';

@Module({
  imports: [AuthModule, AuditModule, PatientFollowUpsModule],
  controllers: [TenantAppointmentsController],
  providers: [
    TenantAppointmentsService,
    AppointmentReminderService,
    AppointmentReminderScheduler,
    ScheduleService,
  ],
})
export class AppointmentsModule {}
