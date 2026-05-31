import type { Metadata } from "next";
import { CenterWebsitePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Our Team",
    fallbackDescription: "Meet the team at {name}.",
    pageSuffix: "Our Team",
  });
}

export default async function CenterTeamRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterWebsitePage page="team" slug={centerSlug} />;
}
