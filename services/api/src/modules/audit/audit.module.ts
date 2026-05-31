import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditService } from './audit.service';
import { AuditLogsController } from './controllers/audit-logs.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
