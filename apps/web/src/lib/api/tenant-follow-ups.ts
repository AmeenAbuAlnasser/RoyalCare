import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type PatientFollowUpStatus =
  | "DUE"
  | "UPCOMING"
  | "CONTACTED"
  | "BOOKED"
  | "COMPLETED"
  | "MISSED"
  | "CLOSED_EARLY"
  | "CANCELLED"
  | "SKIPPED"
  | "PAUSED";

export type PatientFollowUpPlanStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "CLOSED_EARLY"
  | "CANCELLED"
  | "PAUSED";

export type PatientFollowUpFilter =
  | "TODAY"
  | "THIS_WEEK"
  | "OVERDUE"
  | "UPCOMING"
  | "CONTACTED"
  | "BOOKED"
  | "COMPLETED"
  | "CANCELLED";

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
  nextDueDate: string;
  isRecurring: boolean;
  recurringIntervalValue: number | null;
  recurringIntervalUnit: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  nextRecurringAt: string | null;
  originFollowUpId: string | null;
  status: PatientFollowUpStatus;
  planStatus: PatientFollowUpPlanStatus;
  closedEarlyReason: string | null;
  closedEarlyAt: string | null;
  closedEarlyByUserId: string | null;
  closedEarlyAfterSession: number | null;
  treatmentTemplateId: string | null;
  treatmentTemplateNameAr: string | null;
  treatmentTemplateNameEn: string | null;
  treatmentTemplateNameHe: string | null;
  planTotalSessions: number | null;
  planDefaultIntervalDays: number | null;
  planPhases: Array<{
    fromSessionNumber: number;
    toSessionNumber: number;
    intervalDays: number;
  }> | null;
  lastContactedAt: string | null;
  lastContactedByUserId: string | null;
  reminderCount: number;
  lastReminderAt: string | null;
  lastReminderByUserId: string | null;
  skippedAt: string | null;
  skippedByUserId: string | null;
  pausedAt: string | null;
  pausedByUserId: string | null;
  linkedAppointmentId: string | null;
  linkedAppointmentStatus: string | null;
  linkedAppointmentDate: string | null;
  linkedAppointmentTime: string | null;
  effectiveStatus: string;
  effectiveVisualState: "BOOKED" | "COMPLETED" | "MISSED" | "CANCELLED" | "CLOSED_EARLY" | "UNBOOKED";
  effectiveCanBook: boolean;
  nextAppointmentId: string | null;
  createdAt: string;
  updatedAt: string;
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
    followUpMode?: string | null;
    followUpRules?: Array<{
      fromSessionNumber: number;
      toSessionNumber: number;
      intervalDays: number;
    }> | null;
    totalRecommendedSessions?: number | null;
  } | null;
  nextAppointment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    provider?: {
      id: string;
      fullName: string;
      email: string | null;
    } | null;
  } | null;
  sourceAppointment: {
    id: string;
    appointmentDate: string;
    branch: {
      id: string;
      name: string;
      cityAr: string | null;
      cityEn: string | null;
      cityHe: string | null;
    } | null;
  } | null;
  linkedAppointment: {
    id: string;
    date: string;
    appointmentDate?: string;
    startTime: string;
    endTime: string;
    status: string;
    provider?: {
      id: string;
      fullName: string;
      email: string | null;
    } | null;
  } | null;
  lastTreatment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    durationMinutes: number;
    status: string;
    notes: string | null;
    internalNotes: string | null;
    branch: {
      id: string;
      name: string;
      cityAr: string | null;
      cityEn: string | null;
      cityHe: string | null;
    } | null;
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
  thisWeek?: number;
  upcoming?: number;
  contacted: number;
  bookedFromFollowUps: number;
  cancelled?: number;
  recurringDueToday?: number;
  recurringThisWeek?: number;
  recurringOverdue?: number;
  recurringPatientsRetention?: number;
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
  includeAll?: boolean;
  includeAllForPatient?: boolean;
  patientId?: string;
  branchId?: string;
  kind?: "RECURRING_CONTINUOUS" | "SESSION_BASED_PLAN";
}) {
  const params = new URLSearchParams();

  if (filters?.filter) {
    params.set("filter", filters.filter);
  }

  if (filters?.patientId) {
    params.set("patientId", filters.patientId);
  }

  if (filters?.branchId) {
    params.set("branchId", filters.branchId);
  }

  if (filters?.kind) {
    params.set("kind", filters.kind);
  }

  if (filters?.includeAll) {
    params.set("includeAll", "true");
  }

  if (filters?.includeAllForPatient) {
    params.set("includeAllForPatient", "true");
  }

  const query = params.toString();

  return request<TenantFollowUpsListResponse>(
    `/tenant/follow-ups${query ? `?${query}` : ""}`,
  );
}

export function getTenantFollowUpAnalytics(branchId?: string) {
  const params = new URLSearchParams();
  if (branchId) params.set("branchId", branchId);
  const query = params.toString();
  return request<TenantFollowUpAnalytics>(
    `/tenant/follow-ups/analytics${query ? `?${query}` : ""}`,
  );
}

export function getTenantFollowUp(followUpId: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}`);
}

export function updateTenantFollowUpStatus(
  followUpId: string,
  status: PatientFollowUpStatus,
  nextAppointmentId?: string,
) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/status`, {
    body: JSON.stringify({ nextAppointmentId, status }),
    method: "PATCH",
  });
}

export function updateTenantFollowUpNotes(followUpId: string, notes: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/notes`, {
    body: JSON.stringify({ notes }),
    method: "PATCH",
  });
}

export function updateTenantFollowUpDueDate(followUpId: string, dueDate: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/due-date`, {
    body: JSON.stringify({ dueDate }),
    method: "PATCH",
  });
}

export function closeTenantFollowUpPlanEarly(followUpId: string, reason?: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/close-early`, {
    body: JSON.stringify({ reason }),
    method: "PATCH",
  });
}

export function recordTenantRecurringReminder(followUpId: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/reminder`, {
    method: "PATCH",
  });
}

export function skipTenantRecurringCycle(followUpId: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/skip-cycle`, {
    method: "PATCH",
  });
}

export function pauseTenantRecurringFollowUp(followUpId: string) {
  return request<TenantPatientFollowUp>(`/tenant/follow-ups/${followUpId}/pause`, {
    method: "PATCH",
  });
}
