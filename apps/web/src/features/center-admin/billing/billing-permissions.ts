type BillingPermission =
  | "billing.view"
  | "billing.create"
  | "billing.update"
  | "billing.mark_paid";

type PaymentPermission = "payments.view" | "payments.create";

const rolePermissions: Record<string, BillingPermission[]> = {
  CENTER_OWNER: [
    "billing.view",
    "billing.create",
    "billing.update",
    "billing.mark_paid",
  ],
  CENTER_MANAGER: [
    "billing.view",
    "billing.create",
    "billing.update",
    "billing.mark_paid",
  ],
  ACCOUNTANT: [
    "billing.view",
    "billing.create",
    "billing.update",
    "billing.mark_paid",
  ],
  RECEPTIONIST: ["billing.view", "billing.create"],
  DOCTOR: ["billing.view"],
  STAFF: ["billing.view"],
};

const paymentRolePermissions: Record<string, PaymentPermission[]> = {
  CENTER_OWNER: ["payments.view", "payments.create"],
  CENTER_MANAGER: ["payments.view", "payments.create"],
  ACCOUNTANT: ["payments.view", "payments.create"],
  RECEPTIONIST: ["payments.view", "payments.create"],
  DOCTOR: ["payments.view"],
  STAFF: ["payments.view"],
};

export function hasBillingPermission(
  roleKey: string,
  permission: BillingPermission,
): boolean {
  return rolePermissions[roleKey]?.includes(permission) ?? false;
}

export function hasPaymentPermission(
  roleKey: string,
  permission: PaymentPermission,
): boolean {
  return paymentRolePermissions[roleKey]?.includes(permission) ?? false;
}

// Manual credit add requires billing.mark_paid (owner/manager/accountant)
export function canAddManualCredit(roleKey: string): boolean {
  return ["CENTER_OWNER", "CENTER_MANAGER", "ACCOUNTANT"].includes(roleKey);
}
