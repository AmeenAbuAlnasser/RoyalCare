import type { Metadata } from "next";
import { SuperAdminUserDetailsPage } from "@/features/super-admin/users/details/SuperAdminUserDetailsPage";

export const metadata: Metadata = {
  title: "User Details | RoyalCare",
  description: "Review and manage one RoyalCare platform user.",
};

export default async function SuperAdminUserDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SuperAdminUserDetailsPage userId={id} />;
}
