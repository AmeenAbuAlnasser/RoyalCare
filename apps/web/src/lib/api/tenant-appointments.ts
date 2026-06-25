import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";
import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";
import type { TenantPatientFollowUp } from "./tenant-follow-ups";

export type AppointmentInvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";

export type AppointmentInvoiceSummary = {
  id: string;
  status: AppointmentInvoiceStatus;
  currency: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
};

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
  followUpEnabled?: boolean;
  followUpMode?: "NONE" | "SESSION_BASED_PLAN" | "RECURRING_CONTINUOUS";
  defaultIntervalDays?: number | null;
  totalRecommendedSessions?: number | null;
  recurringIntervalValue?: number | null;
  recurringIntervalUnit?: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  autoCreateNextReminder?: boolean;
  followUpRules?: unknown;
  treatmentTemplates?: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    nameHe: string;
    totalSessions: number | null;
    defaultIntervalDays: number | null;
    phases: Array<{
      fromSessionNumber: number;
      toSessionNumber: number;
      intervalDays: number;
    }> | null;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
  }>;
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

export type AppointmentBookingSource = {
  fullName: string;
  notes: string | null;
  phone: string;
};

export type AppointmentBranch = {
  id: string;
  name: string;
  cityAr: string | null;
  cityEn: string | null;
  cityHe: string | null;
  addressAr: string | null;
  addressEn: string | null;
  addressHe: string | null;
};

export type AppointmentBranchOption = AppointmentBranch & {
  isMain: boolean;
  isActive: boolean;
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
  customServiceName: string | null;
  customServiceDuration: number | null;
  customServicePrice: string | null;
  customServiceCurrency: string | null;
  customServiceSaved: boolean;
  treatmentTemplateId: string | null;
  treatmentTemplateNameAr: string | null;
  treatmentTemplateNameEn: string | null;
  treatmentTemplateNameHe: string | null;
  treatmentTemplateTotalSessions: number | null;
  treatmentTemplateDefaultIntervalDays: number | null;
  treatmentTemplatePhases: unknown;
  durationMinutes: number;
  endTime: string;
  id: string;
  internalNotes: string | null;
  isCancelled: boolean;
  notes: string | null;
  patient: AppointmentPatient;
  patientId: string;
  reminderSent: boolean;
  lastReminderSentAt: string | null;
  reminderCount: number;
  reminder24hSent: boolean;
  reminder2hSent: boolean;
  service: AppointmentService | null;
  serviceId: string | null;
  branch: AppointmentBranch | null;
  branchId: string | null;
  offerTitle: string | null;
  offerPrice: string | null;
  offerCurrency: string | null;
  staffUser: AppointmentProvider;
  staffUserId: string;
  startTime: string;
  status: AppointmentStatus;
  updatedAt: string;
  invoice: AppointmentInvoiceSummary | null;
  bookingSource: AppointmentBookingSource | null;
  hasFollowUpPlan: boolean;
  followUpPlanId: string | null;
  followUpPlanSummary: {
    type: "RECURRING_CONTINUOUS" | "SESSION_BASED_PLAN";
    followUpCount: number;
    totalSessions: number | null;
    completedSessions: number;
    nextFollowUpDate: string | null;
    recurringIntervalValue: number | null;
    recurringIntervalUnit: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  } | null;
  followUpPlan?: TenantPatientFollowUp[];
  followUp: {
    id: string;
    dueDate: string;
    status: string;
    sessionNumber: number | null;
  } | null;
};

export type TenantAppointmentPayload = {
  appointmentDate: string;
  branchId?: string | null;
  autoCreateNextReminder?: boolean;
  recalculateFollowUpSchedule?: boolean;
  customServiceCurrency?: string | null;
  customServiceDuration?: number | string | null;
  customServiceName?: string | null;
  customServicePrice?: number | string | null;
  defaultIntervalDays?: string | number | null;
  durationMinutes: number | string;
  endTime?: string;
  followUpEnabled?: boolean;
  followUpId?: string | null;
  treatmentTemplateId?: string | null;
  followUpMode?: "NONE" | "SESSION_BASED_PLAN" | "RECURRING_CONTINUOUS";
  followUpRules?: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }> | null;
  followUpSessionRules?: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }> | null;
  recurringIntervalValue?: string | number | null;
  recurringIntervalUnit?: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  internalNotes?: string | null;
  notes?: string | null;
  patientId: string;
  reminderMessageAr?: string | null;
  reminderMessageEn?: string | null;
  reminderMessageHe?: string | null;
  saveCustomService?: boolean;
  serviceId?: string | null;
  staffUserId: string;
  startTime: string;
  status?: AppointmentStatus;
  totalRecommendedSessions?: string | number | null;
};

export type TenantAppointmentsListResponse = {
  items: TenantAppointment[];
  total: number;
};

export type AppointmentConflictDetails = {
  appointmentId?: string;
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
  branches: AppointmentBranchOption[];
  patients: Array<Pick<AppointmentPatient, "fullName" | "id" | "phone" | "status">>;
  providers: AppointmentProvider[];
  services: AppointmentService[];
};

export type TenantAvailabilitySlot = {
  available: boolean;
  reason?: string;
  time: string;
};

export type TenantAvailabilityResponse = {
  date: string;
  serviceId: string;
  slots: TenantAvailabilitySlot[];
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
      message: "RoyalCare tenant appointment request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  const data = (await response.json()) as T;
  console.debug("[api:response]", method, url, response.status, `${(performance.now() - t0).toFixed(0)}ms`);
  return data;
}

export function getTenantAvailability(
  serviceId: string | null | undefined,
  date: string,
  providerId?: string,
  excludeAppointmentId?: string,
  durationMinutes?: number,
  isCustomService?: boolean,
): Promise<TenantAvailabilityResponse> {
  const params = new URLSearchParams({ date });
  if (serviceId) params.set("serviceId", serviceId);
  if (providerId) params.set("providerId", providerId);
  if (durationMinutes) params.set("durationMinutes", durationMinutes.toString());
  if (isCustomService) params.set("isCustomService", "true");
  if (excludeAppointmentId) params.set("excludeAppointmentId", excludeAppointmentId);
  return request<TenantAvailabilityResponse>(
    `/tenant/appointments/availability?${params.toString()}`,
  );
}

export function listTenantAppointments(filters?: {
  date?: string;
  provider?: string;
  branch?: string;
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

  if (filters?.branch) {
    params.set("branch", filters.branch);
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

export type AppointmentReminderResponse = {
  appointment: {
    id: string;
    reminderSent: boolean;
    lastReminderSentAt: string | null;
    reminderCount: number;
    reminder24hSent: boolean;
    reminder2hSent: boolean;
  } | null;
  whatsApp: {
    phone: string;
    message: string;
    waLink: string;
  };
};

export function sendTenantAppointmentReminder(
  appointmentId: string,
  locale: string,
): Promise<AppointmentReminderResponse> {
  return request<AppointmentReminderResponse>(
    `/tenant/appointments/${appointmentId}/reminder?locale=${encodeURIComponent(locale)}`,
    { method: "POST" },
  );
}
