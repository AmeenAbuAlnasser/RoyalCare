import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

const ALLOWED_IMAGE_PREFIXES = ['/uploads/', '/images/', '/assets/'];
const MAX_TITLE = 200;
const MAX_DESC = 500;
const MAX_SLUG = 160;
const MAX_SERVICES = 50;

function toSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\w؀-ۿ֐-׿\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, MAX_SLUG) || 'service'
  );
}

function prismaCode(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null
    ? ((err as Record<string, unknown>).code as string | undefined)
    : undefined;
}

function rethrowPrisma(err: unknown, context: string): never {
  const code = prismaCode(err);
  if (code === 'P2002') {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { slug: 'A service with this slug already exists.' },
    });
  }
  const hint =
    code === 'P2021' || code === 'P2022'
      ? ' Apply the database migration and restart the API server.'
      : '';
  const detail =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as Record<string, unknown>).message)
      : String(err);
  throw new InternalServerErrorException(`${context}: ${detail}.${hint}`);
}

function isValidImageUrl(value: string): boolean {
  if (!value.trim()) return true;
  if (ALLOWED_IMAGE_PREFIXES.some((p) => value.startsWith(p))) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

type CreateDto = {
  titleAr: string;
  titleEn: string;
  titleHe?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  descriptionHe?: string;
  imageUrl?: string | null;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
};

type UpdateDto = Partial<CreateDto>;

@Injectable()
export class FeaturedServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    const db = await this.prisma.getClient();
    const services = await db.publicFeaturedService.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { services };
  }

  async listAdmin() {
    const db = await this.prisma.getClient();
    const services = await db.publicFeaturedService.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { services };
  }

  async create(data: CreateDto) {
    const errors: Record<string, string> = {};
    const titleAr = (data.titleAr ?? '').trim();
    const titleEn = (data.titleEn ?? '').trim();
    const titleHe = (data.titleHe ?? '').trim();

    if (titleAr.length > MAX_TITLE)
      errors['titleAr'] = `Max ${MAX_TITLE} characters.`;
    if (titleEn.length > MAX_TITLE)
      errors['titleEn'] = `Max ${MAX_TITLE} characters.`;
    if (titleHe.length > MAX_TITLE)
      errors['titleHe'] = `Max ${MAX_TITLE} characters.`;
    if (data.descriptionAr && data.descriptionAr.length > MAX_DESC)
      errors['descriptionAr'] = `Max ${MAX_DESC} characters.`;
    if (data.descriptionEn && data.descriptionEn.length > MAX_DESC)
      errors['descriptionEn'] = `Max ${MAX_DESC} characters.`;
    if (data.imageUrl && !isValidImageUrl(data.imageUrl))
      errors['imageUrl'] = 'Image URL must be http(s) or /uploads/...';
    if (Object.keys(errors).length)
      throw new BadRequestException({ message: 'Validation failed', errors });

    const db = await this.prisma.getClient();

    try {
      const count = await db.publicFeaturedService.count();
      if (count >= MAX_SERVICES)
        throw new BadRequestException({
          message: 'Validation failed',
          errors: { slug: `Maximum ${MAX_SERVICES} featured services.` },
        });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      rethrowPrisma(err, 'Count check failed');
    }

    // Slug: use provided slug → title-derived → timestamp fallback (all titles empty)
    const titleSource = titleEn || titleAr || titleHe;
    const base = (
      data.slug?.trim() ||
      (titleSource ? toSlug(titleSource) : `featured-service-${Date.now()}`)
    ).slice(0, MAX_SLUG);

    let slug = base;
    let attempt = 0;
    try {
      while (await db.publicFeaturedService.findUnique({ where: { slug } })) {
        attempt++;
        const suffix = `-${attempt}`;
        slug = `${base.slice(0, MAX_SLUG - suffix.length)}${suffix}`;
      }
    } catch (err) {
      rethrowPrisma(err, 'Slug uniqueness check failed');
    }

    let service: Awaited<ReturnType<typeof db.publicFeaturedService.create>>;
    try {
      service = await db.publicFeaturedService.create({
        data: {
          titleAr,
          titleEn,
          titleHe,
          descriptionAr: (data.descriptionAr ?? '').trim(),
          descriptionEn: (data.descriptionEn ?? '').trim(),
          descriptionHe: (data.descriptionHe ?? '').trim(),
          imageUrl: data.imageUrl?.trim() || null,
          slug,
          sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
          isActive: data.isActive !== false,
        },
      });
    } catch (err) {
      rethrowPrisma(err, 'Create featured service failed');
    }
    return { service: service! };
  }

  async update(id: string, data: UpdateDto) {
    const db = await this.prisma.getClient();

    let existing: Awaited<
      ReturnType<typeof db.publicFeaturedService.findUnique>
    >;
    try {
      existing = await db.publicFeaturedService.findUnique({ where: { id } });
    } catch (err) {
      rethrowPrisma(err, 'Fetch featured service failed');
    }
    if (!existing!) throw new NotFoundException('Featured service not found.');

    if (data.imageUrl && !isValidImageUrl(data.imageUrl))
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { imageUrl: 'Image URL must be http(s) or /uploads/...' },
      });

    const updateData: Record<string, unknown> = {};
    if (data.titleAr !== undefined) updateData['titleAr'] = data.titleAr.trim();
    if (data.titleEn !== undefined) updateData['titleEn'] = data.titleEn.trim();
    if (data.titleHe !== undefined) updateData['titleHe'] = data.titleHe.trim();
    if (data.descriptionAr !== undefined)
      updateData['descriptionAr'] = data.descriptionAr.trim();
    if (data.descriptionEn !== undefined)
      updateData['descriptionEn'] = data.descriptionEn.trim();
    if (data.descriptionHe !== undefined)
      updateData['descriptionHe'] = data.descriptionHe.trim();
    if ('imageUrl' in data)
      updateData['imageUrl'] = data.imageUrl?.trim() || null;
    if (data.slug !== undefined) {
      const newSlug = data.slug.trim().slice(0, MAX_SLUG);
      if (newSlug !== existing.slug) {
        try {
          const conflict = await db.publicFeaturedService.findUnique({
            where: { slug: newSlug },
          });
          if (conflict)
            throw new BadRequestException({
              message: 'Validation failed',
              errors: { slug: 'Slug already in use.' },
            });
        } catch (err) {
          if (err instanceof BadRequestException) throw err;
          rethrowPrisma(err, 'Slug conflict check failed');
        }
        updateData['slug'] = newSlug;
      }
    }
    if (typeof data.sortOrder === 'number')
      updateData['sortOrder'] = data.sortOrder;
    if (typeof data.isActive === 'boolean')
      updateData['isActive'] = data.isActive;

    let service: Awaited<ReturnType<typeof db.publicFeaturedService.update>>;
    try {
      service = await db.publicFeaturedService.update({
        where: { id },
        data: updateData,
      });
    } catch (err) {
      rethrowPrisma(err, 'Update featured service failed');
    }
    return { service: service! };
  }

  async remove(id: string) {
    const db = await this.prisma.getClient();
    let existing: Awaited<
      ReturnType<typeof db.publicFeaturedService.findUnique>
    >;
    try {
      existing = await db.publicFeaturedService.findUnique({ where: { id } });
    } catch (err) {
      rethrowPrisma(err, 'Fetch featured service failed');
    }
    if (!existing!) throw new NotFoundException('Featured service not found.');
    try {
      await db.publicFeaturedService.delete({ where: { id } });
    } catch (err) {
      rethrowPrisma(err, 'Delete featured service failed');
    }
    return { success: true };
  }
}
