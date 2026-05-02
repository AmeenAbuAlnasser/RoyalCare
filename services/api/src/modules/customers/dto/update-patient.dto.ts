import type { PatientGender, PatientStatus } from './create-patient.dto';

export class UpdatePatientDto {
  dateOfBirth?: string | null;
  email?: string | null;
  fullName?: string;
  gender?: PatientGender;
  nationalId?: string | null;
  notes?: string | null;
  phone?: string;
  status?: PatientStatus;
}
