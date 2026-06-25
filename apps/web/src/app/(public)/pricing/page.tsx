import type { Metadata } from "next";
import { PricingPage } from "@/features/public/pricing/PricingPage";

export const metadata: Metadata = {
  title: "Pricing — RoyalCare",
  description:
    "Simple, transparent annual pricing for laser centers, clinics, and wellness businesses on the RoyalCare platform.",
};

export default function PricingRoute() {
  return <PricingPage />;
}
