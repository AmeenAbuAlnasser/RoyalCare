import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PatientsController } from './controllers/patients.controller';
import { PatientCreditService } from './services/patient-credit.service';
import { PatientsService } from './services/patients.service';

@Module({
  imports: [AuthModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientCreditService],
})
export class CustomersModule {}
