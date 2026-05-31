type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export class CreateUserDto {
  centerId?: string;
  centerRoleKey?: string;
  email?: string;
  fullName!: string;
  password?: string;
  platformRoleKey?: string;
  phone?: string;
  status?: UserStatus;
  temporaryPassword?: string;
}
