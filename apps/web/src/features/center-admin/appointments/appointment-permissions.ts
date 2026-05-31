export type TenantAppointmentPermission =
  | "appointments:view"
  | "appointments:create"
  | "appointments:update"
  | "appointments:cancel"
  | "appointments:status";

export function hasTenantAppointmentPermission(
  permissions: readonly string[] | undefined,
  permission: TenantAppointmentPermission,
) {
  return permissions?.includes(permission) ?? false;
}
