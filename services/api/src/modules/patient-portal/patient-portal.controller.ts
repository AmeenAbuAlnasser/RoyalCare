import { Controller, Get, Param } from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';

@Controller('public/patient-portal')
export class PatientPortalController {
  constructor(private readonly patientPortalService: PatientPortalService) {}

  @Get(':centerSlug/:token')
  resolvePortal(
    @Param('centerSlug') centerSlug: string,
    @Param('token') token: string,
  ) {
    return this.patientPortalService.resolvePortal(centerSlug, token);
  }
}
