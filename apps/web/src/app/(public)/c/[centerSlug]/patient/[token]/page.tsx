import type { Metadata } from "next";
import { PatientPortalPage } from "@/features/public/patient-portal/PatientPortalPage";

export const metadata: Metadata = {
  title: "Patient Portal — RoyalCare",
  description: "View your appointments, invoices, and account summary.",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ centerSlug: string; token: string }> };

export default async function PatientPortalRoute({ params }: Props) {
  const { centerSlug, token } = await params;
  return <PatientPortalPage centerSlug={centerSlug} token={token} />;
}
