export class ListAuditLogsQueryDto {
  actorUserId?: string;
  actorSearch?: string;
  targetUserId?: string;
  targetSearch?: string;
  centerId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
