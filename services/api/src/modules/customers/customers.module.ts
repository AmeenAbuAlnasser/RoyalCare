import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PatientPortalModule } from '../patient-portal/patient-portal.module';
import { PatientsController } from './controllers/patients.controller';
import { PatientCreditService } from './services/patient-credit.service';
import { PatientsService } from './services/patients.service';

@Module({
  imports: [AuthModule, AuditModule, PatientPortalModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientCreditService],
})
export class CustomersModule {}
