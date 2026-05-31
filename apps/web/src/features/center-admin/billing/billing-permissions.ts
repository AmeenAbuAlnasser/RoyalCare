type BillingPermission =
  | "billing:view"
  | "billing:create"
  | "billing:update"
  | "billing:cancel";

type PaymentPermission = "payments:view" | "payments:create";

export function hasBillingPermission(
  permissions: readonly string[] | undefined,
  permission: BillingPermission,
): boolean {
  return permissions?.includes(permission) ?? false;
}

export function hasPaymentPermission(
  permissions: readonly string[] | undefined,
  permission: PaymentPermission,
): boolean {
  return permissions?.includes(permission) ?? false;
}

// Manual credit add uses the same privileged billing action as marking paid.
export function canAddManualCredit(permissions: readonly string[] | undefined): boolean {
  return hasBillingPermission(permissions, "billing:update");
}
