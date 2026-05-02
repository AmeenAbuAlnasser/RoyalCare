import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";
import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type AppointmentPatient = {
  email?: string | null;
  fullName: string;
  id: string;
  phone: string;
  status: string;
};

export type AppointmentService = {
  durationMinutes: number | null;
  id: string;
  isActive: boolean;
  nameAr: string;
  nameEn: string;
  nameHe: string;
};

export type AppointmentProvider = {
  createdAt?: string;
  email?: string | null;
  fullName: string;
  id: string;
  phone?: string | null;
  role?: {
    key: CenterRoleKey;
    name: string;
  };
  status?: string;
};

export type TenantAppointment = {
  appointmentDate: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdByUser: AppointmentProvider;
  createdByUserId: string;
  centerId: string;
  durationMinutes: number;
  endTime: string;
  id: string;
  internalNotes: string | null;
  isCancelled: boolean;
  notes: string | null;
  patient: AppointmentPatient;
  patientId: string;
  reminderSent: boolean;
  service: AppointmentService;
  serviceId: string;
  staffUser: AppointmentProvider;
  staffUserId: string;
  startTime: string;
  status: AppointmentStatus;
  updatedAt: string;
};

export type TenantAppointmentPayload = {
  appointmentDate: string;
  durationMinutes: number | string;
  endTime?: string;
  internalNotes?: string | null;
  notes?: string | null;
  patientId: string;
  serviceId: string;
  staffUserId: string;
  startTime: string;
  status?: AppointmentStatus;
};

export type TenantAppointmentsListResponse = {
  items: TenantAppointment[];
  total: number;
};

export type AppointmentConflictDetails = {
  appointmentDate: string;
  endTime: string;
  patientName: string;
  providerName: string;
  serviceNameAr: string;
  serviceNameEn: string;
  serviceNameHe: string;
  startTime: string;
};

export type TenantAppointmentOptions = {
  patients: Array<Pick<AppointmentPatient, "fullName" | "id" | "phone" | "status">>;
  providers: AppointmentProvider[];
  services: AppointmentService[];
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
      message: "RoyalCare tenant appointment request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function listTenantAppointments(filters?: {
  date?: string;
  provider?: string;
  search?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters?.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters?.date) {
    params.set("date", filters.date);
  }

  if (filters?.provider) {
    params.set("provider", filters.provider);
  }

  const queryString = params.toString();

  return request<TenantAppointmentsListResponse>(
    `/tenant/appointments${queryString ? `?${queryString}` : ""}`,
  );
}

export function getTenantAppointmentOptions() {
  return request<TenantAppointmentOptions>("/tenant/appointments/options");
}

export function createTenantAppointment(payload: TenantAppointmentPayload) {
  return request<TenantAppointment>("/tenant/appointments", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function getTenantAppointment(appointmentId: string) {
  return request<TenantAppointment>(`/tenant/appointments/${appointmentId}`);
}

export function updateTenantAppointment(
  appointmentId: string,
  payload: TenantAppointmentPayload,
) {
  return request<TenantAppointment>(`/tenant/appointments/${appointmentId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateTenantAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
) {
  return request<TenantAppointment>(
    `/tenant/appointments/${appointmentId}/status`,
    {
      body: JSON.stringify({ status }),
      method: "PATCH",
    },
  );
}

export function cancelTenantAppointment(
  appointmentId: string,
  reason: string,
) {
  return request<TenantAppointment>(
    `/tenant/appointments/${appointmentId}/cancel`,
    {
      body: JSON.stringify({ reason }),
      method: "PATCH",
    },
  );
}
