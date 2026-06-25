import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { hasTenantPermission } from '../../common/permissions/tenant-permissions';
import { startOfDay } from '../../common/subscriptions/subscription-lifecycle';

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
  publicBookingMode?: 'SIMPLE_REQUEST' | 'DIRECT_BOOKING' | null;
}

const GLOBAL_WHATSAPP_SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
] as const;

export interface UpsertCenterBranchDto {
  name?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;
  cityHe?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  addressHe?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  mapsUrl?: string | null;
  workingHoursTextAr?: string | null;
  workingHoursTextEn?: string | null;
  workingHoursTextHe?: string | null;
  isMain?: boolean | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
}

export interface ReorderCenterBranchesDto {
  branches?: Array<{ id?: string | null; sortOrder?: number | null }>;
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
  publicBookingMode: true,
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

const branchSelect = {
  addressAr: true,
  addressEn: true,
  addressHe: true,
  centerId: true,
  cityAr: true,
  cityEn: true,
  cityHe: true,
  createdAt: true,
  id: true,
  isActive: true,
  isMain: true,
  mapsUrl: true,
  name: true,
  phone: true,
  sortOrder: true,
  updatedAt: true,
  whatsapp: true,
  workingHoursTextAr: true,
  workingHoursTextEn: true,
  workingHoursTextHe: true,
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
  'publicBookingMode',
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

  if (
    data.publicBookingMode != null &&
    data.publicBookingMode !== 'SIMPLE_REQUEST' &&
    data.publicBookingMode !== 'DIRECT_BOOKING'
  ) {
    errors.publicBookingMode =
      'Public booking mode must be SIMPLE_REQUEST or DIRECT_BOOKING.';
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({ message: 'Validation failed', errors });
  }
}

function cleanNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() || null : null;
}

function firstNonBlank(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = cleanNullableString(value);
    if (trimmed) return trimmed;
  }
  return null;
}

function validateBranch(data: UpsertCenterBranchDto, isCreate: boolean): void {
  const errors: Record<string, string> = {};
  const name = cleanNullableString(data.name);
  if (isCreate && !name) {
    errors.name = 'Branch name is required.';
  }
  if (name && name.length > 160) {
    errors.name = 'Branch name must be 160 characters or fewer.';
  }

  for (const key of ['cityAr', 'cityEn', 'cityHe'] as const) {
    const val = cleanNullableString(data[key]);
    if (val && val.length > 160) {
      errors[key] = 'City must be 160 characters or fewer.';
    }
  }

  for (const key of ['addressAr', 'addressEn', 'addressHe'] as const) {
    const val = cleanNullableString(data[key]);
    if (val && val.length > 300) {
      errors[key] = 'Address must be 300 characters or fewer.';
    }
  }

  for (const key of [
    'workingHoursTextAr',
    'workingHoursTextEn',
    'workingHoursTextHe',
  ] as const) {
    const val = cleanNullableString(data[key]);
    if (val && val.length > 800) {
      errors[key] = 'Working hours text must be 800 characters or fewer.';
    }
  }

  for (const key of ['phone', 'whatsapp'] as const) {
    const val = cleanNullableString(data[key]);
    if (val) {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 20) {
        errors[key] = 'Phone must be 7-20 digits.';
      }
    }
  }

  const mapsUrl = cleanNullableString(data.mapsUrl);
  if (mapsUrl && !isValidPublicUrl(mapsUrl)) {
    errors.mapsUrl = 'URL must start with http:// or https://.';
  }

  if (data.sortOrder != null && !Number.isInteger(Number(data.sortOrder))) {
    errors.sortOrder = 'Sort order must be a whole number.';
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({ message: 'Validation failed', errors });
  }
}

function branchDataFromDto(data: UpsertCenterBranchDto) {
  const out: Record<string, string | number | boolean | null> = {};
  for (const key of [
    'name',
    'cityAr',
    'cityEn',
    'cityHe',
    'addressAr',
    'addressEn',
    'addressHe',
    'phone',
    'whatsapp',
    'mapsUrl',
    'workingHoursTextAr',
    'workingHoursTextEn',
    'workingHoursTextHe',
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      out[key] = cleanNullableString(data[key]);
    }
  }
  if (Object.prototype.hasOwnProperty.call(data, 'isMain')) {
    out.isMain = Boolean(data.isMain);
  }
  if (Object.prototype.hasOwnProperty.call(data, 'isActive')) {
    out.isActive = data.isActive == null ? true : Boolean(data.isActive);
  }
  if (Object.prototype.hasOwnProperty.call(data, 'sortOrder')) {
    out.sortOrder = data.sortOrder == null ? 0 : Number(data.sortOrder);
  }
  return out;
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
        select: {
          id: true,
          owner: { select: { phone: true } },
          subscriptions: {
            where: {
              currentPeriodEnd: { gte: startOfDay() },
              status: { in: [...GLOBAL_WHATSAPP_SUBSCRIPTION_STATUSES] },
            },
            select: { notificationPhone: true },
            orderBy: { currentPeriodEnd: 'desc' },
            take: 1,
          },
        },
      });
      if (!center) {
        return { centerId, branding: null };
      }
      const globalWhatsappPhone = firstNonBlank(
        center.subscriptions[0]?.notificationPhone,
        center.owner?.phone,
      );

      try {
        const branding = await db.brandingSettings.findUnique({
          where: { centerId },
          select: brandingSelect,
        });
        return {
          centerId,
          branding: branding
            ? { ...branding, globalWhatsappPhone }
            : { globalWhatsappPhone },
        };
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
            ? {
                ...branding,
                globalWhatsappPhone,
                latitude: null,
                longitude: null,
              }
            : { globalWhatsappPhone, latitude: null, longitude: null },
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
      } else if (key === 'publicBookingMode') {
        cleaned[key] =
          value === 'DIRECT_BOOKING' ? 'DIRECT_BOOKING' : 'SIMPLE_REQUEST';
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

  async listBranches(centerId: string, activeOnly = false) {
    const db = await this.prisma.getClient();
    return db.centerBranch.findMany({
      where: { centerId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: branchSelect,
    });
  }

  async createBranch(centerId: string, data: UpsertCenterBranchDto) {
    const db = await this.prisma.getClient();
    validateBranch(data, true);
    const cleaned = branchDataFromDto(data);
    const wantsMain = Boolean(cleaned.isMain);
    return db.$transaction(async (tx) => {
      if (wantsMain) {
        await tx.centerBranch.updateMany({
          where: { centerId },
          data: { isMain: false },
        });
      }
      return tx.centerBranch.create({
        data: {
          centerId,
          name: String(cleaned.name),
          cityAr: (cleaned.cityAr as string | null | undefined) ?? null,
          cityEn: (cleaned.cityEn as string | null | undefined) ?? null,
          cityHe: (cleaned.cityHe as string | null | undefined) ?? null,
          addressAr: (cleaned.addressAr as string | null | undefined) ?? null,
          addressEn: (cleaned.addressEn as string | null | undefined) ?? null,
          addressHe: (cleaned.addressHe as string | null | undefined) ?? null,
          phone: (cleaned.phone as string | null | undefined) ?? null,
          whatsapp: (cleaned.whatsapp as string | null | undefined) ?? null,
          mapsUrl: (cleaned.mapsUrl as string | null | undefined) ?? null,
          workingHoursTextAr:
            (cleaned.workingHoursTextAr as string | null | undefined) ?? null,
          workingHoursTextEn:
            (cleaned.workingHoursTextEn as string | null | undefined) ?? null,
          workingHoursTextHe:
            (cleaned.workingHoursTextHe as string | null | undefined) ?? null,
          isMain: wantsMain,
          isActive: cleaned.isActive == null ? true : Boolean(cleaned.isActive),
          sortOrder: Number(cleaned.sortOrder ?? 0),
        },
        select: branchSelect,
      });
    });
  }

  async updateBranch(
    centerId: string,
    branchId: string,
    data: UpsertCenterBranchDto,
  ) {
    const db = await this.prisma.getClient();
    validateBranch(data, false);
    const existing = await db.centerBranch.findFirst({
      where: { centerId, id: branchId },
      select: { id: true },
    });
    if (!existing) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { branchId: 'Branch not found.' },
      });
    }
    const cleaned = branchDataFromDto(data);
    const wantsMain = cleaned.isMain === true;
    return db.$transaction(async (tx) => {
      if (wantsMain) {
        await tx.centerBranch.updateMany({
          where: { centerId, id: { not: branchId } },
          data: { isMain: false },
        });
      }
      return tx.centerBranch.update({
        where: { id: branchId },
        data: cleaned,
        select: branchSelect,
      });
    });
  }

  async deactivateBranch(centerId: string, branchId: string) {
    const db = await this.prisma.getClient();
    const existing = await db.centerBranch.findFirst({
      where: { centerId, id: branchId },
      select: { id: true },
    });
    if (!existing) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { branchId: 'Branch not found.' },
      });
    }
    return db.centerBranch.update({
      where: { id: branchId },
      data: { isActive: false, isMain: false },
      select: branchSelect,
    });
  }

  async reorderBranches(centerId: string, data: ReorderCenterBranchesDto) {
    const db = await this.prisma.getClient();
    const rows = data.branches ?? [];
    if (!Array.isArray(rows)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { branches: 'Branches must be a list.' },
      });
    }
    await db.$transaction(
      rows
        .filter((row) => row.id && Number.isInteger(Number(row.sortOrder)))
        .map((row) =>
          db.centerBranch.updateMany({
            where: { centerId, id: String(row.id) },
            data: { sortOrder: Number(row.sortOrder) },
          }),
        ),
    );
    return this.listBranches(centerId);
  }
}
