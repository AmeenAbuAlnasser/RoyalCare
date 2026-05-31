import type { Metadata } from "next";
import { CenterWebsitePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Before / After",
    fallbackDescription: "View before and after results for {name}.",
    pageSuffix: "Before / After",
  });
}

export default async function CenterBeforeAfterRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterWebsitePage page="before-after" slug={centerSlug} />;
}
