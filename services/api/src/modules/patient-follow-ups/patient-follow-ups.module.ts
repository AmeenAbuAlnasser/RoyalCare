import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PatientFollowUpsController } from './controllers/patient-follow-ups.controller';
import { PatientFollowUpsService } from './services/patient-follow-ups.service';

@Module({
  imports: [AuthModule],
  controllers: [PatientFollowUpsController],
  providers: [PatientFollowUpsService],
  exports: [PatientFollowUpsService],
})
export class PatientFollowUpsModule {}
