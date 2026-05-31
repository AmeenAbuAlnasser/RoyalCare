type StaffPermission =
  | "staff:view"
  | "staff:create"
  | "staff:update"
  | "staff:status";

export function hasTenantStaffPermission(
  permissions: readonly string[] | undefined,
  permission: StaffPermission,
) {
  return permissions?.includes(permission) ?? false;
}
