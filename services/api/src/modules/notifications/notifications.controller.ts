import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { ManualWhatsAppLogDto } from './dto/manual-whatsapp-log.dto';
import { UpdateNotificationStatusDto } from './dto/update-notification-status.dto';
import { NotificationsService } from './notifications.service';

@Controller('super-admin/notifications')
@UseGuards(PermissionGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions('view:reports')
  list(@Query() query: ListNotificationsQueryDto) {
    return this.notificationsService.listForSuperAdmin({
      category: query.category,
      page: query.page ? Number(query.page) : undefined,
      pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      type: query.type,
      status: query.status,
      centerId: query.centerId,
      unreadOnly: query.unreadOnly === 'true',
    });
  }

  @Patch('read-all')
  @RequirePermissions('view:reports')
  markAllAsRead(@Headers('x-royalcare-super-admin-user-id') actorId?: string) {
    return this.notificationsService.markAllAsRead(actorId);
  }

  @Patch(':id/read')
  @RequirePermissions('view:reports')
  markAsRead(
    @Param('id') id: string,
    @Headers('x-royalcare-super-admin-user-id') actorId?: string,
  ) {
    return this.notificationsService.markAsRead(id, actorId);
  }

  @Patch(':id/status')
  @RequirePermissions('view:reports')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationStatusDto,
  ) {
    return this.notificationsService.updateStatus(id, dto.status);
  }

  @Post(':id/manual-whatsapp-log')
  @RequirePermissions('view:reports')
  logManualWhatsApp(
    @Param('id') id: string,
    @Body() dto: ManualWhatsAppLogDto,
    @Headers('x-royalcare-super-admin-user-id') actorId?: string,
  ) {
    return this.notificationsService.logManualWhatsApp(id, {
      phone: dto.phone,
      message: dto.message,
      action: dto.action,
      actorId,
    });
  }
}
