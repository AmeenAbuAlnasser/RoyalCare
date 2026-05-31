import type { Metadata } from "next";
import { SuperAdminAuditLogsPage } from "@/features/super-admin/audit-logs/SuperAdminAuditLogsPage";

export const metadata: Metadata = {
  title: "Audit Logs | RoyalCare Super Admin",
  description: "Track all platform-level actions and changes.",
};

export default function SuperAdminAuditLogsRoute() {
  return <SuperAdminAuditLogsPage />;
}
