import type {
  CenterStaffRole,
  CenterStaffStatus,
} from './create-center-staff.dto';

export class UpdateCenterStaffDto {
  email?: string;
  fullName?: string;
  phone?: string;
  role?: CenterStaffRole;
  status?: CenterStaffStatus;
}
