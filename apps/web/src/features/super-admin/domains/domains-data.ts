export const domainStats = [
  { key: "totalDomains", value: 128 },
  { key: "verifiedDomains", value: 103 },
  { key: "pendingVerification", value: 14 },
  { key: "failedVerification", value: 6 },
  { key: "expiringSsl", value: 9 },
] as const;

export const domainRows = [
  {
    id: "1",
    centerNameKey: "novaLaser",
    ownerNameKey: "mayaCohen",
    domainName: "novalaser.co.il",
    type: "custom",
    verificationStatus: "verified",
    dnsStatus: "healthy",
    sslStatus: "valid",
    addedDate: "2026-01-18",
    lastChecked: "2026-04-27",
    status: "active",
    health: "healthy",
  },
  {
    id: "2",
    centerNameKey: "alNoorHijama",
    ownerNameKey: "omarHaddad",
    domainName: "alnoor.royalcare.app",
    type: "subdomain",
    verificationStatus: "pending",
    dnsStatus: "warning",
    sslStatus: "pending",
    addedDate: "2026-02-04",
    lastChecked: "2026-04-26",
    status: "pending",
    health: "warning",
  },
  {
    id: "3",
    centerNameKey: "balancePhysio",
    ownerNameKey: "danaLevi",
    domainName: "balance-physio.co.il",
    type: "custom",
    verificationStatus: "failed",
    dnsStatus: "critical",
    sslStatus: "failed",
    addedDate: "2025-12-12",
    lastChecked: "2026-04-25",
    status: "failed",
    health: "critical",
  },
  {
    id: "4",
    centerNameKey: "glowBeauty",
    ownerNameKey: "linaMansour",
    domainName: "glowbeautyclinic.com",
    type: "custom",
    verificationStatus: "verified",
    dnsStatus: "healthy",
    sslStatus: "expiringSoon",
    addedDate: "2026-02-01",
    lastChecked: "2026-04-27",
    status: "active",
    health: "warning",
  },
  {
    id: "5",
    centerNameKey: "wellnessHouse",
    ownerNameKey: "noamBar",
    domainName: "wellness-house.co.il",
    type: "custom",
    verificationStatus: "suspended",
    dnsStatus: "warning",
    sslStatus: "expired",
    addedDate: "2025-10-28",
    lastChecked: "2026-04-20",
    status: "suspended",
    health: "critical",
  },
] as const;

export const pendingVerificationRows = domainRows.filter(
  (row) => row.verificationStatus === "pending",
);

export const sslExpiryRows = domainRows.filter((row) =>
  ["expiringSoon", "expired"].includes(row.sslStatus),
);

export const verificationFilters = [
  "verified",
  "pending",
  "failed",
  "suspended",
  "sslExpiringSoon",
] as const;
