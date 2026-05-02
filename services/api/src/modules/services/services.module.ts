import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantServicesController } from './controllers/tenant-services.controller';
import { TenantServicesService } from './services/tenant-services.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantServicesController],
  providers: [TenantServicesService],
})
export class ServicesModule {}
