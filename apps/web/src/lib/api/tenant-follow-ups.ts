import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type PatientFollowUpStatus =
  | "DUE"
  | "UPCOMING"
  | "CONTACTED"
  | "BOOKED"
  | "COMPLETED"
  | "MISSED"
  | "CANCELLED";

export type PatientFollowUpFilter =
  | "TODAY"
  | "THIS_WEEK"
  | "OVERDUE"
  | "UPCOMING"
  | "CONTACTED"
  | "BOOKED"
  | "COMPLETED";

export type TenantPatientFollowUp = {
  id: string;
  centerId: string;
  patientId: string;
  serviceId: string | null;
  appointmentId: string | null;
  sourceType: string;
  title: string;
  notes: string | null;
  sessionNumber: number | null;
  dueDate: string;
  status: PatientFollowUpStatus;
  lastContactedAt: string | null;
  nextAppointmentId: string | null;
  overdueDays: number;
  patient: {
    id: string;
    fullName: string;
    fullNameAr?: string | null;
    fullNameEn?: string | null;
    fullNameHe?: string | null;
    phone: string;
    email?: string | null;
    status: string;
  };
  service: {
    id: string;
    nameAr: string;
    nameEn: string;
    nameHe: string;
  } | null;
  nextAppointment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    status: string;
  } | null;
  lastTreatment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    durationMinutes: number;
    status: string;
    notes: string | null;
    internalNotes: string | null;
    provider: {
      id: string;
      fullName: string;
      email: string | null;
    };
  } | null;
  treatmentTimeline: Array<{
    id: string;
    sessionNumber: number;
    date: string;
    status: string;
    provider: {
      id: string;
      fullName: string;
      email: string | null;
    } | null;
    type: "COMPLETED" | "FOLLOW_UP";
  }>;
};

export type TenantFollowUpsListResponse = {
  items: TenantPatientFollowUp[];
  total: number;
};

export type TenantFollowUpAnalytics = {
  dueToday: number;
  overdue: number;
  contacted: number;
  bookedFromFollowUps: number;
  conversionRate: number;
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const t0 = performance.now();
  const url = `${API_BASE_URL}${path}`;
  const method = init?.method ?? "GET";
  console.debug("[api:request]", method, url);

  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();
    console.debug("[api:error]", method, url, response.status, `${(performance.now() - t0).toFixed(0)}ms`);

    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare tenant follow-up request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  const data = (await response.json()) as T;
  console.debug("[api:response]", method, url, response.status, `${(performance.now() - t0).toFixed(0)}ms`);
  return data;
}

export function listTenantFollowUps(filters?: {
  filter?: PatientFollowUpFilter;
  patientId?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.filter) {
    params.set("filter", filters.filter);
  }

  if (filters?.patientId) {
    params.set("patientId", filters.patientId);
  }

  const query = params.toString();

  return request<TenantFollowUpsListResponse>(
    `/tenant/follow-ups${query ? `?${query}` : ""}`,
  );
}

export function getTenantFollowUpAnalytics() {
  return request<TenantFollowUpAnalytics>("/tenant/follow-ups/analytics");
}

export function getTenantFollowUp(followUpId: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}`);
}

export function updateTenantFollowUpStatus(
  followUpId: string,
  status: PatientFollowUpStatus,
) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}

export function updateTenantFollowUpNotes(followUpId: string, notes: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/notes`, {
    body: JSON.stringify({ notes }),
    method: "PATCH",
  });
}
