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
import { CloseFollowUpPlanDto } from '../dto/close-follow-up-plan.dto';
import { UpdatePatientFollowUpNoteDto } from '../dto/update-follow-up-note.dto';
import { UpdatePatientFollowUpDueDateDto } from '../dto/update-follow-up-due-date.dto';
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
    @Query('includeAll') includeAll?: string,
    @Query('includeAllForPatient') includeAllForPatient?: string,
    @Query('branchId') branchId?: string,
    @Query('kind') kind?: string,
  ) {
    console.log('[follow-ups:controller:list]', {
      filter,
      includeAll,
      includeAllForPatient,
      patientId,
      includeAllType: typeof includeAll,
      includeAllIsStringTrue: includeAll === 'true',
    });
    const session = await this.getSession(request);
    console.log('[follow-ups:controller:list:session]', {
      centerId: session.center.id,
      centerName: session.center.name,
    });

    return this.patientFollowUpsService.list(
      session.center.id,
      session.permissions,
      { filter, includeAll, includeAllForPatient, patientId, branchId, kind },
    );
  }

  @Get('analytics')
  async analytics(
    @Req() request: Request,
    @Query('branchId') branchId?: string,
  ) {
    const session = await this.getSession(request);

    return this.patientFollowUpsService.analytics(
      session.center.id,
      session.permissions,
      branchId,
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
      session.user.id,
      followUpId,
      dto.status,
      dto.nextAppointmentId,
    );
  }

  @Patch(':followUpId/reminder')
  async recordReminder(
    @Req() request: Request,
    @Param('followUpId') followUpId: string,
  ) {
    const session = await this.getSession(request);
    return this.patientFollowUpsService.recordRecurringReminder(
      session.center.id,
      session.permissions,
      session.user.id,
      followUpId,
    );
  }

  @Patch(':followUpId/skip-cycle')
  async skipCycle(
    @Req() request: Request,
    @Param('followUpId') followUpId: string,
  ) {
    const session = await this.getSession(request);
    return this.patientFollowUpsService.skipRecurringCycle(
      session.center.id,
      session.permissions,
      session.user.id,
      followUpId,
    );
  }

  @Patch(':followUpId/pause')
  async pauseRecurring(
    @Req() request: Request,
    @Param('followUpId') followUpId: string,
  ) {
    const session = await this.getSession(request);
    return this.patientFollowUpsService.pauseRecurringFollowUp(
      session.center.id,
      session.permissions,
      session.user.id,
      followUpId,
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

  @Patch(':followUpId/due-date')
  async updateDueDate(
    @Req() request: Request,
    @Param('followUpId') followUpId: string,
    @Body() dto: UpdatePatientFollowUpDueDateDto,
  ) {
    const session = await this.getSession(request);

    return this.patientFollowUpsService.updateDueDate(
      session.center.id,
      session.permissions,
      followUpId,
      dto.dueDate,
    );
  }

  @Patch(':followUpId/close-early')
  async closePlanEarly(
    @Req() request: Request,
    @Param('followUpId') followUpId: string,
    @Body() dto: CloseFollowUpPlanDto,
  ) {
    const session = await this.getSession(request);

    return this.patientFollowUpsService.closePlanEarly(
      session.center.id,
      session.permissions,
      session.user.id,
      followUpId,
      dto.reason,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
