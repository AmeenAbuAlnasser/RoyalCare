import type { Metadata } from "next";
import { SuperAdminPlanDetailsPage } from "@/features/super-admin/plans/details/SuperAdminPlanDetailsPage";

export const metadata: Metadata = {
  title: "Plan Details | RoyalCare",
  description: "Review and manage one RoyalCare subscription plan.",
};

export default async function SuperAdminPlanDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SuperAdminPlanDetailsPage planId={id} />;
}
