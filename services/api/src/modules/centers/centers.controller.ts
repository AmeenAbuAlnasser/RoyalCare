import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { ListCentersQueryDto } from './dto/list-centers-query.dto';

@Controller('super-admin/centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Get()
  list(@Query() query: ListCentersQueryDto) {
    return this.centersService.list(query);
  }

  @Post()
  create(@Body() dto: CreateCenterDto) {
    return this.centersService.create(dto);
  }

  @Get(':centerId')
  getById(@Param('centerId') centerId: string) {
    return this.centersService.getById(centerId);
  }
}

@Controller('centers')
export class CentersAliasController {
  constructor(private readonly centersService: CentersService) {}

  @Get()
  list(@Query() query: ListCentersQueryDto) {
    return this.centersService.list(query);
  }

  @Post()
  create(@Body() dto: CreateCenterDto) {
    return this.centersService.create(dto);
  }

  @Get(':centerId')
  getById(@Param('centerId') centerId: string) {
    return this.centersService.getById(centerId);
  }
}
