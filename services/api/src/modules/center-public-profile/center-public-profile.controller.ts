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
  UseGuards,
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
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import {
  CenterPublicProfileService,
  type ReorderCenterBranchesDto,
  type UpdatePublicProfileDto,
  type UpsertCenterBranchDto,
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
  serviceCover: 1200,
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
@UseGuards(PermissionGuard)
export class AdminCenterPublicProfileController {
  constructor(
    private readonly profileService: CenterPublicProfileService,
  ) {}

  @Get()
  @RequirePermissions('view:centers')
  async get(
    @Param('centerId') centerId: string,
  ) {
    return this.profileService.getProfile(centerId);
  }

  @Patch()
  @RequirePermissions('edit:centers')
  async update(
    @Param('centerId') centerId: string,
    @Body() dto: UpdatePublicProfileDto,
  ) {
    return this.profileService.updateProfile(centerId, dto);
  }

  @Post('upload-image')
  @RequirePermissions('edit:centers')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_MAX_BYTES } }),
  )
  async uploadImage(
    @Param('centerId') _centerId: string,
    @UploadedFile() file: UploadedPublicImageFile | undefined,
    @Req() req: Request,
  ) {
    const uploadType = getUploadType(req);
    return handleImageUpload(file, uploadType);
  }

  @Get('branches')
  @RequirePermissions('view:centers')
  async listBranches(@Param('centerId') centerId: string) {
    return { data: await this.profileService.listBranches(centerId) };
  }

  @Post('branches')
  @RequirePermissions('edit:centers')
  async createBranch(
    @Param('centerId') centerId: string,
    @Body() dto: UpsertCenterBranchDto,
  ) {
    return this.profileService.createBranch(centerId, dto);
  }

  @Patch('branches/reorder')
  @RequirePermissions('edit:centers')
  async reorderBranches(
    @Param('centerId') centerId: string,
    @Body() dto: ReorderCenterBranchesDto,
  ) {
    return { data: await this.profileService.reorderBranches(centerId, dto) };
  }

  @Patch('branches/:branchId')
  @RequirePermissions('edit:centers')
  async updateBranch(
    @Param('centerId') centerId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpsertCenterBranchDto,
  ) {
    return this.profileService.updateBranch(centerId, branchId, dto);
  }

  @Delete('branches/:branchId')
  @RequirePermissions('edit:centers')
  async deleteBranch(
    @Param('centerId') centerId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.profileService.deactivateBranch(centerId, branchId);
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

  @Get('branches')
  async listBranches(@Req() request: Request) {
    const session = await this.getSession(request);
    this.profileService.requireSettingsPermission(session.permissions);
    return { data: await this.profileService.listBranches(session.center.id) };
  }

  @Post('branches')
  async createBranch(
    @Req() request: Request,
    @Body() dto: UpsertCenterBranchDto,
  ) {
    const session = await this.getSession(request);
    this.profileService.requireSettingsPermission(session.permissions);
    return this.profileService.createBranch(session.center.id, dto);
  }

  @Patch('branches/reorder')
  async reorderBranches(
    @Req() request: Request,
    @Body() dto: ReorderCenterBranchesDto,
  ) {
    const session = await this.getSession(request);
    this.profileService.requireSettingsPermission(session.permissions);
    return {
      data: await this.profileService.reorderBranches(session.center.id, dto),
    };
  }

  @Patch('branches/:branchId')
  async updateBranch(
    @Req() request: Request,
    @Param('branchId') branchId: string,
    @Body() dto: UpsertCenterBranchDto,
  ) {
    const session = await this.getSession(request);
    this.profileService.requireSettingsPermission(session.permissions);
    return this.profileService.updateBranch(session.center.id, branchId, dto);
  }

  @Delete('branches/:branchId')
  async deleteBranch(
    @Req() request: Request,
    @Param('branchId') branchId: string,
  ) {
    const session = await this.getSession(request);
    this.profileService.requireSettingsPermission(session.permissions);
    return this.profileService.deactivateBranch(session.center.id, branchId);
  }
}
