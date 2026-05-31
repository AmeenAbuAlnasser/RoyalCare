import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicCenterTeamController,
  TenantCenterTeamController,
} from './center-team.controller';
import { CenterTeamService } from './center-team.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PublicCenterTeamController, TenantCenterTeamController],
  providers: [CenterTeamService],
})
export class CenterTeamModule {}
