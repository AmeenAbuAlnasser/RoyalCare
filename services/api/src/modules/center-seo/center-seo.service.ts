import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

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

function cleanText(value?: string | null, max?: number) {
  const text = typeof value === 'string' ? value.trim() : '';
  const trimmed = max ? text.slice(0, max) : text;
  return trimmed.length > 0 ? trimmed : null;
}

const PUBLIC_SELECT = {
  seoTitleAr: true,
  seoTitleEn: true,
  seoTitleHe: true,
  seoDescriptionAr: true,
  seoDescriptionEn: true,
  seoDescriptionHe: true,
  keywordsAr: true,
  keywordsEn: true,
  keywordsHe: true,
  ogTitleAr: true,
  ogTitleEn: true,
  ogTitleHe: true,
  ogDescriptionAr: true,
  ogDescriptionEn: true,
  ogDescriptionHe: true,
  ogImageUrl: true,
} as const;

@Injectable()
export class CenterSeoService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenant(centerId: string) {
    const db = await this.prisma.getClient();
    const item = await db.centerSeoSettings.findUnique({
      where: { centerId },
    });
    return { success: true, item: item ?? null };
  }

  async upsertTenant(centerId: string, payload: SeoPayload) {
    const db = await this.prisma.getClient();
    const data = {
      seoTitleAr: cleanText(payload.seoTitleAr, 160),
      seoTitleEn: cleanText(payload.seoTitleEn, 160),
      seoTitleHe: cleanText(payload.seoTitleHe, 160),
      seoDescriptionAr: cleanText(payload.seoDescriptionAr, 320),
      seoDescriptionEn: cleanText(payload.seoDescriptionEn, 320),
      seoDescriptionHe: cleanText(payload.seoDescriptionHe, 320),
      keywordsAr: cleanText(payload.keywordsAr, 500),
      keywordsEn: cleanText(payload.keywordsEn, 500),
      keywordsHe: cleanText(payload.keywordsHe, 500),
      ogTitleAr: cleanText(payload.ogTitleAr, 160),
      ogTitleEn: cleanText(payload.ogTitleEn, 160),
      ogTitleHe: cleanText(payload.ogTitleHe, 160),
      ogDescriptionAr: cleanText(payload.ogDescriptionAr, 320),
      ogDescriptionEn: cleanText(payload.ogDescriptionEn, 320),
      ogDescriptionHe: cleanText(payload.ogDescriptionHe, 320),
      ogImageUrl: cleanText(payload.ogImageUrl, 500),
    };
    const item = await db.centerSeoSettings.upsert({
      where: { centerId },
      create: { centerId, ...data },
      update: data,
    });
    return { success: true, item };
  }

  async getPublic(slug: string) {
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
      select: {
        id: true,
        name: true,
        nameEn: true,
        nameAr: true,
        nameHe: true,
        seoSettings: { select: PUBLIC_SELECT },
        branding: {
          select: {
            logoUrl: true,
          },
        },
      },
    });
    if (!center) return { data: null };
    return { data: center };
  }
}
