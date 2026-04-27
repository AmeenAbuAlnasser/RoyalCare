import type { Metadata } from "next";
import { SuperAdminDomainsPage } from "@/features/super-admin/domains/SuperAdminDomainsPage";

export const metadata: Metadata = {
  title: "Domains Management | RoyalCare",
  description: "Manage RoyalCare center domains and DNS verification.",
};

export default function SuperAdminDomainsRoute() {
  return <SuperAdminDomainsPage />;
}
