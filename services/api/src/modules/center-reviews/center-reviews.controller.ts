import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { CenterAuthService } from '../auth/services/center-auth.service';
import { CenterReviewsService } from './center-reviews.service';

type ReviewPayload = {
  commentAr?: string | null;
  commentEn?: string | null;
  commentHe?: string | null;
  customerName?: string | null;
  isPublished?: boolean | null;
  rating?: number | null;
  sortOrder?: number | null;
};

function getCookie(request: Request, name: string): string | undefined {
  return request.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('public/centers')
export class PublicCenterReviewsController {
  constructor(private readonly reviewsService: CenterReviewsService) {}

  @Get(':slug/reviews')
  list(@Param('slug') slug: string) {
    return this.reviewsService.listPublicReviews(slug);
  }
}

@Controller('tenant/reviews')
export class TenantCenterReviewsController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly reviewsService: CenterReviewsService,
  ) {}

  private async getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }

  @Get()
  async list(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.reviewsService.listTenantReviews(session.center.id);
  }

  @Post()
  async create(@Req() request: Request, @Body() body: ReviewPayload) {
    const session = await this.getSession(request);
    return this.reviewsService.createTenantReview(session.center.id, body);
  }

  @Patch(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ReviewPayload,
  ) {
    const session = await this.getSession(request);
    return this.reviewsService.updateTenantReview(session.center.id, id, body);
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string) {
    const session = await this.getSession(request);
    return this.reviewsService.deleteTenantReview(session.center.id, id);
  }
}
