import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class CenterGalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicGallery(slug: string) {
    try {
      const db = await this.prisma.getClient();
      const center = await db.center.findFirst({
        where: { slug, status: 'ACTIVE', publicVisible: true },
        select: { id: true },
      });
      if (!center) return { data: [] };
      const images = await db.centerGalleryImage.findMany({
        where: { centerId: center.id },
        select: { id: true, imageUrl: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      });
      return { data: images };
    } catch (error) {
      console.error(
        '[tenant-gallery] getPublicGallery error (table may be missing — run pending migration):',
        error,
      );
      return { data: [] };
    }
  }

  async getTenantGallery(centerId: string) {
    try {
      const db = await this.prisma.getClient();
      const images = await db.centerGalleryImage.findMany({
        where: { centerId },
        select: { id: true, imageUrl: true, sortOrder: true, createdAt: true },
        orderBy: { sortOrder: 'asc' },
      });
      return { success: true, items: images };
    } catch (error) {
      console.error(
        '[tenant-gallery] getTenantGallery error (table may be missing — run pending migration):',
        error,
      );
      return { success: true, items: [] };
    }
  }

  async addGalleryImage(centerId: string, imageUrl: string) {
    const db = await this.prisma.getClient();

    let count: number;
    try {
      count = await db.centerGalleryImage.count({ where: { centerId } });
    } catch (error) {
      console.error('[tenant-gallery] addGalleryImage count error:', error);
      throw new BadRequestException({
        success: false,
        code: 'DB_CREATE_FAILED',
        message: 'Validation failed',
        errors: { file: 'Gallery table is not available. Contact support.' },
      });
    }

    if (count >= 20) {
      throw new BadRequestException({
        success: false,
        code: 'GALLERY_LIMIT',
        message: 'Validation failed',
        errors: { file: 'Gallery limit reached. Maximum 20 images allowed.' },
      });
    }

    let last: { sortOrder: number } | null;
    try {
      last = await db.centerGalleryImage.findFirst({
        where: { centerId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
    } catch {
      last = null;
    }

    let image: {
      id: string;
      imageUrl: string;
      sortOrder: number;
      createdAt: Date;
    };
    try {
      image = await db.centerGalleryImage.create({
        data: { centerId, imageUrl, sortOrder: (last?.sortOrder ?? -1) + 1 },
        select: { id: true, imageUrl: true, sortOrder: true, createdAt: true },
      });
    } catch (error) {
      console.error('[tenant-gallery] addGalleryImage create error:', error);
      throw new BadRequestException({
        success: false,
        code: 'DB_CREATE_FAILED',
        message: 'Validation failed',
        errors: { file: 'Failed to save image. Please try again.' },
      });
    }

    return { success: true, item: image };
  }

  async deleteGalleryImage(centerId: string, id: string) {
    try {
      const db = await this.prisma.getClient();
      const image = await db.centerGalleryImage.findFirst({
        where: { id, centerId },
        select: { id: true },
      });
      if (!image) {
        throw new NotFoundException('Gallery image not found');
      }
      await db.centerGalleryImage.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      console.error('[tenant-gallery] deleteGalleryImage error:', error);
      throw error;
    }
  }

  async reorderGalleryImages(centerId: string, ids: string[]) {
    try {
      const db = await this.prisma.getClient();
      const existing = await db.centerGalleryImage.findMany({
        where: { centerId },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((i) => i.id));
      for (const id of ids) {
        if (!existingIds.has(id)) {
          throw new ForbiddenException('Gallery image not found');
        }
      }
      await db.$transaction(
        ids.map((id, idx) =>
          db.centerGalleryImage.update({
            where: { id },
            data: { sortOrder: idx },
          }),
        ),
      );
      return await this.getTenantGallery(centerId);
    } catch (error) {
      console.error('[tenant-gallery] reorderGalleryImages error:', error);
      throw error;
    }
  }
}
