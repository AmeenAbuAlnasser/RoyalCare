type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export class CreateUserDto {
  email?: string;
  fullName!: string;
  password?: string;
  phone?: string;
  status?: UserStatus;
}
