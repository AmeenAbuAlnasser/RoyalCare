import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  platformSessionCookieName,
  verifyPlatformSessionToken,
} from '../../auth/services/platform-session.service';
import { requiredPermissionsMetadataKey } from '../decorators/require-permissions.decorator';
import type { PlatformPermissionKey } from '../services/platform-permissions';
import { PermissionsService } from '../services/permissions.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredPermissions =
      this.reflector.getAllAndOverride<PlatformPermissionKey[]>(
        requiredPermissionsMetadataKey,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Prefer platform session cookie over legacy header
    const platformToken = getCookie(request, platformSessionCookieName);
    const platformPayload = verifyPlatformSessionToken(platformToken);
    const userId = platformPayload?.userId;

    if (!userId) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: {
          permission: `Missing required permission: ${requiredPermissions.join(', ')}`,
        },
      });
    }

    const hasPermissions = await this.permissionsService.userHasPermissions(
      userId,
      requiredPermissions,
    );

    if (!hasPermissions) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: {
          permission: `Missing required permission: ${requiredPermissions.join(', ')}`,
        },
      });
    }

    return true;
  }
}
