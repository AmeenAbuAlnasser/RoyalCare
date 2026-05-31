import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicCenterBeforeAfterController,
  TenantCenterBeforeAfterController,
} from './center-before-after.controller';
import { CenterBeforeAfterService } from './center-before-after.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [
    PublicCenterBeforeAfterController,
    TenantCenterBeforeAfterController,
  ],
  providers: [CenterBeforeAfterService],
})
export class CenterBeforeAfterModule {}
