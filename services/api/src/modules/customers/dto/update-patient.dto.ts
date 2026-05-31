import type { PatientGender, PatientStatus } from './create-patient.dto';

export class UpdatePatientDto {
  dateOfBirth?: string | null;
  email?: string | null;
  fullName?: string;
  fullNameAr?: string | null;
  fullNameHe?: string | null;
  fullNameEn?: string | null;
  gender?: PatientGender;
  nationalId?: string | null;
  notes?: string | null;
  phone?: string;
  status?: PatientStatus;
}
