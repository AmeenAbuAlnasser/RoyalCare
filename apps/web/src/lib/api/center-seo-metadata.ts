import type { Metadata } from "next";
import { getPublicCenterSeo } from "./public-centers";

export async function buildCenterPageMetadata(
  slug: string,
  options: {
    fallbackTitle: string;
    fallbackDescription: string;
    pageSuffix?: string;
  },
): Promise<Metadata> {
  const data = await getPublicCenterSeo(slug);
  if (!data) {
    return {
      title: options.fallbackTitle,
      description: options.fallbackDescription,
    };
  }

  const centerName = data.nameEn || data.name;
  const logo = data.branding?.logoUrl?.trim() || null;
  const seo = data.seoSettings;

  const title = seo?.seoTitleEn?.trim()
    ? seo.seoTitleEn
    : options.pageSuffix
      ? `${centerName} — ${options.pageSuffix}`
      : centerName;

  const description = seo?.seoDescriptionEn?.trim()
    ? seo.seoDescriptionEn
    : options.fallbackDescription.replace("{name}", centerName);

  const keywords = seo?.keywordsEn?.trim()
    ? seo.keywordsEn.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  const ogTitle = seo?.ogTitleEn?.trim() || seo?.seoTitleEn?.trim() || title;
  const ogDescription = seo?.ogDescriptionEn?.trim() || seo?.seoDescriptionEn?.trim() || description;
  const ogImage = seo?.ogImageUrl?.trim() || null;

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(logo ? { icons: { icon: logo, shortcut: logo, apple: logo } } : {}),
  };
}
