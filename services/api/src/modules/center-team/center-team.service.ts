import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

type TeamPayload = {
  bioAr?: string | null;
  bioEn?: string | null;
  bioHe?: string | null;
  isPublished?: boolean | null;
  nameAr?: string | null;
  nameEn?: string | null;
  nameHe?: string | null;
  photoUrl?: string | null;
  sortOrder?: number | null;
  specialtyAr?: string | null;
  specialtyEn?: string | null;
  specialtyHe?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  titleHe?: string | null;
  yearsExperience?: number | null;
};

function cleanText(value?: string | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

function normalizeSortOrder(value?: number | null) {
  const n = Number(value ?? 0);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

function normalizeYears(value?: number | null) {
  if (value == null) return null;
  const n = Math.round(Number(value));
  return n >= 0 && n <= 99 ? n : null;
}

const PUBLIC_SELECT = {
  bioAr: true,
  bioEn: true,
  bioHe: true,
  id: true,
  nameAr: true,
  nameEn: true,
  nameHe: true,
  photoUrl: true,
  sortOrder: true,
  specialtyAr: true,
  specialtyEn: true,
  specialtyHe: true,
  titleAr: true,
  titleEn: true,
  titleHe: true,
  yearsExperience: true,
} as const;

@Injectable()
export class CenterTeamService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenant(centerId: string) {
    const db = await this.prisma.getClient();
    const items = await db.centerTeamMember.findMany({
      where: { centerId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { success: true, items };
  }

  async createTenant(centerId: string, payload: TeamPayload) {
    const db = await this.prisma.getClient();
    const item = await db.centerTeamMember.create({
      data: {
        bioAr: cleanText(payload.bioAr),
        bioEn: cleanText(payload.bioEn),
        bioHe: cleanText(payload.bioHe),
        centerId,
        isPublished: Boolean(payload.isPublished),
        nameAr: cleanText(payload.nameAr),
        nameEn: cleanText(payload.nameEn),
        nameHe: cleanText(payload.nameHe),
        photoUrl: cleanText(payload.photoUrl),
        sortOrder: normalizeSortOrder(payload.sortOrder),
        specialtyAr: cleanText(payload.specialtyAr),
        specialtyEn: cleanText(payload.specialtyEn),
        specialtyHe: cleanText(payload.specialtyHe),
        titleAr: cleanText(payload.titleAr),
        titleEn: cleanText(payload.titleEn),
        titleHe: cleanText(payload.titleHe),
        yearsExperience: normalizeYears(payload.yearsExperience),
      },
    });
    return { success: true, item };
  }

  async updateTenant(centerId: string, id: string, payload: TeamPayload) {
    const db = await this.prisma.getClient();
    const existing = await db.centerTeamMember.findFirst({
      where: { centerId, id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Team member not found');

    const item = await db.centerTeamMember.update({
      where: { id },
      data: {
        ...(payload.bioAr !== undefined
          ? { bioAr: cleanText(payload.bioAr) }
          : {}),
        ...(payload.bioEn !== undefined
          ? { bioEn: cleanText(payload.bioEn) }
          : {}),
        ...(payload.bioHe !== undefined
          ? { bioHe: cleanText(payload.bioHe) }
          : {}),
        ...(payload.isPublished !== undefined
          ? { isPublished: Boolean(payload.isPublished) }
          : {}),
        ...(payload.nameAr !== undefined
          ? { nameAr: cleanText(payload.nameAr) }
          : {}),
        ...(payload.nameEn !== undefined
          ? { nameEn: cleanText(payload.nameEn) }
          : {}),
        ...(payload.nameHe !== undefined
          ? { nameHe: cleanText(payload.nameHe) }
          : {}),
        ...(payload.photoUrl !== undefined
          ? { photoUrl: cleanText(payload.photoUrl) }
          : {}),
        ...(payload.sortOrder !== undefined
          ? { sortOrder: normalizeSortOrder(payload.sortOrder) }
          : {}),
        ...(payload.specialtyAr !== undefined
          ? { specialtyAr: cleanText(payload.specialtyAr) }
          : {}),
        ...(payload.specialtyEn !== undefined
          ? { specialtyEn: cleanText(payload.specialtyEn) }
          : {}),
        ...(payload.specialtyHe !== undefined
          ? { specialtyHe: cleanText(payload.specialtyHe) }
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
        ...(payload.yearsExperience !== undefined
          ? { yearsExperience: normalizeYears(payload.yearsExperience) }
          : {}),
      },
    });
    return { success: true, item };
  }

  async deleteTenant(centerId: string, id: string) {
    const db = await this.prisma.getClient();
    const existing = await db.centerTeamMember.findFirst({
      where: { centerId, id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Team member not found');
    await db.centerTeamMember.delete({ where: { id } });
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

    const data = await db.centerTeamMember.findMany({
      where: { centerId: center.id, isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: PUBLIC_SELECT,
    });
    return { data };
  }
}
