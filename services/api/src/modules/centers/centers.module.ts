import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminCentersController } from './admin-centers.controller';
import {
  CentersAliasController,
  CentersController,
} from './centers.controller';
import { CentersService } from './centers.service';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [
    AdminCentersController,
    CentersController,
    CentersAliasController,
  ],
  providers: [CentersService],
  exports: [CentersService],
})
export class CentersModule {}
