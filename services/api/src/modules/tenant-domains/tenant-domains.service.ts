import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as dns from 'dns/promises';
import type { Prisma } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';
import { startOfDay } from '../../common/subscriptions/subscription-lifecycle';

function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) return false;
  const hostnameRe =
    /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z0-9-]{1,63}(?<!-))*\.[a-zA-Z]{2,}$/;
  return hostnameRe.test(hostname);
}

const PUBLIC_DOMAIN_SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
] as const;

function publicDomainSubscriptionWhere(): Prisma.SubscriptionWhereInput {
  return {
    currentPeriodEnd: { gte: startOfDay() },
    status: { in: [...PUBLIC_DOMAIN_SUBSCRIPTION_STATUSES] },
  };
}

@Injectable()
export class TenantDomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(centerId: string) {
    const db = await this.prisma.getClient();
    const items = await db.domain.findMany({
      where: { centerId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        hostname: true,
        type: true,
        status: true,
        isPrimary: true,
        verificationToken: true,
        verifiedAt: true,
        sslStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { success: true, items };
  }

  async add(centerId: string, hostname: string) {
    const cleaned = hostname.trim().toLowerCase();

    if (!isValidHostname(cleaned)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          hostname: 'Enter a valid domain name (e.g. clinic.example.com).',
        },
      });
    }

    const db = await this.prisma.getClient();

    const existing = await db.domain.findUnique({
      where: { hostname: cleaned },
    });
    if (existing) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          hostname: 'This domain is already registered on the platform.',
        },
      });
    }

    const verificationToken = `rc_verify_${randomBytes(16).toString('hex')}`;

    const item = await db.domain.create({
      data: {
        centerId,
        hostname: cleaned,
        type: 'CUSTOM',
        status: 'PENDING',
        isPrimary: false,
        verificationToken,
      },
      select: {
        id: true,
        hostname: true,
        type: true,
        status: true,
        isPrimary: true,
        verificationToken: true,
        verifiedAt: true,
        sslStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, item };
  }

  async update(centerId: string, domainId: string, isPrimary: boolean) {
    const db = await this.prisma.getClient();
    const domain = await db.domain.findFirst({
      where: { id: domainId, centerId },
    });
    if (!domain) throw new NotFoundException('Domain not found.');

    if (isPrimary) {
      if (domain.status !== 'VERIFIED' && domain.status !== 'ACTIVE') {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: {
            isPrimary:
              'Only a verified or active domain can be set as primary.',
          },
        });
      }
      await db.$transaction([
        db.domain.updateMany({
          where: { centerId, isPrimary: true },
          data: { isPrimary: false },
        }),
        db.domain.update({
          where: { id: domainId },
          data: { isPrimary: true },
        }),
      ]);
    }

    const item = await db.domain.findUnique({
      where: { id: domainId },
      select: {
        id: true,
        hostname: true,
        type: true,
        status: true,
        isPrimary: true,
        verificationToken: true,
        verifiedAt: true,
        sslStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, item };
  }

  async delete(centerId: string, domainId: string) {
    const db = await this.prisma.getClient();
    const domain = await db.domain.findFirst({
      where: { id: domainId, centerId },
    });
    if (!domain) throw new NotFoundException('Domain not found.');

    if (domain.isPrimary) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          isPrimary:
            'Cannot delete the primary domain. Change the primary domain first.',
        },
      });
    }

    await db.domain.delete({ where: { id: domainId } });
    return { success: true };
  }

  async verify(centerId: string, domainId: string) {
    const db = await this.prisma.getClient();
    const domain = await db.domain.findFirst({
      where: { id: domainId, centerId },
    });
    if (!domain) throw new NotFoundException('Domain not found.');

    if (!domain.verificationToken) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { domainId: 'No verification token found for this domain.' },
      });
    }

    if (domain.status === 'ACTIVE' || domain.status === 'VERIFIED') {
      const item = await db.domain.findUnique({ where: { id: domainId } });
      return { success: true, verified: true, item };
    }

    const txtHost = `_royalcare-verify.${domain.hostname}`;
    let verified = false;

    try {
      const records: string[][] = await dns.resolveTxt(txtHost);
      const flat = records.flat();
      verified = flat.some((r) => r === domain.verificationToken);
    } catch {
      /* DNS resolution failure counts as not verified yet */
    }

    if (!verified) {
      return {
        success: true,
        verified: false,
        instructions: {
          recordType: 'TXT',
          host: txtHost,
          value: domain.verificationToken,
        },
      };
    }

    const item = await db.domain.update({
      where: { id: domainId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
      select: {
        id: true,
        hostname: true,
        type: true,
        status: true,
        isPrimary: true,
        verificationToken: true,
        verifiedAt: true,
        sslStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, verified: true, item };
  }

  async publicLookup(hostname: string) {
    if (!hostname) return { slug: null };
    const cleaned = hostname.trim().toLowerCase().split(':')[0];

    const db = await this.prisma.getClient();
    const domain = await db.domain.findFirst({
      where: {
        hostname: cleaned,
        status: { in: ['VERIFIED', 'ACTIVE'] },
        center: {
          status: 'ACTIVE',
          subscriptions: {
            some: publicDomainSubscriptionWhere(),
          },
        },
      },
      select: {
        center: { select: { slug: true } },
      },
    });

    return { slug: domain?.center.slug ?? null };
  }
}
