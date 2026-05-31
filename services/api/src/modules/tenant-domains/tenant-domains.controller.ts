import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { CenterAuthService } from '../auth/services/center-auth.service';
import { TenantDomainsService } from './tenant-domains.service';

function getCookie(request: Request, name: string): string | undefined {
  return request.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('public/domain-lookup')
export class PublicDomainLookupController {
  constructor(private readonly service: TenantDomainsService) {}

  @Get()
  lookup(@Query('host') host: string) {
    return this.service.publicLookup(host ?? '');
  }
}

@Controller('tenant/domains')
export class TenantDomainsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly service: TenantDomainsService,
  ) {}

  private async getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }

  @Get()
  async list(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.service.list(session.center.id);
  }

  @Post()
  async add(@Req() request: Request, @Body() body: { hostname: string }) {
    const session = await this.getSession(request);
    return this.service.add(session.center.id, body.hostname ?? '');
  }

  @Patch(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: { isPrimary?: boolean },
  ) {
    const session = await this.getSession(request);
    return this.service.update(session.center.id, id, body.isPrimary ?? false);
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string) {
    const session = await this.getSession(request);
    return this.service.delete(session.center.id, id);
  }

  @Post('verify')
  async verify(@Req() request: Request, @Body() body: { domainId: string }) {
    const session = await this.getSession(request);
    return this.service.verify(session.center.id, body.domainId ?? '');
  }
}
