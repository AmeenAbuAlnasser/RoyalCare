import type { Metadata } from "next";
import { SuperAdminCenterDetailsPage } from "@/features/super-admin/centers/details/SuperAdminCenterDetailsPage";

export const metadata: Metadata = {
  title: "Center Details | RoyalCare",
  description: "Review and manage one RoyalCare tenant center.",
};

export default async function SuperAdminCenterDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SuperAdminCenterDetailsPage centerId={id} />;
}
