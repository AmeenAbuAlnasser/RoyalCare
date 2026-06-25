import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantBranchesController } from './tenant-branches.controller';

@Module({
  imports: [AuthModule],
  controllers: [TenantBranchesController],
})
export class TenantBranchesModule {}
