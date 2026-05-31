import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicDomainLookupController,
  TenantDomainsController,
} from './tenant-domains.controller';
import { TenantDomainsService } from './tenant-domains.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PublicDomainLookupController, TenantDomainsController],
  providers: [TenantDomainsService],
})
export class TenantDomainsModule {}
