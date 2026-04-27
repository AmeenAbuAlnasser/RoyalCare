export const overviewCards = [
  {
    key: "activeCenters",
    value: 128,
    change: 0.12,
    valueType: "number",
    changeType: "percent",
  },
  {
    key: "trialCenters",
    value: 19,
    change: 4,
    valueType: "number",
    changeType: "number",
  },
  {
    key: "monthlyRevenue",
    value: 42800,
    change: 0.082,
    valueType: "currency",
    changeType: "percent",
  },
  {
    key: "openDomainTasks",
    value: 7,
    change: -3,
    valueType: "number",
    changeType: "number",
  },
] as const;

export const quickStats = [
  {
    key: "newCenters",
    value: 14,
  },
  {
    key: "appointmentsToday",
    value: 842,
  },
  {
    key: "pendingVerifications",
    value: 6,
  },
  {
    key: "supportItems",
    value: 11,
  },
] as const;

export const recentCenters = [
  {
    nameKey: "novaLaser",
    ownerKey: "mayaCohen",
    status: "active",
    planKey: "professional",
  },
  {
    nameKey: "alNoorHijama",
    ownerKey: "omarHaddad",
    status: "trial",
    planKey: "starter",
  },
  {
    nameKey: "balancePhysio",
    ownerKey: "danaLevi",
    status: "pastDue",
    planKey: "professional",
  },
] as const;

export const subscriptionOverview = [
  {
    planKey: "professional",
    centers: 74,
    renewalCount: 18,
    status: "active",
  },
  {
    planKey: "starter",
    centers: 39,
    renewalCount: 9,
    status: "trial",
  },
  {
    planKey: "enterprise",
    centers: 15,
    renewalCount: 4,
    status: "active",
  },
] as const;

export const domainPreview = [
  {
    domain: "novalaser.co.il",
    issueKey: "primaryVerified",
    status: "verified",
  },
  {
    domain: "alnoorhijama.com",
    issueKey: "dnsPending",
    status: "pending",
  },
  {
    domain: "balance-physio.co.il",
    issueKey: "sslFailed",
    status: "failed",
  },
] as const;

export const notificationsPreview = [
  {
    titleKey: "subscriptionRenewalQueue",
    updatedMinutes: 12,
    status: "pending",
  },
  {
    titleKey: "domainVerificationCompleted",
    updatedMinutes: 28,
    status: "verified",
  },
  {
    titleKey: "pastDueCenterReview",
    updatedMinutes: 60,
    status: "pastDue",
  },
] as const;
