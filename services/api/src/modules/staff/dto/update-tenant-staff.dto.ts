import type {
  TenantStaffRole,
  TenantStaffStatus,
} from './create-tenant-staff.dto';

export class UpdateTenantStaffDto {
  email?: string;
  fullName?: string;
  password?: string;
  providerEnabled?: boolean;
  role?: TenantStaffRole;
  status?: TenantStaffStatus;
}
