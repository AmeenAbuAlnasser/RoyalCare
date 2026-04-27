export const subscriptionStats = [
  { key: "activeSubscriptions", value: 94 },
  { key: "trialSubscriptions", value: 19 },
  { key: "expiringSoon", value: 12 },
  { key: "expiredSubscriptions", value: 8 },
  { key: "monthlyRevenue", value: 42800, type: "money" },
] as const;

export const revenueSnapshot = [
  { key: "mrr", value: 42800 },
  { key: "arr", value: 513600 },
  { key: "pendingPayments", value: 6200 },
  { key: "failedRenewals", value: 4, type: "count" },
] as const;

export const subscriptionsRows = [
  {
    id: "1",
    centerNameKey: "novaLaser",
    ownerNameKey: "mayaCohen",
    planKey: "professional",
    billingCycle: "monthly",
    startDate: "2026-01-18",
    expiryDate: "2026-06-18",
    autoRenewal: true,
    paymentStatus: "paid",
    monthlyValue: 420,
    status: "active",
    domain: "novalaser.co.il",
    expiringBucket: "30",
  },
  {
    id: "2",
    centerNameKey: "alNoorHijama",
    ownerNameKey: "omarHaddad",
    planKey: "starter",
    billingCycle: "monthly",
    startDate: "2026-02-04",
    expiryDate: "2026-05-04",
    autoRenewal: false,
    paymentStatus: "pending",
    monthlyValue: 180,
    status: "trial",
    domain: "alnoorhijama.com",
    expiringBucket: "14",
  },
  {
    id: "3",
    centerNameKey: "balancePhysio",
    ownerNameKey: "danaLevi",
    planKey: "professional",
    billingCycle: "yearly",
    startDate: "2025-12-12",
    expiryDate: "2026-04-12",
    autoRenewal: false,
    paymentStatus: "failed",
    monthlyValue: 420,
    status: "expired",
    domain: "balance-physio.co.il",
    expiringBucket: "expired",
  },
  {
    id: "4",
    centerNameKey: "glowBeauty",
    ownerNameKey: "linaMansour",
    planKey: "enterprise",
    billingCycle: "yearly",
    startDate: "2026-02-01",
    expiryDate: "2026-08-30",
    autoRenewal: true,
    paymentStatus: "paid",
    monthlyValue: 950,
    status: "active",
    domain: "glowbeautyclinic.com",
    expiringBucket: "none",
  },
  {
    id: "5",
    centerNameKey: "wellnessHouse",
    ownerNameKey: "noamBar",
    planKey: "starter",
    billingCycle: "monthly",
    startDate: "2025-10-28",
    expiryDate: "2026-03-28",
    autoRenewal: false,
    paymentStatus: "failed",
    monthlyValue: 180,
    status: "suspended",
    domain: "wellness-house.co.il",
    expiringBucket: "expired",
  },
] as const;

export const expiringSoonRows = subscriptionsRows.filter((row) =>
  ["7", "14", "30"].includes(row.expiringBucket),
);

export const statusFilters = ["active", "trial", "expired", "suspended"] as const;
export const autoRenewalFilters = ["all", "on", "off"] as const;
export const planFilters = ["all", "trial", "starter", "professional", "enterprise"] as const;
export const dateRangeFilters = ["all", "7", "14", "30"] as const;
