import type { Metadata } from "next";
import { CenterProfilePage } from "@/features/public/centers/CenterProfilePage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = { params: Promise<{ centerSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Care Center",
    fallbackDescription: "View {name} profile and available services.",
  });
}

export default async function CenterProfileRoute({ params }: Props) {
  const { centerSlug } = await params;
  return <CenterProfilePage slug={centerSlug} />;
}
