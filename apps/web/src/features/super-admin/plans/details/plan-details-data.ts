import { planRows } from "../plans-data";

export type PlanDetails = (typeof planRows)[number] & {
  apiAccess: boolean;
  customDomainSupport: boolean;
  currentSubscribers: number;
  emailNotifications: boolean;
  lastUpdated: string;
  maxAppointments: number;
  maxCustomers: number;
  recentSubscribers: Array<"alNoorHijama" | "balancePhysio" | "glowBeauty" | "novaLaser" | "wellnessHouse">;
  recommendedUpgradePath: "enterprise" | "professional" | "starter";
  revenueContribution: number;
  setupFee: number;
  smsNotifications: boolean;
  storageLimitGb: number;
  createdDate: string;
  whatsAppNotifications: boolean;
  lowerPlan?: "starter" | "professional" | "trial";
  higherPlan?: "enterprise" | "professional" | "starter";
};

export const planDetailsById: Record<string, PlanDetails> = {
  "1": {
    ...planRows[0],
    apiAccess: false,
    createdDate: "2026-01-10",
    customDomainSupport: false,
    currentSubscribers: 18,
    emailNotifications: true,
    higherPlan: "starter",
    lastUpdated: "2026-03-28",
    maxAppointments: 120,
    maxCustomers: 250,
    recentSubscribers: ["alNoorHijama", "wellnessHouse", "glowBeauty"],
    recommendedUpgradePath: "starter",
    revenueContribution: 0,
    setupFee: 0,
    smsNotifications: false,
    storageLimitGb: 2,
    whatsAppNotifications: false,
  },
  "2": {
    ...planRows[1],
    apiAccess: false,
    createdDate: "2026-01-15",
    customDomainSupport: true,
    currentSubscribers: 42,
    emailNotifications: true,
    higherPlan: "professional",
    lastUpdated: "2026-04-01",
    lowerPlan: "trial",
    maxAppointments: 850,
    maxCustomers: 2500,
    recentSubscribers: ["novaLaser", "alNoorHijama", "balancePhysio"],
    recommendedUpgradePath: "professional",
    revenueContribution: 7560,
    setupFee: 120,
    smsNotifications: true,
    storageLimitGb: 20,
    whatsAppNotifications: true,
  },
  "3": {
    ...planRows[2],
    apiAccess: true,
    createdDate: "2026-01-22",
    customDomainSupport: true,
    currentSubscribers: 31,
    emailNotifications: true,
    higherPlan: "enterprise",
    lastUpdated: "2026-04-12",
    lowerPlan: "starter",
    maxAppointments: 5000,
    maxCustomers: 15000,
    recentSubscribers: ["balancePhysio", "glowBeauty", "novaLaser"],
    recommendedUpgradePath: "enterprise",
    revenueContribution: 13020,
    setupFee: 250,
    smsNotifications: true,
    storageLimitGb: 80,
    whatsAppNotifications: true,
  },
  "4": {
    ...planRows[3],
    apiAccess: true,
    createdDate: "2026-02-02",
    customDomainSupport: true,
    currentSubscribers: 7,
    emailNotifications: true,
    lastUpdated: "2026-04-18",
    lowerPlan: "professional",
    maxAppointments: 50000,
    maxCustomers: 100000,
    recentSubscribers: ["wellnessHouse", "novaLaser", "glowBeauty"],
    recommendedUpgradePath: "enterprise",
    revenueContribution: 6650,
    setupFee: 700,
    smsNotifications: true,
    storageLimitGb: 500,
    whatsAppNotifications: true,
  },
};
