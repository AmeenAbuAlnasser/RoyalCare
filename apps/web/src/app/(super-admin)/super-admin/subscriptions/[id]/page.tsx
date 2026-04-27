import type { Metadata } from "next";
import { SuperAdminSubscriptionDetailsPage } from "@/features/super-admin/subscriptions/details/SuperAdminSubscriptionDetailsPage";

export const metadata: Metadata = {
  title: "Subscription Details | RoyalCare",
  description: "Review and manage one RoyalCare center subscription.",
};

export default async function SuperAdminSubscriptionDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SuperAdminSubscriptionDetailsPage subscriptionId={id} />;
}
