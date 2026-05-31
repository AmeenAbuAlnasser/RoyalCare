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
import { CenterGalleryService } from './center-gallery.service';

// ── Upload helpers ─────────────────────────────────────────────────────────

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/x-png': '.png',
};
const MAX_BYTES = 8 * 1024 * 1024;
export const GALLERY_MULTER_MAX = 12 * 1024 * 1024;

type UploadedFile = {
  buffer?: Buffer;
  mimetype?: string;
  size?: number;
};

async function saveGalleryImage(
  file: UploadedFile | undefined,
): Promise<{ url: string }> {
  if (!file?.buffer) {
    throw new BadRequestException({
      success: false,
      code: 'MISSING_FILE',
      message: 'Validation failed',
      errors: { file: 'Image file is required.' },
    });
  }

  const mime = file.mimetype ?? '';
  if (!ALLOWED_MIME[mime]) {
    throw new BadRequestException({
      success: false,
      code: 'INVALID_FILE_TYPE',
      message: 'Validation failed',
      errors: { file: 'Only PNG, JPG, and WebP images are allowed.' },
    });
  }

  if ((file.size ?? file.buffer.byteLength) > MAX_BYTES) {
    throw new BadRequestException({
      success: false,
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
      .webp({ quality: 82 })
      .toBuffer();
    outExt = '.webp';
  } catch {
    /* use original */
  }

  const uploadDir = resolve(
    process.cwd(),
    '..',
    '..',
    'apps',
    'web',
    'public',
    'uploads',
    'gallery',
  );
  try {
    await mkdir(uploadDir, { recursive: true });
    const filename = `gallery-${Date.now()}-${randomUUID()}${outExt}`;
    await writeFile(join(uploadDir, filename), outBuffer);
    return { url: `/uploads/gallery/${filename}` };
  } catch (error) {
    console.error('[tenant-gallery] saveGalleryImage write error:', error);
    throw new BadRequestException({
      success: false,
      code: 'UPLOAD_WRITE_FAILED',
      message: 'Validation failed',
      errors: { file: 'Failed to save image to disk. Please try again.' },
    });
  }
}

function getCookie(request: Request, name: string): string | undefined {
  return request.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

// ── Public Controller ──────────────────────────────────────────────────────

@Controller('public/centers')
export class PublicCenterGalleryController {
  constructor(private readonly galleryService: CenterGalleryService) {}

  @Get(':slug/gallery')
  async getGallery(@Param('slug') slug: string) {
    return this.galleryService.getPublicGallery(slug);
  }
}

// ── Tenant Controller ──────────────────────────────────────────────────────

@Controller('tenant/center-gallery')
export class TenantCenterGalleryController {
  constructor(
    private readonly galleryService: CenterGalleryService,
    private readonly centerAuthService: CenterAuthService,
  ) {}

  private async getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }

  @Get()
  async list(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.galleryService.getTenantGallery(session.center.id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: GALLERY_MULTER_MAX } }),
  )
  async upload(
    @Req() request: Request,
    @UploadedFile() file: UploadedFile | undefined,
  ) {
    const session = await this.getSession(request);
    const { url } = await saveGalleryImage(file);
    return this.galleryService.addGalleryImage(session.center.id, url);
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string) {
    const session = await this.getSession(request);
    return this.galleryService.deleteGalleryImage(session.center.id, id);
  }

  @Patch('reorder')
  async reorder(@Req() request: Request, @Body() body: { ids?: string[] }) {
    const session = await this.getSession(request);
    return this.galleryService.reorderGalleryImages(
      session.center.id,
      body.ids ?? [],
    );
  }
}
