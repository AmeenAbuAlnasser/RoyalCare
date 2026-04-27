import type { Metadata } from "next";
import { SuperAdminSettingsPage } from "@/features/super-admin/settings/SuperAdminSettingsPage";

export const metadata: Metadata = {
  title: "Settings Management | RoyalCare",
  description: "Manage RoyalCare global platform settings.",
};

export default function SuperAdminSettingsRoute() {
  return <SuperAdminSettingsPage />;
}
