import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../../auth/services/center-session.service';
import { UpdatePatientFollowUpNoteDto } from '../dto/update-follow-up-note.dto';
import { UpdatePatientFollowUpStatusDto } from '../dto/update-follow-up-status.dto';
import { PatientFollowUpsService } from '../services/patient-follow-ups.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('tenant/follow-ups')
export class PatientFollowUpsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly patientFollowUpsService: PatientFollowUpsService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('filter') filter?: string,
    @Query('patientId') patientId?: string,
  ) {
    const session = await this.getSession(request);

    return this.patientFollowUpsService.list(
      session.center.id,
      session.permissions,
      { filter, patientId },
    );
  }

  @Get('analytics')
  async analytics(@Req() request: Request) {
    const session = await this.getSession(request);

    return this.patientFollowUpsService.analytics(
      session.center.id,
      session.permissions,
    );
  }

  @Get(':followUpId')
  async getById(
    @Req() request: Request,
    @Param('followUpId') followUpId: string,
  ) {
    const session = await this.getSession(request);

    return this.patientFollowUpsService.getByIdForTenant(
      session.center.id,
      session.permissions,
      followUpId,
    );
  }

  @Patch(':followUpId/status')
  async updateStatus(
    @Req() request: Request,
    @Param('followUpId') followUpId: string,
    @Body() dto: UpdatePatientFollowUpStatusDto,
  ) {
    const session = await this.getSession(request);

    return this.patientFollowUpsService.updateStatus(
      session.center.id,
      session.permissions,
      followUpId,
      dto.status,
    );
  }

  @Patch(':followUpId/notes')
  async updateNotes(
    @Req() request: Request,
    @Param('followUpId') followUpId: string,
    @Body() dto: UpdatePatientFollowUpNoteDto,
  ) {
    const session = await this.getSession(request);

    return this.patientFollowUpsService.updateNotes(
      session.center.id,
      session.permissions,
      followUpId,
      dto.notes,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
