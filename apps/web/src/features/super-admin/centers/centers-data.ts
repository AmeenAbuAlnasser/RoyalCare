export const centerStatusFilters = [
  "active",
  "trial",
  "expired",
  "suspended",
] as const;

export const centersStats = [
  {
    key: "totalCenters",
    value: 128,
  },
  {
    key: "activeCenters",
    value: 94,
  },
  {
    key: "trialCenters",
    value: 19,
  },
  {
    key: "suspendedCenters",
    value: 7,
  },
] as const;

export const centersRows = [
  {
    centerNameKey: "novaLaser",
    ownerNameKey: "mayaCohen",
    typeKey: "laser",
    planKey: "professional",
    expiryDate: "2026-06-18",
    domain: "novalaser.co.il",
    status: "active",
  },
  {
    centerNameKey: "alNoorHijama",
    ownerNameKey: "omarHaddad",
    typeKey: "hijama",
    planKey: "starter",
    expiryDate: "2026-05-04",
    domain: "alnoorhijama.com",
    status: "trial",
  },
  {
    centerNameKey: "balancePhysio",
    ownerNameKey: "danaLevi",
    typeKey: "physiotherapy",
    planKey: "professional",
    expiryDate: "2026-04-12",
    domain: "balance-physio.co.il",
    status: "expired",
  },
  {
    centerNameKey: "glowBeauty",
    ownerNameKey: "linaMansour",
    typeKey: "beauty",
    planKey: "enterprise",
    expiryDate: "2026-08-30",
    domain: "glowbeautyclinic.com",
    status: "active",
  },
  {
    centerNameKey: "wellnessHouse",
    ownerNameKey: "noamBar",
    typeKey: "wellness",
    planKey: "starter",
    expiryDate: "2026-03-28",
    domain: "wellness-house.co.il",
    status: "suspended",
  },
] as const;
