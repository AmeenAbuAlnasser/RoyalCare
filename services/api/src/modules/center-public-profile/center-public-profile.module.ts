import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import {
  AdminCenterPublicProfileController,
  TenantCenterPublicProfileController,
} from './center-public-profile.controller';
import { CenterPublicProfileService } from './center-public-profile.service';

@Module({
  imports: [DatabaseModule, AuthModule, PermissionsModule],
  controllers: [
    AdminCenterPublicProfileController,
    TenantCenterPublicProfileController,
  ],
  providers: [CenterPublicProfileService],
})
export class CenterPublicProfileModule {}
