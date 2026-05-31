import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

type OfferPayload = {
  badgeAr?: string | null;
  badgeEn?: string | null;
  badgeHe?: string | null;
  currency?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  descriptionHe?: string | null;
  endsAt?: string | null;
  imageUrl?: string | null;
  isPublished?: boolean | null;
  newPrice?: number | string | null;
  oldPrice?: number | string | null;
  sortOrder?: number | null;
  startsAt?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  titleHe?: string | null;
};

function cleanText(value?: string | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

function cleanCurrency(value?: string | null) {
  const text = (value ?? 'ILS').toString().trim().toUpperCase();
  return text.length > 0 ? text : 'ILS';
}

function cleanPrice(value?: number | string | null): string | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
}

function cleanDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeSortOrder(value?: number | null) {
  const n = Number(value ?? 0);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

const PUBLIC_SELECT = {
  badgeAr: true,
  badgeEn: true,
  badgeHe: true,
  currency: true,
  descriptionAr: true,
  descriptionEn: true,
  descriptionHe: true,
  endsAt: true,
  id: true,
  imageUrl: true,
  newPrice: true,
  oldPrice: true,
  sortOrder: true,
  startsAt: true,
  titleAr: true,
  titleEn: true,
  titleHe: true,
} as const;

@Injectable()
export class CenterOffersService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenant(centerId: string) {
    const db = await this.prisma.getClient();
    const items = await db.centerOffer.findMany({
      where: { centerId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return { success: true, items };
  }

  async createTenant(centerId: string, payload: OfferPayload) {
    const db = await this.prisma.getClient();
    const item = await db.centerOffer.create({
      data: {
        badgeAr: cleanText(payload.badgeAr),
        badgeEn: cleanText(payload.badgeEn),
        badgeHe: cleanText(payload.badgeHe),
        centerId,
        currency: cleanCurrency(payload.currency),
        descriptionAr: cleanText(payload.descriptionAr),
        descriptionEn: cleanText(payload.descriptionEn),
        descriptionHe: cleanText(payload.descriptionHe),
        endsAt: cleanDate(payload.endsAt),
        imageUrl: cleanText(payload.imageUrl),
        isPublished: Boolean(payload.isPublished),
        newPrice: cleanPrice(payload.newPrice),
        oldPrice: cleanPrice(payload.oldPrice),
        sortOrder: normalizeSortOrder(payload.sortOrder),
        startsAt: cleanDate(payload.startsAt),
        titleAr: cleanText(payload.titleAr),
        titleEn: cleanText(payload.titleEn),
        titleHe: cleanText(payload.titleHe),
      },
    });
    return { success: true, item };
  }

  async updateTenant(centerId: string, id: string, payload: OfferPayload) {
    const db = await this.prisma.getClient();
    const existing = await db.centerOffer.findFirst({
      where: { centerId, id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Offer not found');

    const item = await db.centerOffer.update({
      where: { id },
      data: {
        ...(payload.badgeAr !== undefined
          ? { badgeAr: cleanText(payload.badgeAr) }
          : {}),
        ...(payload.badgeEn !== undefined
          ? { badgeEn: cleanText(payload.badgeEn) }
          : {}),
        ...(payload.badgeHe !== undefined
          ? { badgeHe: cleanText(payload.badgeHe) }
          : {}),
        ...(payload.currency !== undefined
          ? { currency: cleanCurrency(payload.currency) }
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
        ...(payload.endsAt !== undefined
          ? { endsAt: cleanDate(payload.endsAt) }
          : {}),
        ...(payload.imageUrl !== undefined
          ? { imageUrl: cleanText(payload.imageUrl) }
          : {}),
        ...(payload.isPublished !== undefined
          ? { isPublished: Boolean(payload.isPublished) }
          : {}),
        ...(payload.newPrice !== undefined
          ? { newPrice: cleanPrice(payload.newPrice) }
          : {}),
        ...(payload.oldPrice !== undefined
          ? { oldPrice: cleanPrice(payload.oldPrice) }
          : {}),
        ...(payload.sortOrder !== undefined
          ? { sortOrder: normalizeSortOrder(payload.sortOrder) }
          : {}),
        ...(payload.startsAt !== undefined
          ? { startsAt: cleanDate(payload.startsAt) }
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
    const existing = await db.centerOffer.findFirst({
      where: { centerId, id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Offer not found');
    await db.centerOffer.delete({ where: { id } });
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

    const now = new Date();
    const data = await db.centerOffer.findMany({
      where: {
        centerId: center.id,
        isPublished: true,
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: now }, endsAt: null },
          { startsAt: null, endsAt: { gte: now } },
          { startsAt: { lte: now }, endsAt: { gte: now } },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: PUBLIC_SELECT,
    });
    return { data };
  }
}
