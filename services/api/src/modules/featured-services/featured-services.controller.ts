import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PermissionsService } from '../permissions/services/permissions.service';
import { FeaturedServicesService } from './featured-services.service';

async function requireSuperAdmin(
  permissionsService: PermissionsService,
  userId?: string | string[],
) {
  const id = Array.isArray(userId) ? userId[0] : userId;
  if (!id)
    throw new ForbiddenException({
      message: 'Permission denied',
      errors: { role: 'SUPER_ADMIN role is required.' },
    });
  const ctx = await permissionsService.getUserPermissions(id);
  const isSuperAdmin = (ctx.roles as Array<{ key: string }>).some(
    (r) => r.key === 'super_admin',
  );
  if (!ctx.user || !isSuperAdmin)
    throw new ForbiddenException({
      message: 'Permission denied',
      errors: { role: 'SUPER_ADMIN role is required.' },
    });
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function toNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return toOptionalString(value);
}

@Controller('public/featured-services')
export class PublicFeaturedServicesController {
  constructor(private readonly svc: FeaturedServicesService) {}

  @Get()
  getPublic() {
    return this.svc.listPublic();
  }
}

@Controller('admin/featured-services')
export class AdminFeaturedServicesController {
  constructor(
    private readonly svc: FeaturedServicesService,
    private readonly permissions: PermissionsService,
  ) {}

  private auth(userId?: string | string[]) {
    return requireSuperAdmin(this.permissions, userId);
  }

  @Get()
  async list(@Headers('x-royalcare-super-admin-user-id') uid?: string) {
    await this.auth(uid);
    return this.svc.listAdmin();
  }

  @Post()
  async create(
    @Body() body: Record<string, unknown>,
    @Headers('x-royalcare-super-admin-user-id') uid?: string,
  ) {
    await this.auth(uid);
    return this.svc.create({
      titleAr: toOptionalString(body['titleAr']) ?? '',
      titleEn: toOptionalString(body['titleEn']) ?? '',
      titleHe: toOptionalString(body['titleHe']),
      descriptionAr: toOptionalString(body['descriptionAr']),
      descriptionEn: toOptionalString(body['descriptionEn']),
      descriptionHe: toOptionalString(body['descriptionHe']),
      imageUrl: toNullableString(body['imageUrl']),
      slug: toOptionalString(body['slug']),
      sortOrder:
        typeof body['sortOrder'] === 'number' ? body['sortOrder'] : undefined,
      isActive:
        typeof body['isActive'] === 'boolean' ? body['isActive'] : undefined,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-royalcare-super-admin-user-id') uid?: string,
  ) {
    await this.auth(uid);
    return this.svc.update(id, {
      titleAr: toOptionalString(body['titleAr']),
      titleEn: toOptionalString(body['titleEn']),
      titleHe: toOptionalString(body['titleHe']),
      descriptionAr: toOptionalString(body['descriptionAr']),
      descriptionEn: toOptionalString(body['descriptionEn']),
      descriptionHe: toOptionalString(body['descriptionHe']),
      imageUrl:
        'imageUrl' in body ? toNullableString(body['imageUrl']) : undefined,
      slug: toOptionalString(body['slug']),
      sortOrder:
        typeof body['sortOrder'] === 'number' ? body['sortOrder'] : undefined,
      isActive:
        typeof body['isActive'] === 'boolean' ? body['isActive'] : undefined,
    });
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-royalcare-super-admin-user-id') uid?: string,
  ) {
    await this.auth(uid);
    return this.svc.remove(id);
  }
}
