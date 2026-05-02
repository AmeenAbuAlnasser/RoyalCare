type CenterStatusAction = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export class UpdateCenterStatusDto {
  reason?: string;
  status!: CenterStatusAction;
}
