import type { Metadata } from "next";
import { PlatformTrackingPage } from "@/features/super-admin/marketing/PlatformTrackingPage";

export const metadata: Metadata = {
  title: "Platform Tracking | RoyalCare",
  description: "Configure Meta Pixel, TikTok, GA4, and GTM for RoyalCare platform pages.",
};

export default function PlatformTrackingRoute() {
  return <PlatformTrackingPage />;
}
