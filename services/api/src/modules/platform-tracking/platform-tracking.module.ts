import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import {
  PlatformTrackingController,
  PublicPlatformTrackingController,
} from './platform-tracking.controller';
import { PlatformTrackingService } from './platform-tracking.service';

@Module({
  imports: [DatabaseModule, PermissionsModule],
  controllers: [PlatformTrackingController, PublicPlatformTrackingController],
  providers: [PlatformTrackingService],
})
export class PlatformTrackingModule {}
