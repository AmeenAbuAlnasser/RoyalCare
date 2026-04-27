import type { Metadata } from "next";
import { SuperAdminDashboard } from "@/features/super-admin/dashboard/SuperAdminDashboard";

export const metadata: Metadata = {
  title: "Super Admin Dashboard | RoyalCare",
  description: "RoyalCare Super Admin dashboard overview.",
};

export default function SuperAdminDashboardPage() {
  return <SuperAdminDashboard />;
}
