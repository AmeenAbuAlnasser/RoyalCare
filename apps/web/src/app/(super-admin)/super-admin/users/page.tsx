import type { Metadata } from "next";
import { SuperAdminUsersPage } from "@/features/super-admin/users/SuperAdminUsersPage";

export const metadata: Metadata = {
  title: "Users Management | RoyalCare",
  description: "Manage RoyalCare platform users and staff access.",
};

export default function SuperAdminUsersRoute() {
  return <SuperAdminUsersPage />;
}
