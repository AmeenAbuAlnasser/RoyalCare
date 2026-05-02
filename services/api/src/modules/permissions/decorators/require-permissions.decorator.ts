import { SetMetadata } from '@nestjs/common';
import type { PlatformPermissionKey } from '../services/platform-permissions';

export const requiredPermissionsMetadataKey = 'royalcare:requiredPermissions';

export function RequirePermissions(...permissions: PlatformPermissionKey[]) {
  return SetMetadata(requiredPermissionsMetadataKey, permissions);
}
