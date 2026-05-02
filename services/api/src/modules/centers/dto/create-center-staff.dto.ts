export type CenterStaffRole =
  | 'CENTER_OWNER'
  | 'CENTER_MANAGER'
  | 'DOCTOR'
  | 'RECEPTIONIST'
  | 'ACCOUNTANT'
  | 'STAFF';

export type CenterStaffStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export class CreateCenterStaffDto {
  email!: string;
  fullName!: string;
  phone!: string;
  role!: CenterStaffRole;
  status?: CenterStaffStatus;
}
