import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type BookingRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type BookingRequestService = {
  id: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  durationMinutes: number | null;
};

export type TenantBookingRequest = {
  id: string;
  centerId: string;
  serviceId: string | null;
  appointmentId: string | null;
  fullName: string;
  phone: string;
  notes: string | null;
  requestedDate: string;
  requestedTime: string | null;
  status: BookingRequestStatus;
  createdAt: string;
  updatedAt: string;
  service: BookingRequestService | null;
  offerId: string | null;
  offerTitle: string | null;
  offerPrice: string | null;
  offerCurrency: string | null;
};

export type TenantBookingRequestsListResponse = {
  items: TenantBookingRequest[];
  total: number;
};

export type PatientResolution = "CREATE_NEW" | "LINK_EXISTING";

export type BookingRequestPatientConflict = {
  bookingFullName: string;
  bookingPhone: string;
  existingPatientName: string;
  existingPatientPhone: string;
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
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
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();
    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare booking request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function listTenantBookingRequests(statusFilter?: string) {
  const params = statusFilter && statusFilter !== "ALL"
    ? `?status=${encodeURIComponent(statusFilter)}`
    : "";
  return request<TenantBookingRequestsListResponse>(
    `/tenant/booking-requests${params}`,
  );
}

export function acceptTenantBookingRequest(
  requestId: string,
  patientResolution?: PatientResolution,
) {
  return request<TenantBookingRequest>(
    `/tenant/booking-requests/${requestId}/accept`,
    {
      body: JSON.stringify(
        patientResolution ? { patientResolution } : {},
      ),
      method: "PATCH",
    },
  );
}

export function rejectTenantBookingRequest(requestId: string) {
  return request<TenantBookingRequest>(
    `/tenant/booking-requests/${requestId}/reject`,
    { method: "PATCH" },
  );
}
