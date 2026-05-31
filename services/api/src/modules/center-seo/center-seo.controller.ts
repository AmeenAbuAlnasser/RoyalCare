import {
  BadRequestException,
  Body,
  Controller,
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
import { CenterSeoService } from './center-seo.service';

type SeoPayload = {
  seoTitleAr?: string | null;
  seoTitleEn?: string | null;
  seoTitleHe?: string | null;
  seoDescriptionAr?: string | null;
  seoDescriptionEn?: string | null;
  seoDescriptionHe?: string | null;
  keywordsAr?: string | null;
  keywordsEn?: string | null;
  keywordsHe?: string | null;
  ogTitleAr?: string | null;
  ogTitleEn?: string | null;
  ogTitleHe?: string | null;
  ogDescriptionAr?: string | null;
  ogDescriptionEn?: string | null;
  ogDescriptionHe?: string | null;
  ogImageUrl?: string | null;
};

type UploadedImageFile = {
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

async function saveOgImage(
  file: UploadedImageFile | undefined,
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
      .resize({
        width: 1200,
        height: 630,
        fit: 'cover',
        withoutEnlargement: true,
      })
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
    'seo',
  );
  try {
    await mkdir(uploadDir, { recursive: true });
    const filename = `og-${Date.now()}-${randomUUID()}${outExt}`;
    await writeFile(join(uploadDir, filename), outBuffer);
    return { url: `/uploads/seo/${filename}` };
  } catch (error) {
    console.error('[tenant-seo] og-image write error:', error);
    throw new BadRequestException({
      code: 'UPLOAD_WRITE_FAILED',
      message: 'Validation failed',
      errors: { file: 'Failed to save image to disk. Please try again.' },
    });
  }
}

@Controller('public/centers')
export class PublicCenterSeoController {
  constructor(private readonly service: CenterSeoService) {}

  @Get(':slug/seo')
  get(@Param('slug') slug: string) {
    return this.service.getPublic(slug);
  }
}

@Controller('tenant/seo')
export class TenantCenterSeoController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly service: CenterSeoService,
  ) {}

  private async getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }

  @Get()
  async get(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.service.getTenant(session.center.id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_MAX_BYTES } }),
  )
  async upload(
    @Req() request: Request,
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    await this.getSession(request);
    return saveOgImage(file);
  }

  @Patch()
  async upsert(@Req() request: Request, @Body() body: SeoPayload) {
    const session = await this.getSession(request);
    return this.service.upsertTenant(session.center.id, body);
  }
}
