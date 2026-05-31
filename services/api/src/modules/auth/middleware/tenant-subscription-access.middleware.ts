import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../services/center-session.service';
import { TenantSubscriptionAccessService } from '../services/tenant-subscription-access.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function isWriteMethod(method: string) {
  return ['DELETE', 'PATCH', 'POST', 'PUT'].includes(method.toUpperCase());
}

function isAllowedTenantWritePath(path: string) {
  return (
    path.includes('/tenant/subscription/renewal-request') ||
    path.includes('/auth/center/logout')
  );
}

@Injectable()
export class TenantSubscriptionAccessMiddleware implements NestMiddleware {
  constructor(
    private readonly subscriptionAccess: TenantSubscriptionAccessService,
  ) {}

  async use(request: Request, _response: Response, next: NextFunction) {
    if (
      !isWriteMethod(request.method) ||
      isAllowedTenantWritePath(request.originalUrl)
    ) {
      next();
      return;
    }

    const token = getCookie(request, centerSessionCookieName);
    const payload = verifyCenterSessionToken(token);

    if (!payload?.centerId) {
      next();
      return;
    }

    await this.subscriptionAccess.assertCanWrite(payload.centerId);
    next();
  }
}
