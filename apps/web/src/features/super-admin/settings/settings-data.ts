export const languageOptions = ["en", "ar", "he"] as const;

export const currencyOptions = ["USD", "ILS", "EUR"] as const;

export const timezoneOptions = [
  "Asia/Jerusalem",
  "Asia/Riyadh",
  "Europe/London",
  "UTC",
] as const;

export const dateFormatOptions = [
  "yyyy-mm-dd",
  "dd/mm/yyyy",
  "mm/dd/yyyy",
] as const;

export const platformSettings = {
  platformName: "RoyalCare",
  defaultLanguage: "en",
  supportedLanguages: ["ar", "he", "en"],
  defaultCurrency: "USD",
  timezone: "Asia/Jerusalem",
  dateFormat: "yyyy-mm-dd",
  primaryColor: "#0B2D5C",
  secondaryColor: "#C8A45D",
  emailBranding: "RoyalCare Platform",
  loginPageBranding: "RoyalCare Super Admin",
  passwordPolicy: "strong",
  sessionTimeout: 30,
  loginAttemptLimit: 5,
  defaultTrialDuration: 14,
  gracePeriod: 7,
  autoSuspensionRules: "afterGracePeriod",
  defaultSubdomainPattern: "{center}.royalcare.app",
  dnsVerificationRules: "aCnameTxt",
  lastBackup: "2026-04-27",
  backupFrequency: "daily",
  systemStatus: "operational",
  databaseHealth: "healthy",
} as const;

export const initialToggleSettings = {
  backupNowRequested: false,
  emailNotifications: true,
  forcePasswordReset: false,
  loginPageBranding: true,
  paymentAlerts: true,
  sslAutoRenewal: true,
  subscriptionAlerts: true,
  systemAlerts: true,
  twoFactorDefault: true,
  whatsappNotifications: false,
} as const;
