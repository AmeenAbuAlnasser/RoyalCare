import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";

type StaffPermission =
  | "staff.view"
  | "staff.create"
  | "staff.update"
  | "staff.activate";

const rolePermissions: Record<CenterRoleKey, StaffPermission[]> = {
  CENTER_OWNER: ["staff.view", "staff.create", "staff.update", "staff.activate"],
  CENTER_MANAGER: [
    "staff.view",
    "staff.create",
    "staff.update",
    "staff.activate",
  ],
  DOCTOR: ["staff.view"],
  RECEPTIONIST: ["staff.view"],
  ACCOUNTANT: ["staff.view"],
  STAFF: ["staff.view"],
};

export function hasTenantStaffPermission(
  role: CenterRoleKey,
  permission: StaffPermission,
) {
  return rolePermissions[role]?.includes(permission) ?? false;
}
