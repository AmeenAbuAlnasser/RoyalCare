import type { Metadata } from "next";
import { CenterWebsitePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Contact Center",
    fallbackDescription: "Contact {name}, open map details, or book online.",
    pageSuffix: "Contact",
  });
}

export default async function CenterContactRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterWebsitePage page="contact" slug={centerSlug} />;
}
