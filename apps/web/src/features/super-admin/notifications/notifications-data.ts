export const notificationStats = [
  { key: "totalNotifications", value: 86 },
  { key: "unread", value: 19 },
  { key: "critical", value: 7 },
  { key: "sentToday", value: 12 },
] as const;

export const notificationFilters = [
  "unread",
  "critical",
  "system",
  "subscription",
  "domain",
  "payment",
  "support",
] as const;

export const notificationRows = [
  {
    id: "1",
    titleKey: "domainFailedTitle",
    messageKey: "domainFailedMessage",
    type: "domain",
    priority: "critical",
    centerKey: "balancePhysio",
    createdDate: "2026-04-27",
    status: "unread",
  },
  {
    id: "2",
    titleKey: "paymentFailedTitle",
    messageKey: "paymentFailedMessage",
    type: "payment",
    priority: "critical",
    centerKey: "wellnessHouse",
    createdDate: "2026-04-27",
    status: "unread",
  },
  {
    id: "3",
    titleKey: "subscriptionExpiringTitle",
    messageKey: "subscriptionExpiringMessage",
    type: "subscription",
    priority: "high",
    centerKey: "alNoorHijama",
    createdDate: "2026-04-26",
    status: "unread",
  },
  {
    id: "4",
    titleKey: "newCenterTitle",
    messageKey: "newCenterMessage",
    type: "system",
    priority: "normal",
    centerKey: "glowBeauty",
    createdDate: "2026-04-25",
    status: "read",
  },
  {
    id: "5",
    titleKey: "supportTicketTitle",
    messageKey: "supportTicketMessage",
    type: "support",
    priority: "high",
    centerKey: "novaLaser",
    createdDate: "2026-04-24",
    status: "read",
  },
] as const;

export const notificationTemplates = [
  "subscriptionExpiring",
  "domainVerificationFailed",
  "paymentFailed",
  "newCenterCreated",
] as const;
