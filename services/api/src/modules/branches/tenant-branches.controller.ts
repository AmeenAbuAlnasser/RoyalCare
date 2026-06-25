import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../common/database/prisma.service';
import { CenterAuthService } from '../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * Lightweight, session-gated list of the center's active branches. Used by the
 * shared BranchFilter component on every tenant management page, so it requires
 * no specific permission beyond a valid center session (branch names/addresses
 * are non-sensitive and already public on the center website).
 */
@Controller('tenant/branches')
export class TenantBranchesController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@Req() request: Request) {
    const session = await this.getSession(request);
    const db = await this.prisma.getClient();
    const branches = await db.centerBranch.findMany({
      where: { centerId: session.center.id, isActive: true },
      orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        cityAr: true,
        cityEn: true,
        cityHe: true,
        addressAr: true,
        addressEn: true,
        addressHe: true,
        isMain: true,
      },
    });
    return { branches };
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
