import type { Metadata } from "next";
import { OpenCenterPage } from "@/features/public/open-center/OpenCenterPage";

export const metadata: Metadata = {
  title: "Open Your Center - RoyalCare",
  description:
    "Register your laser, physiotherapy, hijama, beauty, or wellness center on RoyalCare and start managing your business with a professional platform.",
};

export default function OpenCenterRoute() {
  return <OpenCenterPage />;
}
