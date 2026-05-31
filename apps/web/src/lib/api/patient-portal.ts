const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_ROYALCARE_API_URL ??
  "http://localhost:3001/api/v1";

export type PortalAppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PortalInvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";

export type PortalPaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CHECK"
  | "OTHER";

export type PortalServiceName = {
  nameEn: string;
  nameAr: string;
  nameHe: string;
};

export type PortalAppointment = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: PortalAppointmentStatus;
  notes: string | null;
  service: PortalServiceName;
  staffUser: { fullName: string };
};

export type PortalInvoice = {
  id: string;
  invoiceNumber: string | null;
  amount: string;
  currency: string;
  status: PortalInvoiceStatus;
  createdAt: string;
  service: PortalServiceName;
  payments: Array<{
    amount: string;
    method: PortalPaymentMethod;
    paidAt: string;
  }>;
};

export type PatientPortalData = {
  patient: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    creditBalance: string;
  };
  center: {
    name: string;
    nameAr: string | null;
    nameEn: string | null;
    nameHe: string | null;
    slug: string;
    whatsappPhone: string | null;
    branding: {
      primaryColor: string | null;
      logoUrl: string | null;
    } | null;
  };
  upcomingAppointments: PortalAppointment[];
  pastAppointments: PortalAppointment[];
  invoices: PortalInvoice[];
};

export class PortalApiError extends Error {
  status: number;
  code: "EXPIRED" | "NOT_FOUND" | "GENERIC";

  constructor(status: number, message: string) {
    super(message);
    this.name = "PortalApiError";
    this.status = status;
    this.code =
      status === 410 ? "EXPIRED" : status === 404 ? "NOT_FOUND" : "GENERIC";
  }
}

export async function getPatientPortal(
  centerSlug: string,
  token: string,
): Promise<PatientPortalData> {
  const res = await fetch(
    `${API_BASE_URL}/public/patient-portal/${encodeURIComponent(centerSlug)}/${encodeURIComponent(token)}`,
  );

  if (!res.ok) {
    let message = "Failed to load portal.";
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new PortalApiError(res.status, message);
  }

  return res.json() as Promise<PatientPortalData>;
}
