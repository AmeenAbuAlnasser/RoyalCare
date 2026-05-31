import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

const categories = ['LASER', 'SKIN', 'DENTAL', 'HAIR', 'OTHER'] as const;
type Category = (typeof categories)[number];

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

function cleanText(value?: string | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

function cleanRequiredUrl(value: string | null | undefined, field: string) {
  const text = cleanText(value);
  if (!text) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { [field]: 'Image is required.' },
    });
  }
  return text;
}

function normalizeCategory(value?: string | null): Category {
  const category = String(value || 'OTHER').toUpperCase();
  return categories.includes(category as Category)
    ? (category as Category)
    : 'OTHER';
}

function normalizeSortOrder(value?: number | null) {
  const number = Number(value ?? 0);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

@Injectable()
export class CenterBeforeAfterService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenant(centerId: string) {
    const db = await this.prisma.getClient();
    const items = await db.centerBeforeAfter.findMany({
      where: { centerId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return { success: true, items };
  }

  async createTenant(centerId: string, payload: BeforeAfterPayload) {
    const db = await this.prisma.getClient();
    const item = await db.centerBeforeAfter.create({
      data: {
        afterImageUrl: cleanRequiredUrl(payload.afterImageUrl, 'afterImageUrl'),
        beforeImageUrl: cleanRequiredUrl(
          payload.beforeImageUrl,
          'beforeImageUrl',
        ),
        category: normalizeCategory(payload.category),
        centerId,
        descriptionAr: cleanText(payload.descriptionAr),
        descriptionEn: cleanText(payload.descriptionEn),
        descriptionHe: cleanText(payload.descriptionHe),
        isPublished: Boolean(payload.isPublished),
        sortOrder: normalizeSortOrder(payload.sortOrder),
        titleAr: cleanText(payload.titleAr),
        titleEn: cleanText(payload.titleEn),
        titleHe: cleanText(payload.titleHe),
      },
    });
    return { success: true, item };
  }

  async updateTenant(
    centerId: string,
    id: string,
    payload: BeforeAfterPayload,
  ) {
    const db = await this.prisma.getClient();
    const existing = await db.centerBeforeAfter.findFirst({
      where: { centerId, id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Before/after item not found');

    const item = await db.centerBeforeAfter.update({
      where: { id },
      data: {
        ...(payload.afterImageUrl !== undefined
          ? {
              afterImageUrl: cleanRequiredUrl(
                payload.afterImageUrl,
                'afterImageUrl',
              ),
            }
          : {}),
        ...(payload.beforeImageUrl !== undefined
          ? {
              beforeImageUrl: cleanRequiredUrl(
                payload.beforeImageUrl,
                'beforeImageUrl',
              ),
            }
          : {}),
        ...(payload.category !== undefined
          ? { category: normalizeCategory(payload.category) }
          : {}),
        ...(payload.descriptionAr !== undefined
          ? { descriptionAr: cleanText(payload.descriptionAr) }
          : {}),
        ...(payload.descriptionEn !== undefined
          ? { descriptionEn: cleanText(payload.descriptionEn) }
          : {}),
        ...(payload.descriptionHe !== undefined
          ? { descriptionHe: cleanText(payload.descriptionHe) }
          : {}),
        ...(payload.isPublished !== undefined
          ? { isPublished: Boolean(payload.isPublished) }
          : {}),
        ...(payload.sortOrder !== undefined
          ? { sortOrder: normalizeSortOrder(payload.sortOrder) }
          : {}),
        ...(payload.titleAr !== undefined
          ? { titleAr: cleanText(payload.titleAr) }
          : {}),
        ...(payload.titleEn !== undefined
          ? { titleEn: cleanText(payload.titleEn) }
          : {}),
        ...(payload.titleHe !== undefined
          ? { titleHe: cleanText(payload.titleHe) }
          : {}),
      },
    });
    return { success: true, item };
  }

  async deleteTenant(centerId: string, id: string) {
    const db = await this.prisma.getClient();
    const existing = await db.centerBeforeAfter.findFirst({
      where: { centerId, id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Before/after item not found');
    await db.centerBeforeAfter.delete({ where: { id } });
    return { success: true };
  }

  async listPublic(slug: string) {
    const db = await this.prisma.getClient();
    const center = await db.center.findFirst({
      where: {
        publicVisible: true,
        slug,
        status: 'ACTIVE',
        subscriptions: {
          some: { status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
        },
      },
      select: { id: true },
    });
    if (!center) return { data: [] };

    const data = await db.centerBeforeAfter.findMany({
      where: { centerId: center.id, isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        afterImageUrl: true,
        beforeImageUrl: true,
        category: true,
        descriptionAr: true,
        descriptionEn: true,
        descriptionHe: true,
        id: true,
        sortOrder: true,
        titleAr: true,
        titleEn: true,
        titleHe: true,
      },
    });
    return { data };
  }
}
