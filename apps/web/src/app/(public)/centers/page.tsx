import type { Metadata } from "next";
import { CentersDirectoryPage } from "@/features/public/centers/CentersDirectoryPage";

export const metadata: Metadata = {
  title: "RoyalCare - Care and Beauty Marketplace",
  description:
    "Browse RoyalCare partner centers, discover care and beauty services, and request appointments online.",
};

export default function CentersRoute() {
  return <CentersDirectoryPage />;
}
