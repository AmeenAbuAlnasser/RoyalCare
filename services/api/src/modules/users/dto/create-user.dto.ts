type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export class CreateUserDto {
  email?: string;
  fullName!: string;
  passwordHash?: string;
  phone?: string;
  status?: UserStatus;
}
