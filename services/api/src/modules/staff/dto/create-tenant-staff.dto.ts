export type TenantStaffRole =
  | 'CENTER_OWNER'
  | 'CENTER_MANAGER'
  | 'DOCTOR'
  | 'RECEPTIONIST'
  | 'ACCOUNTANT'
  | 'STAFF';

export type TenantStaffStatus = 'ACTIVE' | 'INACTIVE';

export class CreateTenantStaffDto {
  email!: string;
  fullName!: string;
  password!: string;
  role!: TenantStaffRole;
  status?: TenantStaffStatus;
}
