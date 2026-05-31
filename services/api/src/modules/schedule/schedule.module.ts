import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantScheduleController } from './tenant-schedule.controller';
import { TenantScheduleService } from './tenant-schedule.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantScheduleController],
  providers: [TenantScheduleService],
})
export class TenantScheduleModule {}
