import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import {
  AdminUploadsController,
  PublicSystemSettingsController,
  SystemSettingsController,
} from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    SystemSettingsController,
    AdminUploadsController,
    PublicSystemSettingsController,
  ],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
