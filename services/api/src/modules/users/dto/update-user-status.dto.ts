type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export class UpdateUserStatusDto {
  status!: UserStatus;
}
