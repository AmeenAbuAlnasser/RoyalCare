import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";

export type TenantServicePermission =
  | "services.view"
  | "services.create"
  | "services.update"
  | "services.archive"
  | "services.activate";

const permissionsByRole: Record<CenterRoleKey, TenantServicePermission[]> = {
  CENTER_OWNER: [
    "services.view",
    "services.create",
    "services.update",
    "services.archive",
    "services.activate",
  ],
  CENTER_MANAGER: [
    "services.view",
    "services.create",
    "services.update",
    "services.archive",
    "services.activate",
  ],
  DOCTOR: ["services.view"],
  RECEPTIONIST: ["services.view"],
  ACCOUNTANT: ["services.view"],
  STAFF: ["services.view"],
};

export function hasTenantServicePermission(
  role: CenterRoleKey,
  permission: TenantServicePermission,
) {
  return permissionsByRole[role].includes(permission);
}
