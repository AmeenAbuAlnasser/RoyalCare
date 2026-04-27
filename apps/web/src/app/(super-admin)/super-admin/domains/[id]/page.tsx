import type { Metadata } from "next";
import { SuperAdminDomainDetailsPage } from "@/features/super-admin/domains/details/SuperAdminDomainDetailsPage";

export const metadata: Metadata = {
  title: "Domain Details | RoyalCare",
  description: "Review and manage one RoyalCare center domain.",
};

export default async function SuperAdminDomainDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SuperAdminDomainDetailsPage domainId={id} />;
}
