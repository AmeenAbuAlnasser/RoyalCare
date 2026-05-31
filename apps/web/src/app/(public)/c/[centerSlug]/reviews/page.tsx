import type { Metadata } from "next";
import { CenterWebsitePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Center Reviews",
    fallbackDescription: "Read customer reviews for {name}.",
    pageSuffix: "Reviews",
  });
}

export default async function CenterReviewsRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterWebsitePage page="reviews" slug={centerSlug} />;
}
