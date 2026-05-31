import type { Metadata } from "next";
import { CenterWebsitePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Offers & Packages",
    fallbackDescription: "Exclusive deals and packages at {name}.",
    pageSuffix: "Offers & Packages",
  });
}

export default async function CenterOffersRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterWebsitePage page="offers" slug={centerSlug} />;
}
