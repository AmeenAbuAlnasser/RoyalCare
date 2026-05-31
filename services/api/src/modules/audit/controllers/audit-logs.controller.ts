import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import { AuditService } from '../audit.service';

@Controller('super-admin/audit-logs')
@UseGuards(PermissionGuard)
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('view:audit_logs')
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.list(query);
  }
}
