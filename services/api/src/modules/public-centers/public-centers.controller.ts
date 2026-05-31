import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { PublicCentersService } from './public-centers.service';

function getHeaderValue(request: Request, name: string) {
  const value = request.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

function getClientIp(request: Request) {
  const forwardedFor = getHeaderValue(request, 'x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim();
  const realIp = getHeaderValue(request, 'x-real-ip');
  return realIp ?? request.ip;
}

@Controller('public/centers')
export class PublicCentersController {
  constructor(private readonly publicCentersService: PublicCentersService) {}

  @Get()
  list() {
    return this.publicCentersService.listPublicCenters();
  }

  @Get(':slug/availability')
  getAvailability(
    @Param('slug') slug: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('providerId') providerId?: string,
  ) {
    return this.publicCentersService.getAvailability(
      slug,
      serviceId,
      date,
      providerId,
    );
  }

  @Get(':slug/marketing-settings')
  getMarketingSettings(@Param('slug') slug: string) {
    return this.publicCentersService.getMarketingSettings(slug);
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.publicCentersService.getPublicCenter(slug);
  }

  @Post(':slug/booking-requests')
  createBookingRequest(
    @Param('slug') slug: string,
    @Body() dto: CreateBookingRequestDto,
    @Req() request: Request,
  ) {
    return this.publicCentersService.createBookingRequest(slug, dto, {
      eventSourceUrl:
        getHeaderValue(request, 'referer') ?? getHeaderValue(request, 'origin'),
      ipAddress: getClientIp(request),
      userAgent: getHeaderValue(request, 'user-agent'),
    });
  }
}
