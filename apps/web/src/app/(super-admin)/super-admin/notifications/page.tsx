import type { Metadata } from "next";
import { SuperAdminNotificationsPage } from "@/features/super-admin/notifications/SuperAdminNotificationsPage";

export const metadata: Metadata = {
  title: "Notifications Management | RoyalCare",
  description: "Manage RoyalCare platform notifications.",
};

export default function SuperAdminNotificationsRoute() {
  return <SuperAdminNotificationsPage />;
}
