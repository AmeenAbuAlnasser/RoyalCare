import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

type ReviewPayload = {
  commentAr?: string | null;
  commentEn?: string | null;
  commentHe?: string | null;
  customerName?: string | null;
  isPublished?: boolean | null;
  rating?: number | null;
  sortOrder?: number | null;
};

function cleanText(value?: string | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

function validatePayload(payload: ReviewPayload, partial = false) {
  const errors: Record<string, string> = {};
  const customerName = cleanText(payload.customerName);
  const rating = Number(payload.rating);
  const sortOrder = Number(payload.sortOrder ?? 0);

  if (!partial || payload.customerName !== undefined) {
    if (!customerName) errors.customerName = 'Customer name is required.';
    else if (customerName.length > 160) {
      errors.customerName = 'Customer name must be 160 characters or fewer.';
    }
  }

  if (!partial || payload.rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.rating = 'Rating must be between 1 and 5.';
    }
  }

  if (
    payload.sortOrder !== undefined &&
    (!Number.isInteger(sortOrder) || sortOrder < 0)
  ) {
    errors.sortOrder = 'Sort order must be a positive number.';
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({ message: 'Validation failed', errors });
  }

  return { customerName, rating, sortOrder };
}

@Injectable()
export class CenterReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenantReviews(centerId: string) {
    const db = await this.prisma.getClient();
    const items = await db.centerReview.findMany({
      where: { centerId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return { success: true, items };
  }

  async createTenantReview(centerId: string, payload: ReviewPayload) {
    const db = await this.prisma.getClient();
    const validated = validatePayload(payload);
    const item = await db.centerReview.create({
      data: {
        centerId,
        commentAr: cleanText(payload.commentAr),
        commentEn: cleanText(payload.commentEn),
        commentHe: cleanText(payload.commentHe),
        customerName: validated.customerName!,
        isPublished: Boolean(payload.isPublished),
        rating: validated.rating,
        sortOrder: validated.sortOrder,
      },
    });
    return { success: true, item };
  }

  async updateTenantReview(
    centerId: string,
    id: string,
    payload: ReviewPayload,
  ) {
    const db = await this.prisma.getClient();
    const existing = await db.centerReview.findFirst({
      where: { centerId, id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Review not found');

    const validated = validatePayload(payload, true);
    const item = await db.centerReview.update({
      where: { id },
      data: {
        ...(payload.commentAr !== undefined
          ? { commentAr: cleanText(payload.commentAr) }
          : {}),
        ...(payload.commentEn !== undefined
          ? { commentEn: cleanText(payload.commentEn) }
          : {}),
        ...(payload.commentHe !== undefined
          ? { commentHe: cleanText(payload.commentHe) }
          : {}),
        ...(payload.customerName !== undefined
          ? { customerName: validated.customerName! }
          : {}),
        ...(payload.isPublished !== undefined
          ? { isPublished: Boolean(payload.isPublished) }
          : {}),
        ...(payload.rating !== undefined ? { rating: validated.rating } : {}),
        ...(payload.sortOrder !== undefined
          ? { sortOrder: validated.sortOrder }
          : {}),
      },
    });
    return { success: true, item };
  }

  async deleteTenantReview(centerId: string, id: string) {
    const db = await this.prisma.getClient();
    const existing = await db.centerReview.findFirst({
      where: { centerId, id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Review not found');
    await db.centerReview.delete({ where: { id } });
    return { success: true };
  }

  async listPublicReviews(slug: string) {
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

    const data = await db.centerReview.findMany({
      where: { centerId: center.id, isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        commentAr: true,
        commentEn: true,
        commentHe: true,
        customerName: true,
        id: true,
        rating: true,
        sortOrder: true,
      },
    });
    return { data };
  }
}
