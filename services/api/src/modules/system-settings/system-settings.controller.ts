import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
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
import { PermissionsService } from '../permissions/services/permissions.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  PUBLIC_SYSTEM_SETTING_KEYS,
  SystemSettingsService,
} from './system-settings.service';

const ALLOWED_KEYS = new Set([
  'whatsapp_default_country_code',
  'whatsapp_support_phone',
  ...PUBLIC_SYSTEM_SETTING_KEYS,
]);
const ALLOWED_CODES = new Set(['970', '972']);
// Branding images: accept absolute URLs or local relative paths served by Next.js.
const IMAGE_URL_KEYS = new Set([
  'public_logo_url',
  'public_favicon_url',
  'public_hero_image_url',
  'public_footer_logo_url',
]);
// Social / external links: must be absolute HTTP(S) URLs.
const SOCIAL_URL_KEYS = new Set([
  'public_facebook_url',
  'public_instagram_url',
  'public_whatsapp_url',
  'public_youtube_url',
  'public_tiktok_url',
]);
const PHONE_KEYS = new Set([
  'whatsapp_support_phone',
  'public_support_phone',
  'public_support_whatsapp',
]);
const MAX_TEXT_LENGTH = 700;
const PUBLIC_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
// Multer limit: 12 MB so the controller receives the file and can respond with a clear error.
const MULTER_MAX_BYTES = 12 * 1024 * 1024;
const PUBLIC_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
  'image/x-png': '.png',
};

// Max width per upload purpose. Sharp resizes only if the image exceeds the limit.
const UPLOAD_MAX_WIDTH: Record<string, number> = {
  logo: 600,
  favicon: 512,
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
  if (uploadType === 'favicon') {
    try {
      const png = await sharp(buffer)
        .resize({
          width: 512,
          height: 512,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      return { buffer: png, extension: '.png' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException({
        success: false,
        code: 'FAVICON_CONVERSION_FAILED',
        details: message,
        message: 'Favicon could not be converted to PNG.',
        errors: { file: 'Favicon must be a valid image file.' },
      });
    }
  }

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
    // Fallback: store original without optimization.
    return { buffer, extension: PUBLIC_IMAGE_EXTENSIONS[mime] ?? '.bin' };
  }
}

type SettingEntry = { key: string; value?: string | null };
type UploadedPublicImageFile = {
  buffer?: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
};

function normalizeValue(raw: string | null | undefined): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

function normalizeCountryCode(raw: string): string {
  return raw.replace(/^\+/, '');
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('0') ? digits.slice(1) : digits;
}

const ALLOWED_RELATIVE_PREFIXES = ['/uploads/', '/images/', '/assets/'];

function isValidHttpUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidImageUrl(value: string): boolean {
  if (!value.trim()) return true;
  if (ALLOWED_RELATIVE_PREFIXES.some((p) => value.startsWith(p))) return true;
  return isValidHttpUrl(value);
}

function isValidEmail(value: string): boolean {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateSettings(settings: SettingEntry[]): void {
  const errors: Record<string, string> = {};

  for (const { key, value: rawValue } of settings) {
    const value = normalizeValue(rawValue);

    if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Unknown setting key: ${key}`;
      continue;
    }

    if (key === 'whatsapp_default_country_code') {
      const normalized = normalizeCountryCode(value);
      if (!ALLOWED_CODES.has(normalized)) {
        errors.whatsapp_default_country_code =
          'Country code must be 970 or 972.';
      }
    }

    if (PHONE_KEYS.has(key)) {
      const normalized = normalizePhone(value);
      const maxLength = key.startsWith('public_') ? 15 : 10;
      if (
        normalized.length > 0 &&
        (normalized.length < 7 || normalized.length > maxLength)
      ) {
        errors[key] = key.startsWith('public_')
          ? 'Phone must be 7-15 digits.'
          : 'Phone must be 7-10 digits (after removing leading zero).';
      }
    }

    if (IMAGE_URL_KEYS.has(key) && !isValidImageUrl(value)) {
      errors[key] =
        'Image URL must start with http://, https://, /uploads/, /images/, or /assets/.';
    }

    if (SOCIAL_URL_KEYS.has(key) && !isValidHttpUrl(value)) {
      errors[key] = 'URL must start with http:// or https://.';
    }

    if (key === 'public_support_email' && !isValidEmail(value)) {
      errors[key] = 'Email must be valid.';
    }

    if (value.length > MAX_TEXT_LENGTH) {
      errors[key] = `Value must be ${MAX_TEXT_LENGTH} characters or fewer.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({ message: 'Validation failed', errors });
  }
}

async function requireSuperAdminUser(
  permissionsService: PermissionsService,
  userId?: string | string[],
) {
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;

  if (!normalizedUserId) {
    throw new ForbiddenException({
      message: 'Permission denied',
      errors: { role: 'SUPER_ADMIN role is required.' },
    });
  }

  const permissionContext =
    await permissionsService.getUserPermissions(normalizedUserId);
  const roles = permissionContext.roles as Array<{ key: string }>;
  const isSuperAdmin = roles.some((role) => role.key === 'super_admin');

  if (!permissionContext.user || !isSuperAdmin) {
    throw new ForbiddenException({
      message: 'Permission denied',
      errors: { role: 'SUPER_ADMIN role is required.' },
    });
  }

  return permissionContext.user;
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

@Controller('admin/settings')
export class SystemSettingsController {
  constructor(
    private readonly settingsService: SystemSettingsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  private async requireSuperAdmin(userId?: string | string[]) {
    return requireSuperAdminUser(this.permissionsService, userId);
  }

  @Get()
  async getAll(
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await this.requireSuperAdmin(superAdminUserId);
    return { settings: await this.settingsService.getAll() };
  }

  @Patch()
  async update(
    @Body() dto: UpdateSettingsDto,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
  ) {
    await this.requireSuperAdmin(superAdminUserId);

    if (!Array.isArray(dto?.settings) || dto.settings.length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { settings: 'settings array is required.' },
      });
    }

    validateSettings(dto.settings);

    const normalized = dto.settings.map(({ key, value }) => {
      const cleanValue = normalizeValue(value);
      if (key === 'whatsapp_default_country_code') {
        return { key, value: normalizeCountryCode(cleanValue) };
      }
      if (PHONE_KEYS.has(key)) {
        return { key, value: normalizePhone(cleanValue) };
      }
      return { key, value: cleanValue };
    });

    await Promise.all(
      normalized.map(({ key, value }) =>
        this.settingsService.setSetting(key, value),
      ),
    );
    return { success: true };
  }
}

@Controller('admin/uploads')
export class AdminUploadsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post('public-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_MAX_BYTES } }),
  )
  async uploadPublicImage(
    @UploadedFile() file: UploadedPublicImageFile | undefined,
    @Headers('x-royalcare-super-admin-user-id') superAdminUserId?: string,
    @Req() req?: Request,
  ) {
    console.log('UPLOAD HIT');
    console.log('[upload:public-image] headers:', {
      origin: req?.headers?.['origin'],
      contentType: req?.headers?.['content-type'],
      superAdminUserId: req?.headers?.['x-royalcare-super-admin-user-id'],
    });
    console.log('[upload:public-image] received file:', {
      originalname: file?.originalname ?? null,
      mimetype: file?.mimetype ?? null,
      size: file?.size ?? null,
      hasBuffer: !!file?.buffer,
    });

    await requireSuperAdminUser(this.permissionsService, superAdminUserId);

    if (!file?.buffer) {
      throw new BadRequestException({
        success: false,
        code: 'NO_FILE',
        details: 'No file buffer received by the server.',
        message: 'Validation failed',
        errors: { file: 'Image file is required.' },
      });
    }

    const mime = file.mimetype ?? '';
    const extension = PUBLIC_IMAGE_EXTENSIONS[mime];
    if (!extension) {
      console.warn('[upload:public-image] rejected mime type:', mime);
      throw new BadRequestException({
        success: false,
        code: 'INVALID_FILE_TYPE',
        details: `Received: "${mime}". Allowed: image/png, image/jpeg, image/webp, image/svg+xml.`,
        message: 'Validation failed',
        errors: { file: 'Only PNG, JPG, WebP, and SVG images are allowed.' },
      });
    }

    const byteSize = file.size ?? file.buffer.byteLength;
    if (byteSize > PUBLIC_IMAGE_MAX_BYTES) {
      throw new BadRequestException({
        success: false,
        code: 'FILE_TOO_LARGE',
        details: `${(byteSize / 1024 / 1024).toFixed(2)} MB received, max is 8 MB.`,
        message: 'Validation failed',
        errors: { file: 'Image must be 8 MB or smaller.' },
      });
    }

    const requestBody: unknown = req?.body;
    const uploadType =
      typeof requestBody === 'object' &&
      requestBody !== null &&
      'type' in requestBody &&
      typeof (requestBody as { type?: unknown }).type === 'string'
        ? (requestBody as { type: string }).type
        : undefined;
    console.log('[upload:public-image] upload type:', uploadType ?? '(none)');

    const { buffer: outBuffer, extension: outExt } = await optimizeImage(
      file.buffer,
      mime,
      uploadType,
    );
    console.log('[upload:public-image] optimized:', {
      originalBytes: byteSize,
      outputBytes: outBuffer.byteLength,
      extension: outExt,
    });

    const uploadDir = getPublicBrandingUploadDir();
    console.log('[upload:public-image] upload dir:', uploadDir);

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[upload:public-image] mkdir failed:', msg);
      throw new BadRequestException({
        success: false,
        code: 'UPLOAD_DIR_FAILED',
        details: msg,
        message: 'Upload directory could not be created.',
        errors: { file: 'Server storage error.' },
      });
    }

    const filename =
      uploadType === 'favicon'
        ? `favicon-${Date.now()}-${randomUUID()}.png`
        : `public-branding-${Date.now()}-${randomUUID()}${outExt}`;
    const dest = join(uploadDir, filename);
    console.log('[upload:public-image] writing to:', dest);

    try {
      await writeFile(dest, outBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[upload:public-image] writeFile failed:', msg);
      throw new BadRequestException({
        success: false,
        code: 'UPLOAD_WRITE_FAILED',
        details: msg,
        message: 'File could not be saved.',
        errors: { file: 'Server storage error.' },
      });
    }

    console.log(
      '[upload:public-image] success:',
      `/uploads/branding/${filename}`,
    );
    return { url: `/uploads/branding/${filename}` };
  }
}

@Controller('public/settings')
export class PublicSystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  async getPublicSettings() {
    return { settings: await this.settingsService.getPublicSettings() };
  }
}
