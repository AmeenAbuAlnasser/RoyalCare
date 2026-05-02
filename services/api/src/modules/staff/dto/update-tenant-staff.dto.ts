import type {
  TenantStaffRole,
  TenantStaffStatus,
} from './create-tenant-staff.dto';

export class UpdateTenantStaffDto {
  email?: string;
  fullName?: string;
  password?: string;
  role?: TenantStaffRole;
  status?: TenantStaffStatus;
}
