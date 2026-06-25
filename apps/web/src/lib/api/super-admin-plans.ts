import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

// ─── Types ────────────────────────────────────────────────────────────────

export type ApiPlanFeature = {
  key: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  included: boolean;
};

export type SuperAdminPlan = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  descriptionHe: string | null;
  yearlyPrice: number;
  currency: string;
  isActive: boolean;
  isPublic: boolean;
  isPopular: boolean;
  isContactPricing: boolean;
  displayOrder: number;
  maxUsers: number | null;
  maxPatients: number | null;
  maxAppointmentsPerMonth: number | null;
  features: ApiPlanFeature[] | null;
  subscriptionsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicPlan = Pick<
  SuperAdminPlan,
  | "id"
  | "code"
  | "nameEn"
  | "nameAr"
  | "nameHe"
  | "descriptionEn"
  | "descriptionAr"
  | "descriptionHe"
  | "yearlyPrice"
  | "currency"
  | "isPopular"
  | "isContactPricing"
  | "displayOrder"
  | "features"
>;

export type CreatePlanPayload = {
  code: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  descriptionHe?: string | null;
  yearlyPrice: number;
  currency?: string;
  isActive?: boolean;
  isPublic?: boolean;
  isPopular?: boolean;
  isContactPricing?: boolean;
  displayOrder?: number;
  maxUsers?: number | null;
  maxPatients?: number | null;
  maxAppointmentsPerMonth?: number | null;
  features?: ApiPlanFeature[] | null;
};

export type UpdatePlanPayload = Omit<Partial<CreatePlanPayload>, "code">;

// ─── Request helper ────────────────────────────────────────────────────────

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    const details = safelyParseJson(rawBody);
    const detailMessage =
      details && typeof details === "object" && "message" in details
        ? String((details as Record<string, unknown>).message)
        : null;
    const message =
      detailMessage ??
      rawBody ??
      `Plans API request failed with status ${response.status}.`;

    throw new ApiRequestError({ details, message, rawResponseBody: rawBody, status: response.status });
  }

  return (await response.json()) as T;
}

// ─── API functions ─────────────────────────────────────────────────────────

export function listSuperAdminPlans() {
  return request<SuperAdminPlan[]>("/super-admin/plans");
}

export function getSuperAdminPlan(id: string) {
  return request<SuperAdminPlan>(`/super-admin/plans/${id}`);
}

export function createSuperAdminPlan(payload: CreatePlanPayload) {
  return request<SuperAdminPlan>("/super-admin/plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSuperAdminPlan(id: string, payload: UpdatePlanPayload) {
  return request<SuperAdminPlan>(`/super-admin/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function reorderSuperAdminPlans(items: { id: string; displayOrder: number }[]) {
  return request<SuperAdminPlan[]>("/super-admin/plans/reorder", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

export function deactivateSuperAdminPlan(id: string) {
  return request<{ message: string }>(`/super-admin/plans/${id}`, {
    method: "DELETE",
  });
}

export function listPublicPlans() {
  return request<PublicPlan[]>("/public/plans");
}
