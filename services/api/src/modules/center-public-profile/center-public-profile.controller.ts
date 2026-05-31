import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import sharp from 'sharp';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { CenterAuthService } from '../auth/services/center-auth.service';
import { PermissionsService } from '../permissions/services/permissions.service';
import {
  CenterPublicProfileService,
  type UpdatePublicProfileDto,
} from './center-public-profile.service';

// ── shared image upload helpers ────────────────────────────────────────────

const PUBLIC_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
  'image/x-png': '.png',
};

const PUBLIC_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const MULTER_MAX_BYTES = 12 * 1024 * 1024;

const UPLOAD_MAX_WIDTH: Record<string, number> = {
  logo: 600,
  cover: 1920,
  card: 1200,
  hero: 1920,
  service: 900,
};
const DEFAULT_MAX_WIDTH = 1200;
const WEBP_QUALITY = 82;

async function optimizeImage(
  buffer: Buffer,
  mime: string,
  uploadType?: string | null,
): Promise<{ buffer: Buffer; extension: string }> {
  if (mime === 'image/svg+xml') {
    return { buffer, extension: '.svg' };
  }
  const maxWidth = UPLOAD_MAX_WIDTH[uploadType ?? ''] ?? DEFAULT_MAX_WIDTH;
  try {
    const optimized = await sharp(buffer)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { buffer: optimized, extension: '.webp' };
  } catch {
    return { buffer, extension: PUBLIC_IMAGE_EXTENSIONS[mime] ?? '.bin' };
  }
}

function getPublicBrandingUploadDir(): string {
  return resolve(
    process.cwd(),
    '..',
    '..',
    'apps',
    'web',
    'public',
    'uploads',
    'branding',
  );
}

type UploadedPublicImageFile = {
  buffer?: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
};

async function handleImageUpload(
  file: UploadedPublicImageFile | undefined,
  uploadType: string | undefined,
): Promise<{ url: string }> {
  if (!file?.buffer) {
    throw new BadRequestException({
      success: false,
      code: 'NO_FILE',
      message: 'Validation failed',
      errors: { file: 'Image file is required.' },
    });
  }

  const mime = file.mimetype ?? '';
  const extension = PUBLIC_IMAGE_EXTENSIONS[mime];
  if (!extension) {
    throw new BadRequestException({
      success: false,
      code: 'INVALID_FILE_TYPE',
      message: 'Validation failed',
      errors: { file: 'Only PNG, JPG, WebP, and SVG images are allowed.' },
    });
  }

  const byteSize = file.size ?? file.buffer.byteLength;
  if (byteSize > PUBLIC_IMAGE_MAX_BYTES) {
    throw new BadRequestException({
      success: false,
      code: 'FILE_TOO_LARGE',
      message: 'Validation failed',
      errors: { file: 'Image must be 8 MB or smaller.' },
    });
  }

  const { buffer: outBuffer, extension: outExt } = await optimizeImage(
    file.buffer,
    mime,
    uploadType,
  );

  const uploadDir = getPublicBrandingUploadDir();

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new BadRequestException({
      success: false,
      code: 'UPLOAD_DIR_FAILED',
      details: msg,
      message: 'Upload directory could not be created.',
      errors: { file: 'Server storage error.' },
    });
  }

  const filename = `center-branding-${Date.now()}-${randomUUID()}${outExt}`;
  const dest = join(uploadDir, filename);

  try {
    await writeFile(dest, outBuffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new BadRequestException({
      success: false,
      code: 'UPLOAD_WRITE_FAILED',
      details: msg,
      message: 'File could not be saved.',
      errors: { file: 'Server storage error.' },
    });
  }

  return { url: `/uploads/branding/${filename}` };
}

// ── cookie helper ──────────────────────────────────────────────────────────

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function getUploadType(request: Request): string | undefined {
  const body = request.body as Record<string, unknown> | undefined;
  return typeof body?.type === 'string' ? body.type : undefined;
}

// ── Super Admin controller ─────────────────────────────────────────────────

@Controller('admin/centers/:centerId/public-profile')
export class AdminCenterPublicProfileController {
  constructor(
    private readonly profileService: CenterPublicProfileService,
    private readonly permissionsService: PermissionsService,
  ) {}

  private async requireSuperAdmin(userId?: string | string[]) {
    const id = Array.isArray(userId) ? userId[0] : userId;
    if (!id) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { role: 'SUPER_ADMIN role is required.' },
      });
    }
    const ctx = await this.permissionsService.getUserPermissions(id);
    const isSuperAdmin = (ctx.roles as Array<{ key: string }>).some(
      (r) => r.key === 'super_admin',
    );
    if (!ctx.user || !isSuperAdmin) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { role: 'SUPER_ADMIN role is required.' },
      });
    }
    return ctx.user;
  }

  @Get()
  async get(
    @Param('centerId') centerId: string,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await this.requireSuperAdmin(superAdminUserId);
    return this.profileService.getProfile(centerId);
  }

  @Patch()
  async update(
    @Param('centerId') centerId: string,
    @Body() dto: UpdatePublicProfileDto,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await this.requireSuperAdmin(superAdminUserId);
    return this.profileService.updateProfile(centerId, dto);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_MAX_BYTES } }),
  )
  async uploadImage(
    @Param('centerId') _centerId: string,
    @UploadedFile() file: UploadedPublicImageFile | undefined,
    @Req() req: Request,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await this.requireSuperAdmin(superAdminUserId);
    const uploadType = getUploadType(req);
    return handleImageUpload(file, uploadType);
  }
}

// ── Tenant controller ──────────────────────────────────────────────────────

@Controller('tenant/public-profile')
export class TenantCenterPublicProfileController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly profileService: CenterPublicProfileService,
  ) {}

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }

  @Get()
  async get(@Req() request: Request) {
    const session = await this.getSession(request);
    this.profileService.requireSettingsPermission(session.permissions);
    return this.profileService.getProfile(session.center.id);
  }

  @Patch()
  async update(@Req() request: Request, @Body() dto: UpdatePublicProfileDto) {
    const session = await this.getSession(request);
    this.profileService.requireSettingsPermission(session.permissions);
    return this.profileService.updateProfile(session.center.id, dto);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_MAX_BYTES } }),
  )
  async uploadImage(
    @Req() request: Request,
    @UploadedFile() file: UploadedPublicImageFile | undefined,
  ) {
    const session = await this.getSession(request);
    this.profileService.requireSettingsPermission(session.permissions);
    const uploadType = getUploadType(request);
    void session; // centerId scoped via session — upload is center-agnostic path-wise
    return handleImageUpload(file, uploadType);
  }
}
