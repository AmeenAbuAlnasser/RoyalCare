import { Module } from '@nestjs/common';
import { ScheduleService } from '../../common/schedule/schedule.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MetaConversionsService } from './meta-conversions.service';
import { PublicCentersController } from './public-centers.controller';
import { PublicCentersService } from './public-centers.service';

@Module({
  imports: [NotificationsModule],
  controllers: [PublicCentersController],
  providers: [MetaConversionsService, PublicCentersService, ScheduleService],
})
export class PublicCentersModule {}
