import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type PatientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type PatientGender = "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";

export type LinkedRecordCounts = {
  appointments: number;
  invoices: number;
  payments: number;
  followUps: number;
  creditTransactions: number;
};

export type CenterPatient = {
  id: string;
  centerId: string;
  fullName: string;
  fullNameAr: string | null;
  fullNameHe: string | null;
  fullNameEn: string | null;
  phone: string;
  email: string | null;
  gender: PatientGender;
  dateOfBirth: string | null;
  nationalId: string | null;
  notes: string | null;
  status: PatientStatus;
  canDelete: boolean;
  linkedRecordCounts: LinkedRecordCounts;
  createdAt: string;
  updatedAt: string;
};

export type PatientPayload = {
  dateOfBirth?: string | null;
  email?: string | null;
  fullName: string;
  fullNameAr?: string | null;
  fullNameHe?: string | null;
  fullNameEn?: string | null;
  gender?: PatientGender;
  nationalId?: string | null;
  notes?: string | null;
  phone: string;
  status?: PatientStatus;
};

export type PatientsListResponse = {
  items: CenterPatient[];
  total: number;
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();

    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare center patient request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function listPatients(search?: string) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const queryString = params.toString();

  return request<PatientsListResponse>(
    `/patients${queryString ? `?${queryString}` : ""}`,
  );
}

export function createPatient(payload: PatientPayload) {
  return request<CenterPatient>("/patients", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function getPatient(patientId: string) {
  return request<CenterPatient>(`/patients/${patientId}`);
}

export function updatePatient(patientId: string, payload: PatientPayload) {
  return request<CenterPatient>(`/patients/${patientId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updatePatientStatus(
  patientId: string,
  status: PatientStatus,
) {
  return request<CenterPatient>(`/patients/${patientId}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}

export function generatePatientPortalToken(patientId: string) {
  return request<{ token: string; createdAt: string }>(
    `/patients/${patientId}/portal-token`,
    { method: "POST" },
  );
}

export function deleteTenantPatient(patientId: string) {
  return request<{ deleted: boolean }>(`/patients/${patientId}`, {
    method: "DELETE",
  });
}
