import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { hasTenantPermission } from '../../common/permissions/tenant-permissions';

export interface UpdatePublicProfileDto {
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  cardImageUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  publicDescriptionAr?: string | null;
  publicDescriptionEn?: string | null;
  publicDescriptionHe?: string | null;
  fullDescriptionAr?: string | null;
  fullDescriptionEn?: string | null;
  fullDescriptionHe?: string | null;
  sloganAr?: string | null;
  sloganEn?: string | null;
  sloganHe?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;
  cityHe?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  addressHe?: string | null;
  whatsappPhone?: string | null;
  phone?: string | null;
  email?: string | null;
  googleMapsUrl?: string | null;
  workingHoursAr?: string | null;
  workingHoursEn?: string | null;
  workingHoursHe?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteSectionOrder?: unknown;
  websiteSectionVisibility?: unknown;
}

type WebsiteSectionOrderValue = string[];
type WebsiteSectionVisibilityValue = Record<string, boolean>;
type WebsiteBuilderValue =
  | WebsiteSectionOrderValue
  | WebsiteSectionVisibilityValue;
type CleanedProfileData = Record<
  string,
  string | number | WebsiteBuilderValue | null
>;

const ALLOWED_RELATIVE_PREFIXES = ['/uploads/', '/images/', '/assets/'];

const brandingSelect = {
  addressAr: true,
  addressEn: true,
  addressHe: true,
  cardImageUrl: true,
  cityAr: true,
  cityEn: true,
  cityHe: true,
  coverImageUrl: true,
  email: true,
  facebookUrl: true,
  fullDescriptionAr: true,
  fullDescriptionEn: true,
  fullDescriptionHe: true,
  googleMapsUrl: true,
  instagramUrl: true,
  latitude: true,
  logoUrl: true,
  longitude: true,
  phone: true,
  primaryColor: true,
  publicDescriptionAr: true,
  publicDescriptionEn: true,
  publicDescriptionHe: true,
  secondaryColor: true,
  sloganAr: true,
  sloganEn: true,
  sloganHe: true,
  tiktokUrl: true,
  whatsappPhone: true,
  workingHoursAr: true,
  workingHoursEn: true,
  workingHoursHe: true,
  websiteSectionOrder: true,
  websiteSectionVisibility: true,
} as const;

const baseBrandingSelect = {
  addressAr: true,
  addressEn: true,
  addressHe: true,
  cardImageUrl: true,
  cityAr: true,
  cityEn: true,
  cityHe: true,
  coverImageUrl: true,
  logoUrl: true,
  primaryColor: true,
  publicDescriptionAr: true,
  publicDescriptionEn: true,
  publicDescriptionHe: true,
  secondaryColor: true,
  whatsappPhone: true,
} as const;

const migrationOptionalKeys = [
  'email',
  'facebookUrl',
  'fullDescriptionAr',
  'fullDescriptionEn',
  'fullDescriptionHe',
  'googleMapsUrl',
  'instagramUrl',
  'latitude',
  'longitude',
  'phone',
  'sloganAr',
  'sloganEn',
  'sloganHe',
  'tiktokUrl',
  'workingHoursAr',
  'workingHoursEn',
  'workingHoursHe',
  'websiteSectionOrder',
  'websiteSectionVisibility',
] as const;

function isValidImageUrl(value: string): boolean {
  if (!value.trim()) return true;
  if (ALLOWED_RELATIVE_PREFIXES.some((p) => value.startsWith(p))) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidPublicUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidColor(value: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

function isWebsiteSectionOrder(
  value: unknown,
): value is WebsiteSectionOrderValue {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isWebsiteSectionVisibility(
  value: unknown,
): value is WebsiteSectionVisibilityValue {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'boolean')
  );
}

function normalizeWebsiteBuilderValue(
  key: string,
  value: unknown,
): WebsiteBuilderValue | null {
  if (value == null) return null;
  if (key === 'websiteSectionOrder' && isWebsiteSectionOrder(value)) {
    return value;
  }
  if (key === 'websiteSectionVisibility' && isWebsiteSectionVisibility(value)) {
    return value;
  }
  throw new BadRequestException({
    message: 'Validation failed',
    errors: {
      [key]: 'Website section settings must be valid builder data.',
    },
  });
}

function validateProfile(data: UpdatePublicProfileDto): void {
  const errors: Record<string, string> = {};

  for (const key of ['logoUrl', 'coverImageUrl', 'cardImageUrl'] as const) {
    const val = data[key];
    if (val && !isValidImageUrl(val)) {
      errors[key] =
        'Image URL must start with /uploads/, /images/, /assets/, http://, or https://.';
    }
  }

  const textFields = [
    { key: 'publicDescriptionAr', max: 800 },
    { key: 'publicDescriptionEn', max: 800 },
    { key: 'publicDescriptionHe', max: 800 },
    { key: 'fullDescriptionAr', max: 5000 },
    { key: 'fullDescriptionEn', max: 5000 },
    { key: 'fullDescriptionHe', max: 5000 },
    { key: 'sloganAr', max: 220 },
    { key: 'sloganEn', max: 220 },
    { key: 'sloganHe', max: 220 },
    { key: 'cityAr', max: 120 },
    { key: 'cityEn', max: 120 },
    { key: 'cityHe', max: 120 },
    { key: 'addressAr', max: 300 },
    { key: 'addressEn', max: 300 },
    { key: 'addressHe', max: 300 },
    { key: 'workingHoursAr', max: 800 },
    { key: 'workingHoursEn', max: 800 },
    { key: 'workingHoursHe', max: 800 },
  ] as const;

  for (const { key, max } of textFields) {
    const val = data[key];
    if (val && val.length > max) {
      errors[key] = `Must be ${max} characters or fewer.`;
    }
  }

  for (const key of ['whatsappPhone', 'phone'] as const) {
    const val = data[key];
    if (val) {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 20) {
        errors[key] = 'Phone must be 7-20 digits.';
      }
    }
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Email must be valid.';
  }

  for (const key of [
    'googleMapsUrl',
    'facebookUrl',
    'instagramUrl',
    'tiktokUrl',
  ] as const) {
    const val = data[key];
    if (val && !isValidPublicUrl(val)) {
      errors[key] = 'URL must start with http:// or https://.';
    }
  }

  for (const key of ['primaryColor', 'secondaryColor'] as const) {
    const val = data[key];
    if (val && !isValidColor(val)) {
      errors[key] = 'Color must be a valid hex value such as #0B2D5C.';
    }
  }

  if (data.latitude != null) {
    const lat = Number(data.latitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90.';
    }
  }
  if (data.longitude != null) {
    const lon = Number(data.longitude);
    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      errors.longitude = 'Longitude must be between -180 and 180.';
    }
  }

  if (
    data.websiteSectionOrder != null &&
    !isWebsiteSectionOrder(data.websiteSectionOrder)
  ) {
    errors.websiteSectionOrder =
      'Website section order must be a list of section keys.';
  }

  if (
    data.websiteSectionVisibility != null &&
    !isWebsiteSectionVisibility(data.websiteSectionVisibility)
  ) {
    errors.websiteSectionVisibility =
      'Website section visibility must be a map of section keys to true or false.';
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({ message: 'Validation failed', errors });
  }
}

@Injectable()
export class CenterPublicProfileService {
  constructor(private readonly prisma: PrismaService) {}

  requireSettingsPermission(permissions: string[]) {
    if (!hasTenantPermission(permissions, 'settings:view')) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { permission: 'settings:view is required.' },
      });
    }
  }

  async getProfile(centerId: string) {
    try {
      const db = await this.prisma.getClient();
      const center = await db.center.findUnique({
        where: { id: centerId },
        select: { id: true },
      });
      if (!center) {
        return { centerId, branding: null };
      }

      try {
        const branding = await db.brandingSettings.findUnique({
          where: { centerId },
          select: brandingSelect,
        });
        return { centerId, branding: branding ?? null };
      } catch (brandingError) {
        console.error(
          '[tenant-public-profile] full branding query failed - retrying with base columns (migration may be pending):',
          brandingError,
        );

        const branding = await db.brandingSettings.findUnique({
          where: { centerId },
          select: baseBrandingSelect,
        });
        return {
          centerId,
          branding: branding
            ? { ...branding, latitude: null, longitude: null }
            : null,
        };
      }
    } catch (error) {
      console.error('[tenant-public-profile] getProfile error:', error);
      return { centerId, branding: null };
    }
  }

  async updateProfile(centerId: string, data: UpdatePublicProfileDto) {
    const db = await this.prisma.getClient();

    validateProfile(data);

    const cleaned: CleanedProfileData = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'latitude' || key === 'longitude') {
        cleaned[key] = value != null ? Number(value) : null;
      } else if (
        key === 'websiteSectionOrder' ||
        key === 'websiteSectionVisibility'
      ) {
        cleaned[key] = normalizeWebsiteBuilderValue(key, value);
      } else {
        cleaned[key] = typeof value === 'string' ? value.trim() || null : null;
      }
    }

    try {
      const branding = await db.brandingSettings.upsert({
        where: { centerId },
        create: { centerId, enabledLanguages: ['EN'], ...cleaned },
        update: cleaned,
        select: brandingSelect,
      });
      return { centerId, branding };
    } catch (upsertError) {
      console.error(
        '[tenant-public-profile] full branding upsert failed - retrying with base columns (migration may be pending):',
        upsertError,
      );

      const cleanedBase = { ...cleaned };
      for (const key of migrationOptionalKeys) {
        delete cleanedBase[key];
      }
      const branding = await db.brandingSettings.upsert({
        where: { centerId },
        create: { centerId, enabledLanguages: ['EN'], ...cleanedBase },
        update: cleanedBase,
        select: baseBrandingSelect,
      });
      return {
        centerId,
        branding: {
          ...branding,
          latitude: null,
          longitude: null,
        },
      };
    }
  }
}
