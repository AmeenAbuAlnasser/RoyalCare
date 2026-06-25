import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type BookingRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type BookingRequestService = {
  id: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  durationMinutes: number | null;
};

export type BookingRequestBranch = {
  id: string;
  name: string;
  cityAr: string | null;
  cityEn: string | null;
  cityHe: string | null;
  addressAr: string | null;
  addressEn: string | null;
  addressHe: string | null;
  mapsUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export type TenantBookingRequest = {
  id: string;
  centerId: string;
  serviceId: string | null;
  branchId: string | null;
  appointmentId: string | null;
  fullName: string;
  phone: string;
  patientArea: string | null;
  notes: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  source: "PUBLIC_WEBSITE" | "CUSTOMER_PORTAL" | "ADMIN";
  status: BookingRequestStatus;
  createdAt: string;
  updatedAt: string;
  service: BookingRequestService | null;
  branch: BookingRequestBranch | null;
  offerId: string | null;
  offerTitle: string | null;
  offerPrice: string | null;
  offerCurrency: string | null;
  /** Present on list responses: whether this phone already maps to a patient. */
  patientExists?: boolean;
  existingPatientId?: string | null;
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

export function listTenantBookingRequests(
  statusFilter?: string,
  branchId?: string,
) {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
  if (branchId) params.set("branchId", branchId);
  const queryString = params.toString();
  return request<TenantBookingRequestsListResponse>(
    `/tenant/booking-requests${queryString ? `?${queryString}` : ""}`,
  );
}

export function acceptTenantBookingRequest(
  requestId: string,
  patientResolution?: PatientResolution,
) {
  return request<TenantBookingRequest>(
    `/tenant/booking-requests/${requestId}/accept`,
    {
      body: JSON.stringify(patientResolution ? { patientResolution } : {}),
      method: "PATCH",
    },
  );
}

export type BookingRequestConversion = {
  patientId: string;
  serviceId: string | null;
  created: boolean;
};

/**
 * Resolves (or creates, deduped by phone) the patient for a SIMPLE_REQUEST so
 * the appointment can then be created against a real patient.
 */
export function prepareBookingRequestConversion(requestId: string) {
  return request<BookingRequestConversion>(
    `/tenant/booking-requests/${requestId}/prepare-conversion`,
    { method: "PATCH" },
  );
}

/** Links a freshly created appointment back to the booking request. */
export function linkBookingRequestAppointment(
  requestId: string,
  appointmentId: string,
) {
  return request<TenantBookingRequest>(
    `/tenant/booking-requests/${requestId}/link`,
    {
      body: JSON.stringify({ appointmentId }),
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
