export const userStats = [
  { key: "totalUsers", value: 24 },
  { key: "activeUsers", value: 18 },
  { key: "pendingUsers", value: 4 },
  { key: "suspendedUsers", value: 2 },
] as const;

export const userRows = [
  {
    id: "1",
    nameKey: "saraLevi",
    email: "sara.levi@royalcare.app",
    role: "superAdmin",
    department: "operations",
    status: "active",
    lastLogin: "2026-04-27",
    createdDate: "2026-01-04",
  },
  {
    id: "2",
    nameKey: "amirHaddad",
    email: "amir.haddad@royalcare.app",
    role: "support",
    department: "support",
    status: "active",
    lastLogin: "2026-04-26",
    createdDate: "2026-01-18",
  },
  {
    id: "3",
    nameKey: "mayaCohen",
    email: "maya.cohen@royalcare.app",
    role: "sales",
    department: "sales",
    status: "pending",
    lastLogin: "",
    createdDate: "2026-04-20",
  },
  {
    id: "4",
    nameKey: "danaNasser",
    email: "dana.nasser@royalcare.app",
    role: "finance",
    department: "finance",
    status: "active",
    lastLogin: "2026-04-24",
    createdDate: "2026-02-03",
  },
  {
    id: "5",
    nameKey: "noamBar",
    email: "noam.bar@royalcare.app",
    role: "viewer",
    department: "management",
    status: "suspended",
    lastLogin: "2026-03-29",
    createdDate: "2026-02-17",
  },
] as const;

export const userFilters = ["role", "status", "lastLogin"] as const;
export const rolePreview = ["superAdmin", "support", "sales", "finance", "viewer"] as const;
