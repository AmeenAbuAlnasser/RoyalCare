import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicCenterReviewsController,
  TenantCenterReviewsController,
} from './center-reviews.controller';
import { CenterReviewsService } from './center-reviews.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PublicCenterReviewsController, TenantCenterReviewsController],
  providers: [CenterReviewsService],
})
export class CenterReviewsModule {}
