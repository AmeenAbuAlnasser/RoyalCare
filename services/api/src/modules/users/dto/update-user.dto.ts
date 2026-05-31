type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export class UpdateUserDto {
  email?: string;
  fullName?: string;
  phone?: string;
  status?: UserStatus;
}
