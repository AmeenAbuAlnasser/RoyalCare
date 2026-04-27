import type { Metadata } from "next";
import { SuperAdminCentersPage } from "@/features/super-admin/centers/SuperAdminCentersPage";

export const metadata: Metadata = {
  title: "Centers Management | RoyalCare",
  description: "Manage RoyalCare tenant centers.",
};

export default function SuperAdminCentersRoute() {
  return <SuperAdminCentersPage />;
}
