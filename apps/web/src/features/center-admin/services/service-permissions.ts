export type TenantServicePermission =
  | "services:view"
  | "services:create"
  | "services:update"
  | "services:archive"
  | "services:status"
  | "services:delete";

export function hasTenantServicePermission(
  permissions: readonly string[] | undefined,
  permission: TenantServicePermission,
) {
  return permissions?.includes(permission) ?? false;
}
