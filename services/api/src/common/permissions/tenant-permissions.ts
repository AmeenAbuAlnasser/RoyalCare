import { AsyncLocalStorage } from 'node:async_hooks';

export const tenantPermissionKeys = [
  'patients:view',
  'patients:create',
  'patients:update',
  'patients:status',
  'patients:delete',
  'appointments:view',
  'appointments:create',
  'appointments:update',
  'appointments:cancel',
  'appointments:status',
  'services:view',
  'services:create',
  'services:update',
  'services:archive',
  'services:status',
  'services:delete',
  'billing:view',
  'billing:create',
  'billing:update',
  'billing:cancel',
  'payments:view',
  'payments:create',
  'expenses:view',
  'expenses:create',
  'expenses:edit',
  'expenses:delete',
  'expenses:reports',
  'reports:view',
  'settings:view',
  'permissions:view',
  'permissions:update',
  'staff:view',
  'staff:create',
  'staff:update',
  'staff:status',
] as const;

export type TenantPermissionKey = (typeof tenantPermissionKeys)[number];

type TenantPermissionDebugContext = {
  centerId: string;
  roleKey: string;
  userId: string;
};

const tenantPermissionDebugStorage =
  new AsyncLocalStorage<TenantPermissionDebugContext>();

export function setTenantPermissionDebugContext(
  context: TenantPermissionDebugContext,
) {
  if (process.env.NODE_ENV !== 'production') {
    tenantPermissionDebugStorage.enterWith(context);
  }
}

export const legacyTenantPermissionKeyMap: Record<string, TenantPermissionKey> =
  {
    'patients.view': 'patients:view',
    'patients.create': 'patients:create',
    'patients.update': 'patients:update',
    'patients.delete': 'patients:status',
    'patients.status': 'patients:status',
    'appointments.view': 'appointments:view',
    'appointments.create': 'appointments:create',
    'appointments.update': 'appointments:update',
    'appointments.cancel': 'appointments:cancel',
    'appointments.status.update': 'appointments:status',
    'appointments.status': 'appointments:status',
    'services.view': 'services:view',
    'services.create': 'services:create',
    'services.update': 'services:update',
    'services.archive': 'services:archive',
    'services.activate': 'services:status',
    'services.delete': 'services:delete',
    'services.status': 'services:status',
    'billing.view': 'billing:view',
    'billing.create': 'billing:create',
    'billing.update': 'billing:update',
    'billing.mark_paid': 'billing:update',
    'billing.mark-paid': 'billing:update',
    'billing.cancel': 'billing:cancel',
    'payments.view': 'payments:view',
    'payments.create': 'payments:create',
    'expenses.view': 'expenses:view',
    'expenses.create': 'expenses:create',
    'expenses.edit': 'expenses:edit',
    'expenses.update': 'expenses:edit',
    'expenses.delete': 'expenses:delete',
    'expenses.reports': 'expenses:reports',
    'reports.view': 'reports:view',
    'settings.view': 'settings:view',
    'permissions.view': 'permissions:view',
    'permissions.update': 'permissions:update',
    'staff.view': 'staff:view',
    'staff.create': 'staff:create',
    'staff.update': 'staff:update',
    'staff.delete': 'staff:status',
    'staff.activate': 'staff:status',
    'staff.status': 'staff:status',
  };

export function normalizeTenantPermissionKey(
  permission: string,
): TenantPermissionKey | null {
  if ((tenantPermissionKeys as readonly string[]).includes(permission)) {
    return permission as TenantPermissionKey;
  }

  return legacyTenantPermissionKeyMap[permission] ?? null;
}

export function normalizeTenantPermissionKeys(
  permissions: readonly string[],
): TenantPermissionKey[] {
  return Array.from(
    new Set(
      permissions
        .map((permission) => normalizeTenantPermissionKey(permission))
        .filter((permission): permission is TenantPermissionKey =>
          Boolean(permission),
        ),
    ),
  ).sort();
}

export function hasTenantPermission(
  permissions: readonly string[],
  permission: TenantPermissionKey,
) {
  const effectivePermissions = normalizeTenantPermissionKeys(permissions);
  const allowed = effectivePermissions.includes(permission);

  if (!allowed && process.env.NODE_ENV !== 'production') {
    console.warn('[tenant-rbac] permission denied', {
      ...tenantPermissionDebugStorage.getStore(),
      effectivePermissions,
      requiredPermission: permission,
    });
  }

  return allowed;
}
