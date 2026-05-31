export class ListNotificationsQueryDto {
  category?: string;
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  centerId?: string;
  unreadOnly?: string;
}
