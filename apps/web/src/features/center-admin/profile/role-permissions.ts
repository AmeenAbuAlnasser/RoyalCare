import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";

export type PermissionKey =
  | "patients:view"
  | "patients:create"
  | "patients:update"
  | "patients:status"
  | "staff:view"
  | "staff:create"
  | "staff:update"
  | "staff:status"
  | "services:view"
  | "services:create"
  | "services:update"
  | "services:archive"
  | "services:status"
  | "appointments:view"
  | "appointments:create"
  | "appointments:update"
  | "appointments:cancel"
  | "appointments:status"
  | "billing:view"
  | "billing:create"
  | "billing:update"
  | "billing:cancel"
  | "payments:view"
  | "payments:create"
  | "expenses:view"
  | "expenses:create"
  | "expenses:edit"
  | "expenses:delete"
  | "expenses:reports"
  | "reports:view"
  | "settings:view"
  | "permissions:view"
  | "permissions:update";

export type PermissionGroup = {
  sectionKey:
    | "patients"
    | "staff"
    | "services"
    | "appointments"
    | "billing"
    | "payments"
    | "expenses"
    | "reports"
    | "settings"
    | "permissions";
  permissions: PermissionKey[];
};

const sectionOrder: PermissionGroup["sectionKey"][] = [
  "patients",
  "staff",
  "services",
  "appointments",
  "billing",
  "payments",
  "expenses",
  "reports",
  "settings",
  "permissions",
];

const allPermissionKeys: PermissionKey[] = [
  "patients:view",
  "patients:create",
  "patients:update",
  "patients:status",
  "staff:view",
  "staff:create",
  "staff:update",
  "staff:status",
  "services:view",
  "services:create",
  "services:update",
  "services:archive",
  "services:status",
  "appointments:view",
  "appointments:create",
  "appointments:update",
  "appointments:cancel",
  "appointments:status",
  "billing:view",
  "billing:create",
  "billing:update",
  "billing:cancel",
  "payments:view",
  "payments:create",
  "expenses:view",
  "expenses:create",
  "expenses:edit",
  "expenses:delete",
  "expenses:reports",
  "reports:view",
  "settings:view",
  "permissions:view",
  "permissions:update",
];

const defaultRolePermissions: Record<CenterRoleKey, PermissionKey[]> = {
  CENTER_OWNER: allPermissionKeys,
  CENTER_MANAGER: allPermissionKeys,
  DOCTOR: [
    "staff:view",
    "services:view",
    "appointments:view",
    "appointments:update",
    "appointments:status",
    "payments:view",
  ],
  RECEPTIONIST: [
    "staff:view",
    "services:view",
    "appointments:view",
    "appointments:create",
    "appointments:update",
    "appointments:cancel",
    "appointments:status",
    "billing:view",
    "billing:create",
    "payments:view",
    "payments:create",
    "expenses:view",
    "expenses:create",
    "expenses:edit",
    "expenses:reports",
  ],
  ACCOUNTANT: [
    "staff:view",
    "services:view",
    "appointments:view",
    "billing:view",
    "billing:create",
    "billing:update",
    "payments:view",
    "payments:create",
    "expenses:view",
    "expenses:create",
    "expenses:edit",
    "expenses:reports",
  ],
  STAFF: [
    "staff:view",
    "services:view",
    "appointments:view",
    "billing:view",
    "payments:view",
  ],
};

export function getPermissionGroups(
  permissionsOrRole: readonly string[] | CenterRoleKey,
): PermissionGroup[] {
  const source =
    typeof permissionsOrRole === "string"
      ? defaultRolePermissions[permissionsOrRole]
      : permissionsOrRole;
  const perms = source.filter((permission): permission is PermissionKey =>
    Object.prototype.hasOwnProperty.call(permKeyToDictKey, permission),
  );

  return sectionOrder
    .map((sectionKey) => ({
      sectionKey,
      permissions: perms.filter((p) => p.startsWith(`${sectionKey}:`)),
    }))
    .filter((group) => group.permissions.length > 0);
}

// Maps PermissionKey to the dictionary key in permissionLabels
export const permKeyToDictKey: Record<PermissionKey, string> = {
  "staff:view": "staffView",
  "staff:create": "staffCreate",
  "staff:update": "staffUpdate",
  "staff:status": "staffActivate",
  "services:view": "servicesView",
  "services:create": "servicesCreate",
  "services:update": "servicesUpdate",
  "services:archive": "servicesArchive",
  "services:status": "servicesActivate",
  "appointments:view": "appointmentsView",
  "appointments:create": "appointmentsCreate",
  "appointments:update": "appointmentsUpdate",
  "appointments:cancel": "appointmentsCancel",
  "appointments:status": "appointmentsStatusUpdate",
  "billing:view": "billingView",
  "billing:create": "billingCreate",
  "billing:update": "billingUpdate",
  "billing:cancel": "billingMarkPaid",
  "payments:view": "paymentsView",
  "payments:create": "paymentsCreate",
  "expenses:view": "expensesView",
  "expenses:create": "expensesCreate",
  "expenses:edit": "expensesEdit",
  "expenses:delete": "expensesDelete",
  "expenses:reports": "expensesReports",
  "patients:view": "patientsView",
  "patients:create": "patientsCreate",
  "patients:update": "patientsUpdate",
  "patients:status": "patientsStatus",
  "reports:view": "reportsView",
  "settings:view": "settingsView",
  "permissions:view": "permissionsView",
  "permissions:update": "permissionsUpdate",
};
