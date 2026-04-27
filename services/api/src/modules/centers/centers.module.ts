import { Module } from '@nestjs/common';
import {
  CentersAliasController,
  CentersController,
} from './centers.controller';
import { CentersService } from './centers.service';

@Module({
  controllers: [CentersController, CentersAliasController],
  providers: [CentersService],
  exports: [CentersService],
})
export class CentersModule {}
