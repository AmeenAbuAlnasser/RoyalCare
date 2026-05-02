import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CenterAuthService } from '../../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../../auth/services/center-session.service';
import { AddCreditDto } from '../dto/add-credit.dto';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientStatusDto } from '../dto/update-patient-status.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { PatientCreditService } from '../services/patient-credit.service';
import { PatientsService } from '../services/patients.service';

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

@Controller('patients')
export class PatientsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly patientsService: PatientsService,
    private readonly patientCreditService: PatientCreditService,
  ) {}

  @Get()
  async list(@Req() request: Request, @Query('search') search?: string) {
    const session = await this.getSession(request);

    return this.patientsService.list(session.center.id, { search });
  }

  @Post()
  async create(@Req() request: Request, @Body() dto: CreatePatientDto) {
    const session = await this.getSession(request);

    return this.patientsService.create(session.center.id, dto);
  }

  @Get(':patientId')
  async getById(
    @Req() request: Request,
    @Param('patientId') patientId: string,
  ) {
    const session = await this.getSession(request);

    return this.patientsService.getById(session.center.id, patientId);
  }

  @Patch(':patientId')
  async update(
    @Req() request: Request,
    @Param('patientId') patientId: string,
    @Body() dto: UpdatePatientDto,
  ) {
    const session = await this.getSession(request);

    return this.patientsService.update(session.center.id, patientId, dto);
  }

  @Patch(':patientId/status')
  async updateStatus(
    @Req() request: Request,
    @Param('patientId') patientId: string,
    @Body() dto: UpdatePatientStatusDto,
  ) {
    const session = await this.getSession(request);

    return this.patientsService.updateStatus(session.center.id, patientId, dto);
  }

  @Post(':patientId/credit')
  async addCredit(
    @Req() request: Request,
    @Param('patientId') patientId: string,
    @Body() dto: AddCreditDto,
  ) {
    const session = await this.getSession(request);

    return this.patientCreditService.addManualCredit(
      session.center.id,
      session.role.key,
      patientId,
      session.user.id,
      dto,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
