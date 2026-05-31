export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export class CreatePatientDto {
  dateOfBirth?: string;
  email?: string;
  fullName!: string;
  fullNameAr?: string;
  fullNameHe?: string;
  fullNameEn?: string;
  gender?: PatientGender;
  nationalId?: string;
  notes?: string;
  phone!: string;
  status?: PatientStatus;
}
