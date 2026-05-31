import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionsController } from './controllers/permissions.controller';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionsService } from './services/permissions.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [PermissionsController],
  providers: [PermissionGuard, PermissionsService],
  exports: [PermissionGuard, PermissionsService],
})
export class PermissionsModule {}
