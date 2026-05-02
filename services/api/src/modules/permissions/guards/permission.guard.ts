import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { requiredPermissionsMetadataKey } from '../decorators/require-permissions.decorator';
import type { PlatformPermissionKey } from '../services/platform-permissions';
import { PermissionsService } from '../services/permissions.service';

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
    const userIdHeader = request.headers['x-royalcare-super-admin-user-id'];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
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
