import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicCenterSeoController,
  TenantCenterSeoController,
} from './center-seo.controller';
import { CenterSeoService } from './center-seo.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PublicCenterSeoController, TenantCenterSeoController],
  providers: [CenterSeoService],
})
export class CenterSeoModule {}
