type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export class ListUsersQueryDto {
  page?: string;
  pageSize?: string;
  role?: string;
  search?: string;
  status?: UserStatus;
}
