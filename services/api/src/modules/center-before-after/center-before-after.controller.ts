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
import { CenterBeforeAfterService } from './center-before-after.service';

type BeforeAfterPayload = {
  afterImageUrl?: string | null;
  beforeImageUrl?: string | null;
  category?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  descriptionHe?: string | null;
  isPublished?: boolean | null;
  sortOrder?: number | null;
  titleAr?: string | null;
  titleEn?: string | null;
  titleHe?: string | null;
};

type UploadedBeforeAfterFile = {
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

async function saveBeforeAfterImage(
  file: UploadedBeforeAfterFile | undefined,
): Promise<{ url: string }> {
  if (!file?.buffer) {
    throw new BadRequestException({
      code: 'MISSING_FILE',
      message: 'Validation failed',
      errors: { file: 'Image file is required.' },
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
      errors: { file: 'Image must be 8 MB or smaller.' },
    });
  }

  let outBuffer = file.buffer;
  let outExt = ALLOWED_MIME[mime] ?? '.bin';
  try {
    outBuffer = await sharp(file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
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
    'before-after',
  );
  try {
    await mkdir(uploadDir, { recursive: true });
    const filename = `before-after-${Date.now()}-${randomUUID()}${outExt}`;
    await writeFile(join(uploadDir, filename), outBuffer);
    return { url: `/uploads/before-after/${filename}` };
  } catch (error) {
    console.error('[tenant-before-after] image write error:', error);
    throw new BadRequestException({
      code: 'UPLOAD_WRITE_FAILED',
      message: 'Validation failed',
      errors: { file: 'Failed to save image to disk. Please try again.' },
    });
  }
}

@Controller('public/centers')
export class PublicCenterBeforeAfterController {
  constructor(private readonly service: CenterBeforeAfterService) {}

  @Get(':slug/before-after')
  list(@Param('slug') slug: string) {
    return this.service.listPublic(slug);
  }
}

@Controller('tenant/before-after')
export class TenantCenterBeforeAfterController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly service: CenterBeforeAfterService,
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
    @UploadedFile() file: UploadedBeforeAfterFile | undefined,
  ) {
    await this.getSession(request);
    return saveBeforeAfterImage(file);
  }

  @Post()
  async create(@Req() request: Request, @Body() body: BeforeAfterPayload) {
    const session = await this.getSession(request);
    return this.service.createTenant(session.center.id, body);
  }

  @Patch(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: BeforeAfterPayload,
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
