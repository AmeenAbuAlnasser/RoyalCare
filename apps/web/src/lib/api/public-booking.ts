import { API_BASE_URL } from "./public-centers";

export type CreateBookingRequestPayload = {
  fullName: string;
  phone: string;
  patientArea?: string;
  branchId?: string;
  providerId?: string;
  serviceId?: string;
  notes?: string;
  requestedDate?: string;
  requestedTime?: string;
  offerId?: string;
  offerTitle?: string | null;
  offerPrice?: string | null;
  offerCurrency?: string | null;
};

export type BookingRequestResponse = {
  bookingRequestId?: string;
  trackingEventId?: string;
  message: string;
  centerName: string;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
};

export type BookingRequestError = {
  code?: string;
  message: string;
  errors?: Record<string, string>;
};

export type AvailabilitySlot = {
  available: boolean;
  reason?:
    | "AVAILABLE"
    | "BOOKED"
    | "CENTER_CLOSED"
    | "OUTSIDE_WORKING_HOURS"
    | "PAST_TIME"
    | "PENDING_REQUEST"
    | "PROVIDER_ON_LEAVE"
    | "PROVIDER_UNAVAILABLE";
  time: string;
};

export type PublicAvailabilityResponse = {
  date: string;
  serviceId: string;
  slots: AvailabilitySlot[];
};

export async function createPublicBookingRequest(
  slug: string,
  payload: CreateBookingRequestPayload,
): Promise<BookingRequestResponse> {
  const response = await fetch(
    `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/booking-requests`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({}))) as Partial<BookingRequestError>;
    throw {
      code:
        typeof body.code === "string"
          ? body.code
          : response.status === 409
            ? "SLOT_UNAVAILABLE"
            : "BOOKING_REQUEST_FAILED",
      errors: body.errors,
      message:
        typeof body.message === "string"
          ? body.message
          : "Booking request failed.",
    } satisfies BookingRequestError;
  }

  return response.json() as Promise<BookingRequestResponse>;
}

export async function getPublicAvailability(
  slug: string,
  serviceId: string,
  date: string,
  providerId?: string,
): Promise<PublicAvailabilityResponse> {
  const params = new URLSearchParams({ serviceId, date });
  if (providerId) params.set("providerId", providerId);
  const response = await fetch(
    `${API_BASE_URL}/public/centers/${encodeURIComponent(slug)}/availability?${params.toString()}`,
  );
  if (!response.ok) throw new Error("Failed to load availability");
  return response.json() as Promise<PublicAvailabilityResponse>;
}
