import { subscriptionsRows } from "../subscriptions-data";

export const subscriptionDetailsById = {
  "1": {
    ...subscriptionsRows[0],
    billingAddress: "12 HaBarzel St, Tel Aviv",
    billingContact: "Maya Cohen",
    billingEmail: "billing@novalaser.co.il",
    companyName: "Nova Laser Ltd",
    currency: "USD",
    lastPaymentDate: "2026-04-18",
    nextRenewalDate: "2026-05-18",
    ownerEmail: "maya@novalaser.co.il",
    vatNumber: "IL-514220118",
    yearlyPrice: 5040,
  },
  "2": {
    ...subscriptionsRows[1],
    billingAddress: "8 Al Quds Rd, Nazareth",
    billingContact: "Omar Haddad",
    billingEmail: "billing@alnoorhijama.com",
    companyName: "Al Noor Wellness",
    currency: "USD",
    lastPaymentDate: "2026-04-04",
    nextRenewalDate: "2026-05-04",
    ownerEmail: "omar@alnoorhijama.com",
    vatNumber: "IL-601450882",
    yearlyPrice: 2160,
  },
  "3": {
    ...subscriptionsRows[2],
    billingAddress: "44 Herzl St, Haifa",
    billingContact: "Dana Levi",
    billingEmail: "billing@balance-physio.co.il",
    companyName: "Balance Physio Clinic",
    currency: "USD",
    lastPaymentDate: "2026-03-12",
    nextRenewalDate: "2026-04-12",
    ownerEmail: "dana@balance-physio.co.il",
    vatNumber: "IL-771443200",
    yearlyPrice: 5040,
  },
  "4": {
    ...subscriptionsRows[3],
    billingAddress: "19 King George St, Jerusalem",
    billingContact: "Lina Mansour",
    billingEmail: "billing@glowbeautyclinic.com",
    companyName: "Glow Beauty Clinic",
    currency: "USD",
    lastPaymentDate: "2026-03-01",
    nextRenewalDate: "2027-02-01",
    ownerEmail: "lina@glowbeautyclinic.com",
    vatNumber: "IL-900640199",
    yearlyPrice: 11400,
  },
  "5": {
    ...subscriptionsRows[4],
    billingAddress: "27 Weizmann Ave, Netanya",
    billingContact: "Noam Bar",
    billingEmail: "billing@wellness-house.co.il",
    companyName: "Wellness House",
    currency: "USD",
    lastPaymentDate: "2026-02-28",
    nextRenewalDate: "2026-03-28",
    ownerEmail: "noam@wellness-house.co.il",
    vatNumber: "IL-118778099",
    yearlyPrice: 2160,
  },
} as const;

export type SubscriptionDetails =
  (typeof subscriptionDetailsById)[keyof typeof subscriptionDetailsById];

export const paymentHistoryById = {
  "1": [
    { invoice: "RC-2026-0041", date: "2026-04-18", amount: 420, method: "card", status: "paid" },
    { invoice: "RC-2026-0032", date: "2026-03-18", amount: 420, method: "card", status: "paid" },
    { invoice: "RC-2026-0023", date: "2026-02-18", amount: 420, method: "card", status: "paid" },
  ],
  "2": [
    { invoice: "RC-2026-0044", date: "2026-04-04", amount: 180, method: "bankTransfer", status: "pending" },
    { invoice: "RC-2026-0035", date: "2026-03-04", amount: 180, method: "card", status: "paid" },
  ],
  "3": [
    { invoice: "RC-2026-0047", date: "2026-04-12", amount: 420, method: "card", status: "failed" },
    { invoice: "RC-2026-0038", date: "2026-03-12", amount: 420, method: "card", status: "paid" },
  ],
  "4": [
    { invoice: "RC-2026-0019", date: "2026-02-01", amount: 11400, method: "bankTransfer", status: "paid" },
  ],
  "5": [
    { invoice: "RC-2026-0030", date: "2026-03-28", amount: 180, method: "card", status: "failed" },
    { invoice: "RC-2026-0021", date: "2026-02-28", amount: 180, method: "card", status: "paid" },
  ],
} as const;

export const renewalHistoryById = {
  "1": ["initialSubscription", "renewal", "renewal"],
  "2": ["initialSubscription", "renewal"],
  "3": ["initialSubscription", "failedPayment"],
  "4": ["initialSubscription", "upgrade"],
  "5": ["initialSubscription", "failedPayment", "suspension"],
} as const;
