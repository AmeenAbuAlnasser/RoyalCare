export const centerDetailsById = {
  "1": {
    accountStatus: "active",
    adminEmail: "maya.admin@novalaser.co.il",
    adminMobile: "+972 54 220 1188",
    adminName: "Maya Cohen",
    autoRenewal: true,
    centerNameKey: "novaLaser",
    centerTypeKey: "medicalCenter",
    createdDate: "2026-01-14",
    customDomain: "novalaser.co.il",
    defaultLanguage: "he",
    domainStatus: "verified",
    enabledLanguages: ["he", "ar", "en"],
    expiryDate: "2026-06-18",
    lastLogin: "2026-04-24",
    logoInitials: "NL",
    ownerNameKey: "mayaCohen",
    permissionsPreset: "fullAccess",
    planKey: "professional",
    primaryColor: "#0B2D5C",
    secondaryColor: "#C8A45D",
    servicesOffered: ["laser", "skinCare", "beauty"],
    startDate: "2026-01-18",
    status: "active",
    subdomain: "novalaser.royalcare.app",
  },
  "2": {
    accountStatus: "pendingActivation",
    adminEmail: "admin@alnoorhijama.com",
    adminMobile: "+972 52 450 8821",
    adminName: "Omar Haddad",
    autoRenewal: false,
    centerNameKey: "alNoorHijama",
    centerTypeKey: "wellnessCenter",
    createdDate: "2026-02-02",
    customDomain: "alnoorhijama.com",
    defaultLanguage: "ar",
    domainStatus: "pending",
    enabledLanguages: ["ar", "he", "en"],
    expiryDate: "2026-05-04",
    lastLogin: "2026-04-19",
    logoInitials: "AN",
    ownerNameKey: "omarHaddad",
    permissionsPreset: "standardManagement",
    planKey: "starter",
    primaryColor: "#0B2D5C",
    secondaryColor: "#C8A45D",
    servicesOffered: ["hijama", "massage", "nutrition"],
    startDate: "2026-02-04",
    status: "trial",
    subdomain: "alnoor.royalcare.app",
  },
  "3": {
    accountStatus: "active",
    adminEmail: "admin@balance-physio.co.il",
    adminMobile: "+972 50 771 4432",
    adminName: "Dana Levi",
    autoRenewal: false,
    centerNameKey: "balancePhysio",
    centerTypeKey: "medicalCenter",
    createdDate: "2025-11-22",
    customDomain: "balance-physio.co.il",
    defaultLanguage: "he",
    domainStatus: "verified",
    enabledLanguages: ["he", "en"],
    expiryDate: "2026-04-12",
    lastLogin: "2026-04-10",
    logoInitials: "BP",
    ownerNameKey: "danaLevi",
    permissionsPreset: "fullAccess",
    planKey: "professional",
    primaryColor: "#164E63",
    secondaryColor: "#C8A45D",
    servicesOffered: ["physiotherapy", "occupationalTherapy", "rehabilitation"],
    startDate: "2025-12-12",
    status: "expired",
    subdomain: "balancephysio.royalcare.app",
  },
  "4": {
    accountStatus: "active",
    adminEmail: "admin@glowbeautyclinic.com",
    adminMobile: "+972 54 900 6401",
    adminName: "Lina Mansour",
    autoRenewal: true,
    centerNameKey: "glowBeauty",
    centerTypeKey: "beautyCenter",
    createdDate: "2026-01-30",
    customDomain: "glowbeautyclinic.com",
    defaultLanguage: "en",
    domainStatus: "verified",
    enabledLanguages: ["en", "ar", "he"],
    expiryDate: "2026-08-30",
    lastLogin: "2026-04-25",
    logoInitials: "GB",
    ownerNameKey: "linaMansour",
    permissionsPreset: "customPermissions",
    planKey: "enterprise",
    primaryColor: "#0B2D5C",
    secondaryColor: "#C8A45D",
    servicesOffered: ["beauty", "skinCare", "laser"],
    startDate: "2026-02-01",
    status: "active",
    subdomain: "glowbeauty.royalcare.app",
  },
  "5": {
    accountStatus: "pendingActivation",
    adminEmail: "admin@wellness-house.co.il",
    adminMobile: "+972 53 118 7780",
    adminName: "Noam Bar",
    autoRenewal: false,
    centerNameKey: "wellnessHouse",
    centerTypeKey: "wellnessCenter",
    createdDate: "2025-10-08",
    customDomain: "wellness-house.co.il",
    defaultLanguage: "he",
    domainStatus: "failed",
    enabledLanguages: ["he", "en"],
    expiryDate: "2026-03-28",
    lastLogin: "2026-03-12",
    logoInitials: "WH",
    ownerNameKey: "noamBar",
    permissionsPreset: "limitedAccess",
    planKey: "starter",
    primaryColor: "#0B2D5C",
    secondaryColor: "#C8A45D",
    servicesOffered: ["massage", "nutrition", "rehabilitation"],
    startDate: "2025-10-28",
    status: "suspended",
    subdomain: "wellnesshouse.royalcare.app",
  },
} as const;

export type CenterDetails = {
  accountStatus: "active" | "pendingActivation";
  adminEmail: string;
  adminMobile: string;
  adminName: string;
  autoRenewal: boolean;
  centerName?: string;
  centerNameKey?: "novaLaser" | "alNoorHijama" | "balancePhysio" | "glowBeauty" | "wellnessHouse";
  centerTypeKey:
    | "medicalCenter"
    | "beautyCenter"
    | "wellnessCenter"
    | "multiSpecialtyCenter"
    | "other";
  createdDate: string;
  customDomain: string;
  defaultLanguage: "ar" | "he" | "en";
  domainStatus: "pending" | "verified" | "failed";
  enabledLanguages: ReadonlyArray<"ar" | "he" | "en">;
  expiryDate: string;
  lastLogin: string;
  logoInitials: string;
  ownerName?: string;
  ownerNameKey?: "mayaCohen" | "omarHaddad" | "danaLevi" | "linaMansour" | "noamBar";
  permissionsPreset:
    | "fullAccess"
    | "standardManagement"
    | "limitedAccess"
    | "customPermissions";
  planKey: "trial" | "starter" | "professional" | "enterprise";
  primaryColor: string;
  secondaryColor: string;
  servicesOffered: ReadonlyArray<
    | "laser"
    | "hijama"
    | "physiotherapy"
    | "occupationalTherapy"
    | "beauty"
    | "skinCare"
    | "massage"
    | "nutrition"
    | "rehabilitation"
    | "other"
  >;
  startDate: string;
  status: "active" | "trial" | "expired" | "suspended";
  subdomain: string;
};

export const activityTimeline = [
  {
    key: "centerCreated",
    date: "2026-01-14",
  },
  {
    key: "subscriptionRenewed",
    date: "2026-03-18",
  },
  {
    key: "domainVerified",
    date: "2026-03-20",
  },
  {
    key: "adminUpdated",
    date: "2026-04-08",
  },
  {
    key: "paymentReceived",
    date: "2026-04-18",
  },
] as const;
