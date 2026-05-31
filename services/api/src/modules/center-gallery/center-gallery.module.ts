import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicCenterGalleryController,
  TenantCenterGalleryController,
} from './center-gallery.controller';
import { CenterGalleryService } from './center-gallery.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PublicCenterGalleryController, TenantCenterGalleryController],
  providers: [CenterGalleryService],
})
export class CenterGalleryModule {}
