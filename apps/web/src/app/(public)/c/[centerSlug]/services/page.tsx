import type { Metadata } from "next";
import { CenterWebsitePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Center Services",
    fallbackDescription: "Browse active services at {name} and request an appointment.",
    pageSuffix: "Services",
  });
}

export default async function CenterServicesRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterWebsitePage page="services" slug={centerSlug} />;
}
