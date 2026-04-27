import type { Metadata } from "next";
import { SuperAdminSubscriptionsPage } from "@/features/super-admin/subscriptions/SuperAdminSubscriptionsPage";

export const metadata: Metadata = {
  title: "Subscriptions Management | RoyalCare",
  description: "Manage RoyalCare center subscriptions.",
};

export default function SuperAdminSubscriptionsRoute() {
  return <SuperAdminSubscriptionsPage />;
}
