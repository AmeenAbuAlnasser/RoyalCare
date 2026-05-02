import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";

export type TenantAppointmentPermission =
  | "appointments.view"
  | "appointments.create"
  | "appointments.update"
  | "appointments.cancel"
  | "appointments.status.update";

const rolePermissions: Record<CenterRoleKey, TenantAppointmentPermission[]> = {
  CENTER_OWNER: [
    "appointments.view",
    "appointments.create",
    "appointments.update",
    "appointments.cancel",
    "appointments.status.update",
  ],
  CENTER_MANAGER: [
    "appointments.view",
    "appointments.create",
    "appointments.update",
    "appointments.cancel",
    "appointments.status.update",
  ],
  DOCTOR: [
    "appointments.view",
    "appointments.update",
    "appointments.status.update",
  ],
  RECEPTIONIST: [
    "appointments.view",
    "appointments.create",
    "appointments.update",
    "appointments.cancel",
    "appointments.status.update",
  ],
  ACCOUNTANT: ["appointments.view"],
  STAFF: ["appointments.view"],
};

export function hasTenantAppointmentPermission(
  roleKey: CenterRoleKey,
  permission: TenantAppointmentPermission,
) {
  return rolePermissions[roleKey]?.includes(permission) ?? false;
}
