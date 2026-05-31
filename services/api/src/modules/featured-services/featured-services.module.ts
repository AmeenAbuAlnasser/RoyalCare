import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import {
  AdminFeaturedServicesController,
  PublicFeaturedServicesController,
} from './featured-services.controller';
import { FeaturedServicesService } from './featured-services.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AdminFeaturedServicesController,
    PublicFeaturedServicesController,
  ],
  providers: [FeaturedServicesService],
})
export class FeaturedServicesModule {}
