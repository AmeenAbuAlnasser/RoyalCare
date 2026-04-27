import type { Metadata } from "next";
import { SuperAdminCenterWizard } from "@/features/super-admin/centers/new/SuperAdminCenterWizard";

export const metadata: Metadata = {
  title: "Add New Center | RoyalCare",
  description: "Create a new RoyalCare center tenant.",
};

export default function AddNewCenterPage() {
  return <SuperAdminCenterWizard />;
}
