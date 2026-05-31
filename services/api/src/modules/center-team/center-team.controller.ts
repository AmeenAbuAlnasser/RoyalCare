import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import sharp from 'sharp';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { CenterAuthService } from '../auth/services/center-auth.service';
import { CenterTeamService } from './center-team.service';

type TeamPayload = {
  bioAr?: string | null;
  bioEn?: string | null;
  bioHe?: string | null;
  isPublished?: boolean | null;
  nameAr?: string | null;
  nameEn?: string | null;
  nameHe?: string | null;
  photoUrl?: string | null;
  sortOrder?: number | null;
  specialtyAr?: string | null;
  specialtyEn?: string | null;
  specialtyHe?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  titleHe?: string | null;
  yearsExperience?: number | null;
};

type UploadedPhotoFile = {
  buffer?: Buffer;
  mimetype?: string;
  size?: number;
};

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/x-png': '.png',
};
const MAX_BYTES = 8 * 1024 * 1024;
const MULTER_MAX_BYTES = 12 * 1024 * 1024;

function getCookie(request: Request, name: string): string | undefined {
  return request.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function saveTeamPhoto(
  file: UploadedPhotoFile | undefined,
): Promise<{ url: string }> {
  if (!file?.buffer) {
    throw new BadRequestException({
      code: 'MISSING_FILE',
      message: 'Validation failed',
      errors: { file: 'Photo file is required.' },
    });
  }

  const mime = file.mimetype ?? '';
  if (!ALLOWED_MIME[mime]) {
    throw new BadRequestException({
      code: 'INVALID_FILE_TYPE',
      message: 'Validation failed',
      errors: { file: 'Only PNG, JPG, and WebP images are allowed.' },
    });
  }

  if ((file.size ?? file.buffer.byteLength) > MAX_BYTES) {
    throw new BadRequestException({
      code: 'FILE_TOO_LARGE',
      message: 'Validation failed',
      errors: { file: 'Photo must be 8 MB or smaller.' },
    });
  }

  let outBuffer = file.buffer;
  let outExt = ALLOWED_MIME[mime] ?? '.bin';
  try {
    outBuffer = await sharp(file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
    outExt = '.webp';
  } catch {
    /* Keep original if sharp cannot process the uploaded image. */
  }

  const uploadDir = resolve(
    process.cwd(),
    '..',
    '..',
    'apps',
    'web',
    'public',
    'uploads',
    'team',
  );
  try {
    await mkdir(uploadDir, { recursive: true });
    const filename = `team-${Date.now()}-${randomUUID()}${outExt}`;
    await writeFile(join(uploadDir, filename), outBuffer);
    return { url: `/uploads/team/${filename}` };
  } catch (error) {
    console.error('[tenant-team] photo write error:', error);
    throw new BadRequestException({
      code: 'UPLOAD_WRITE_FAILED',
      message: 'Validation failed',
      errors: { file: 'Failed to save photo to disk. Please try again.' },
    });
  }
}

@Controller('public/centers')
export class PublicCenterTeamController {
  constructor(private readonly service: CenterTeamService) {}

  @Get(':slug/team')
  list(@Param('slug') slug: string) {
    return this.service.listPublic(slug);
  }
}

@Controller('tenant/team')
export class TenantCenterTeamController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly service: CenterTeamService,
  ) {}

  private async getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }

  @Get()
  async list(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.service.listTenant(session.center.id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_MAX_BYTES } }),
  )
  async upload(
    @Req() request: Request,
    @UploadedFile() file: UploadedPhotoFile | undefined,
  ) {
    await this.getSession(request);
    return saveTeamPhoto(file);
  }

  @Post()
  async create(@Req() request: Request, @Body() body: TeamPayload) {
    const session = await this.getSession(request);
    return this.service.createTenant(session.center.id, body);
  }

  @Patch(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: TeamPayload,
  ) {
    const session = await this.getSession(request);
    return this.service.updateTenant(session.center.id, id, body);
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string) {
    const session = await this.getSession(request);
    return this.service.deleteTenant(session.center.id, id);
  }
}
