import { domainRows } from "../domains-data";

export const domainDetailsById = {
  "1": {
    ...domainRows[0],
    aRecord: "76.76.21.21",
    autoRenew: true,
    cname: "royalcare-sites.vercel.app",
    connectedDate: "2026-01-19",
    issuedDate: "2026-01-19",
    sslExpiryDate: "2026-07-19",
    sslProvider: "Let's Encrypt",
    txtRecord: "royalcare-verify=nova-1a9f",
  },
  "2": {
    ...domainRows[1],
    aRecord: "76.76.21.21",
    autoRenew: true,
    cname: "royalcare-sites.vercel.app",
    connectedDate: "2026-02-04",
    issuedDate: "2026-02-04",
    sslExpiryDate: "2026-08-04",
    sslProvider: "RoyalCare Managed SSL",
    txtRecord: "royalcare-verify=alnoor-7c2d",
  },
  "3": {
    ...domainRows[2],
    aRecord: "76.76.21.21",
    autoRenew: false,
    cname: "royalcare-sites.vercel.app",
    connectedDate: "2025-12-14",
    issuedDate: "2025-12-14",
    sslExpiryDate: "2026-06-14",
    sslProvider: "Let's Encrypt",
    txtRecord: "royalcare-verify=balance-42ba",
  },
  "4": {
    ...domainRows[3],
    aRecord: "76.76.21.21",
    autoRenew: true,
    cname: "royalcare-sites.vercel.app",
    connectedDate: "2026-02-02",
    issuedDate: "2026-02-02",
    sslExpiryDate: "2026-05-07",
    sslProvider: "Let's Encrypt",
    txtRecord: "royalcare-verify=glow-90cd",
  },
  "5": {
    ...domainRows[4],
    aRecord: "76.76.21.21",
    autoRenew: false,
    cname: "royalcare-sites.vercel.app",
    connectedDate: "2025-10-29",
    issuedDate: "2025-10-29",
    sslExpiryDate: "2026-01-29",
    sslProvider: "Let's Encrypt",
    txtRecord: "royalcare-verify=wellness-d810",
  },
} as const;

export type DomainDetails = (typeof domainDetailsById)[keyof typeof domainDetailsById];

export const domainActivityById = {
  "1": ["domainAdded", "dnsChecked", "txtVerified", "sslIssued", "domainConnected"],
  "2": ["domainAdded", "dnsChecked"],
  "3": ["domainAdded", "dnsChecked"],
  "4": ["domainAdded", "dnsChecked", "txtVerified", "sslIssued", "domainConnected"],
  "5": ["domainAdded", "dnsChecked", "sslIssued"],
} as const;
