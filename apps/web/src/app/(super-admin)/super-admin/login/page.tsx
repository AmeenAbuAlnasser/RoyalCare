import type { Metadata } from "next";
import { SuperAdminLogin } from "@/features/super-admin/login/SuperAdminLogin";

export const metadata: Metadata = {
  title: "Super Admin Login | RoyalCare",
  description: "RoyalCare Super Admin access.",
};

export default function SuperAdminLoginPage() {
  return <SuperAdminLogin />;
}
