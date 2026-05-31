export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_ROYALCARE_API_URL ??
  "http://localhost:3001/api/v1";

export type PublicCenterType =
  | "LASER"
  | "PHYSIOTHERAPY"
  | "HIJAMA"
  | "BEAUTY"
  | "WELLNESS"
  | "MULTI_SPECIALTY";

export type PublicCenterLanguage = "AR" | "HE" | "EN";

export type PublicServicePreview = {
  nameEn: string;
  nameAr: string;
  nameHe: string;
};

export type PublicServiceFull = PublicServicePreview & {
  id: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  descriptionHe: string | null;
  durationMinutes: number | null;
  price: string | null;
  currency: string;
};

export type PublicProvider = {
  id: string;
  name: string;
  roleKey: string;
  roleName: string;
};

export type PublicCenterBranding = {
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  coverImageUrl: string | null;
  cardImageUrl: string | null;
  publicDescriptionAr: string | null;
  publicDescriptionEn: string | null;
  publicDescriptionHe: string | null;
  fullDescriptionAr: string | null;
  fullDescriptionEn: string | null;
  fullDescriptionHe: string | null;
  sloganAr: string | null;
  sloganEn: string | null;
  sloganHe: string | null;
  cityAr: string | null;
  cityEn: string | null;
  cityHe: string | null;
  addressAr: string | null;
  addressEn: string | null;
  addressHe: string | null;
  whatsappPhone: string | null;
  phone: string | null;
  email: string | null;
  googleMapsUrl: string | null;
  workingHoursAr: string | null;
  workingHoursEn: string | null;
  workingHoursHe: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteSectionOrder: string[] | null;
  websiteSectionVisibility: Record<string, boolean> | null;
};

export type PublicGalleryImage = {
  id: string;
  imageUrl: string;
  sortOrder: number;
};

export type PublicCenterReview = {
  commentAr: string | null;
  commentEn: string | null;
  commentHe: string | null;
  customerName: string;
  id: string;
  rating: number;
  sortOrder: number;
};

export type PublicBeforeAfterCategory = "LASER" | "SKIN" | "DENTAL" | "HAIR" | "OTHER";

export type PublicCenterBeforeAfter = {
  afterImageUrl: string;
  beforeImageUrl: string;
  category: PublicBeforeAfterCategory;
  descriptionAr: string | null;
  descriptionEn: string | null;
  descriptionHe: string | null;
  id: string;
  sortOrder: number;
  titleAr: string | null;
  titleEn: string | null;
  titleHe: string | null;
};

export type PublicOffer = {
  badgeAr: string | null;
  badgeEn: string | null;
  badgeHe: string | null;
  currency: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  descriptionHe: string | null;
  endsAt: string | null;
  id: string;
  imageUrl: string | null;
  newPrice: string | null;
  oldPrice: string | null;
  sortOrder: number;
  startsAt: string | null;
  titleAr: string | null;
  titleEn: string | null;
  titleHe: string | null;
};

export type PublicTeamMember = {
  bioAr: string | null;
  bioEn: string | null;
  bioHe: string | null;
  id: string;
  nameAr: string | null;
  nameEn: string | null;
  nameHe: string | null;
  photoUrl: string | null;
  sortOrder: number;
  specialtyAr: string | null;
  specialtyEn: string | null;
  specialtyHe: string | null;
  titleAr: string | null;
  titleEn: string | null;
  titleHe: string | null;
  yearsExperience: number | null;
};

export type PublicCenterSummary = {
  slug: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  nameHe: string | null;
  type: PublicCenterType;
  primaryLanguage: PublicCenterLanguage;
  branding: PublicCenterBranding | null;
  services: PublicServicePreview[];
};

export type PublicCenterDetail = Omit<PublicCenterSummary, "services"> & {
  providers: PublicProvider[];
  services: PublicServiceFull[];
};

// Public-safe tenant marketing settings. Server-side tokens such as
// metaConversionApiToken must never be added to this client payload.
export type PublicMarketingSettings = {
  customBodyScript: string | null;
  customHeadScript: string | null;
  ga4Id: string | null;
  gtmId: string | null;
  metaPixelId: string | null;
  snapPixelId: string | null;
  tiktokPixelId: string | null;
};

export async function listPublicCenters(): Promise<PublicCenterSummary[]> {
  const response = await fetch(`${API_BASE_URL}/public/centers`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to load centers");
  const json = await response.json() as { data: PublicCenterSummary[] };
  return json.data;
}

export async function getPublicCenterGallery(
  slug: string,
): Promise<{ data: PublicGalleryImage[] }> {
  const response = await fetch(
    `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/gallery`,
    { cache: "no-store" },
  );
  if (!response.ok) return { data: [] };
  return response.json() as Promise<{ data: PublicGalleryImage[] }>;
}

export async function getPublicCenterReviews(
  slug: string,
): Promise<{ data: PublicCenterReview[] }> {
  const response = await fetch(
    `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/reviews`,
    { cache: "no-store" },
  );
  if (!response.ok) return { data: [] };
  return response.json() as Promise<{ data: PublicCenterReview[] }>;
}

export async function getPublicCenterBeforeAfter(
  slug: string,
): Promise<{ data: PublicCenterBeforeAfter[] }> {
  const response = await fetch(
    `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/before-after`,
    { cache: "no-store" },
  );
  if (!response.ok) return { data: [] };
  return response.json() as Promise<{ data: PublicCenterBeforeAfter[] }>;
}

export async function getPublicCenter(slug: string): Promise<PublicCenterDetail> {
  const response = await fetch(`${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Center not found");
  return response.json() as Promise<PublicCenterDetail>;
}

export async function getPublicCenterMarketingSettings(
  slug: string,
): Promise<PublicMarketingSettings> {
  const response = await fetch(
    `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/marketing-settings`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    return {
      customBodyScript: null,
      customHeadScript: null,
      ga4Id: null,
      gtmId: null,
      metaPixelId: null,
      snapPixelId: null,
      tiktokPixelId: null,
    };
  }
  return response.json() as Promise<PublicMarketingSettings>;
}

export async function getPublicCenterOffers(
  slug: string,
): Promise<{ data: PublicOffer[] }> {
  const response = await fetch(
    `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/offers`,
    { cache: "no-store" },
  );
  if (!response.ok) return { data: [] };
  return response.json() as Promise<{ data: PublicOffer[] }>;
}

export async function getPublicCenterTeam(
  slug: string,
): Promise<{ data: PublicTeamMember[] }> {
  const response = await fetch(
    `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/team`,
    { cache: "no-store" },
  );
  if (!response.ok) return { data: [] };
  return response.json() as Promise<{ data: PublicTeamMember[] }>;
}

export type PublicCenterSeoData = {
  name: string;
  nameEn: string | null;
  branding: { logoUrl: string | null } | null;
  seoSettings: {
    seoTitleEn: string | null;
    seoDescriptionEn: string | null;
    keywordsEn: string | null;
    ogTitleEn: string | null;
    ogDescriptionEn: string | null;
    ogImageUrl: string | null;
  } | null;
};

export async function getPublicCenterSeo(
  slug: string,
): Promise<PublicCenterSeoData | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/seo`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as { data: PublicCenterSeoData | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}
