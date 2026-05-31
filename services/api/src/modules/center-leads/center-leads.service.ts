import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export type CreateCenterLeadDto = {
  centerName: string;
  ownerName: string;
  phone: string;
  whatsapp?: string | null;
  city?: string | null;
  businessType?: string | null;
  notes?: string | null;
};

export type UpdateCenterLeadStatusDto = {
  status:
    | 'NEW'
    | 'CONTACTED'
    | 'NO_ANSWER'
    | 'WRONG_NUMBER'
    | 'NOT_INTERESTED'
    | 'CANCELLED'
    | 'DEMO_BOOKED'
    | 'CONVERTED';
};

function cleanStr(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 && t.length <= max ? t : null;
}

function requireStr(
  value: unknown,
  max: number,
  field: string,
  errors: Record<string, string>,
): string {
  const cleaned = cleanStr(value, max);
  if (!cleaned) {
    errors[field] = `Required. Max ${max} characters.`;
    return '';
  }
  return cleaned;
}

const VALID_STATUSES = [
  'NEW',
  'CONTACTED',
  'NO_ANSWER',
  'WRONG_NUMBER',
  'NOT_INTERESTED',
  'CANCELLED',
  'DEMO_BOOKED',
  'CONVERTED',
] as const;

@Injectable()
export class CenterLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(dto: CreateCenterLeadDto) {
    const errors: Record<string, string> = {};

    const centerName = requireStr(dto.centerName, 200, 'centerName', errors);
    const ownerName = requireStr(dto.ownerName, 160, 'ownerName', errors);
    const phone = requireStr(dto.phone, 32, 'phone', errors);
    const whatsapp = cleanStr(dto.whatsapp, 32);
    const city = cleanStr(dto.city, 120);
    const businessType = cleanStr(dto.businessType, 120);
    const notes = cleanStr(dto.notes, 1000);

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    const prisma = await this.prisma.getClient();
    const lead = await prisma.centerLead.create({
      data: {
        centerName,
        ownerName,
        phone,
        whatsapp,
        city,
        businessType,
        notes,
        status: 'NEW',
      },
    });

    return { lead };
  }

  async listLeads(options: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));
    const skip = (page - 1) * pageSize;

    const statusFilter = VALID_STATUSES.includes(
      options.status as (typeof VALID_STATUSES)[number],
    )
      ? (options.status as (typeof VALID_STATUSES)[number])
      : undefined;

    const search = options.search?.trim() || undefined;

    const where = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search
        ? {
            OR: [
              {
                centerName: { contains: search, mode: 'insensitive' as const },
              },
              { ownerName: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
              { whatsapp: { contains: search } },
              { city: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const prisma = await this.prisma.getClient();
    const [leads, total] = await Promise.all([
      prisma.centerLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.centerLead.count({ where }),
    ]);

    return { leads, total, page, pageSize };
  }

  async updateLeadStatus(id: string, dto: UpdateCenterLeadStatusDto) {
    if (!VALID_STATUSES.includes(dto.status)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { status: 'Invalid status value.' },
      });
    }

    const prisma = await this.prisma.getClient();
    const lead = await prisma.centerLead.update({
      where: { id },
      data: { status: dto.status },
    });

    return { lead };
  }
}
