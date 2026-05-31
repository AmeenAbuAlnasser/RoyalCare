import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import {
  PublicCenterLeadsController,
  SuperAdminCenterLeadsController,
} from './center-leads.controller';
import { CenterLeadsService } from './center-leads.service';

@Module({
  imports: [DatabaseModule, PermissionsModule],
  controllers: [PublicCenterLeadsController, SuperAdminCenterLeadsController],
  providers: [CenterLeadsService],
})
export class CenterLeadsModule {}
