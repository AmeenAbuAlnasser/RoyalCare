type CenterStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'ARCHIVED';
type CenterType =
  | 'LASER'
  | 'PHYSIOTHERAPY'
  | 'HIJAMA'
  | 'BEAUTY'
  | 'WELLNESS'
  | 'MULTI_SPECIALTY';

export class ListCentersQueryDto {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: CenterStatus;
  type?: CenterType;
}
