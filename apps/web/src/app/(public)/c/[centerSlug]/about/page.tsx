import type { Metadata } from "next";
import { CenterWebsitePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "About Center",
    fallbackDescription: "Learn more about {name} and book services online.",
    pageSuffix: "About",
  });
}

export default async function CenterAboutRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterWebsitePage page="about" slug={centerSlug} />;
}
