import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicCenterOffersController,
  TenantCenterOffersController,
} from './center-offers.controller';
import { CenterOffersService } from './center-offers.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PublicCenterOffersController, TenantCenterOffersController],
  providers: [CenterOffersService],
})
export class CenterOffersModule {}
