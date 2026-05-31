import { API_BASE_URL } from "./super-admin-centers";

export class FeaturedServiceError extends Error {
  errors?: Record<string, string>;
  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.errors = errors;
  }
}

export type FeaturedService = {
  id: string;
  titleAr: string;
  titleEn: string;
  titleHe: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionHe: string;
  imageUrl: string | null;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeaturedServiceInput = {
  titleAr: string;
  titleEn: string;
  titleHe?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  descriptionHe?: string;
  imageUrl?: string | null;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export async function getPublicFeaturedServices(): Promise<FeaturedService[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/featured-services`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { services: FeaturedService[] };
    return data.services;
  } catch {
    return [];
  }
}

export async function getAdminFeaturedServices(): Promise<FeaturedService[]> {
  const res = await fetch(`${API_BASE_URL}/admin/featured-services`, {
    credentials: "include",
    headers: { "Content-Type": "application/json",  },
  });
  if (!res.ok) throw new Error("Failed to load featured services.");
  const data = (await res.json()) as { services: FeaturedService[] };
  return data.services;
}

export async function createFeaturedService(
  input: FeaturedServiceInput,
): Promise<FeaturedService> {
  const res = await fetch(`${API_BASE_URL}/admin/featured-services`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json",  },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string>;
    };
    throw new FeaturedServiceError(
      body.message ?? "Failed to create featured service.",
      body.errors,
    );
  }
  const data = (await res.json()) as { service: FeaturedService };
  return data.service;
}

export async function updateFeaturedService(
  id: string,
  input: Partial<FeaturedServiceInput>,
): Promise<FeaturedService> {
  const res = await fetch(`${API_BASE_URL}/admin/featured-services/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json",  },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string>;
    };
    throw new FeaturedServiceError(
      body.message ?? "Failed to update featured service.",
      body.errors,
    );
  }
  const data = (await res.json()) as { service: FeaturedService };
  return data.service;
}

export async function deleteFeaturedService(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/featured-services/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json",  },
  });
  if (!res.ok) throw new Error("Failed to delete featured service.");
}
