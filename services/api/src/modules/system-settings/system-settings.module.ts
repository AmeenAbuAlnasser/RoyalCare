import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import {
  AdminUploadsController,
  PublicPlatformContactController,
  PublicSystemSettingsController,
  SystemSettingsController,
} from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';

@Module({
  imports: [DatabaseModule, PermissionsModule],
  controllers: [
    SystemSettingsController,
    AdminUploadsController,
    PublicSystemSettingsController,
    PublicPlatformContactController,
  ],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
