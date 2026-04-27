import type { Metadata } from "next";
import { SuperAdminPlansPage } from "@/features/super-admin/plans/SuperAdminPlansPage";

export const metadata: Metadata = {
  title: "Plans Management | RoyalCare",
  description: "Manage RoyalCare subscription plans.",
};

export default function SuperAdminPlansRoute() {
  return <SuperAdminPlansPage />;
}
