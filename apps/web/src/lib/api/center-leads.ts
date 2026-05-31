import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type CenterLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NO_ANSWER"
  | "WRONG_NUMBER"
  | "NOT_INTERESTED"
  | "CANCELLED"
  | "DEMO_BOOKED"
  | "CONVERTED";

export type CenterLead = {
  id: string;
  centerName: string;
  ownerName: string;
  phone: string;
  whatsapp: string | null;
  city: string | null;
  businessType: string | null;
  notes: string | null;
  status: CenterLeadStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateCenterLeadDto = {
  centerName: string;
  ownerName: string;
  phone: string;
  whatsapp?: string;
  city?: string;
  businessType?: string;
  notes?: string;
};

function safeJson(raw: string) {
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}

async function adminRequest<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    method: options?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    ...(options?.body != null ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!response.ok) {
    const raw = await response.text();
    throw new ApiRequestError({ details: safeJson(raw), message: "Center leads request failed.", rawResponseBody: raw, status: response.status });
  }
  return (await response.json()) as T;
}

// ─── Public ──────────────────────────────────────────────────────────────────

export async function submitCenterLead(dto: CreateCenterLeadDto): Promise<{ lead: CenterLead }> {
  const response = await fetch(`${API_BASE_URL}/public/center-leads`, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const raw = await response.text();
  const data = safeJson(raw) as { lead?: CenterLead; message?: string; errors?: Record<string, string> } | null;
  if (!response.ok) {
    throw new ApiRequestError({ details: data, message: data?.message ?? "Submission failed.", rawResponseBody: raw, status: response.status });
  }
  return data as { lead: CenterLead };
}

// ─── Super Admin ─────────────────────────────────────────────────────────────

export function listCenterLeads(params?: {
  search?: string;
  status?: CenterLeadStatus | "";
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  return adminRequest<{ leads: CenterLead[]; total: number; page: number; pageSize: number }>(
    `/super-admin/center-leads${qs ? `?${qs}` : ""}`,
  );
}

export function updateCenterLeadStatus(id: string, status: CenterLeadStatus) {
  return adminRequest<{ lead: CenterLead }>(`/super-admin/center-leads/${id}`, {
    method: "PATCH",
    body: { status },
  });
}
