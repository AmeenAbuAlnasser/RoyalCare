import type { Metadata } from "next";
import { CenterWebsitePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Center Gallery",
    fallbackDescription: "View gallery images from {name}.",
    pageSuffix: "Gallery",
  });
}

export default async function CenterGalleryRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterWebsitePage page="gallery" slug={centerSlug} />;
}
