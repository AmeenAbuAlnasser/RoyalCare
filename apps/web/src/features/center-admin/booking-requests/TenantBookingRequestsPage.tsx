"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { CenterAdminShell } from "@/features/center-admin/layout/CenterAdminShell";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import type { CenterSession } from "@/lib/api/center-auth";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  acceptTenantBookingRequest,
  type BookingRequestPatientConflict,
  listTenantBookingRequests,
  type PatientResolution,
  rejectTenantBookingRequest,
  type TenantBookingRequest,
} from "@/lib/api/tenant-booking-requests";
import { normalizeForWhatsApp, readWhatsAppDefaultCode } from "@/lib/whatsapp";

type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED";

function resolveServiceName(
  service: TenantBookingRequest["service"],
  locale: SupportedLocale,
): string {
  if (!service) {
    return locale === "ar" ? "عرض / باقة" : locale === "he" ? "מבצע / חבילה" : "Offer / Package";
  }
  if (locale === "ar") return service.nameAr || service.nameEn;
  if (locale === "he") return service.nameHe || service.nameEn;
  return service.nameEn || service.nameAr || service.nameHe;
}

function resolveDisplayName(request: TenantBookingRequest, locale: SupportedLocale): string {
  if (request.offerTitle) return request.offerTitle;
  return resolveServiceName(request.service, locale);
}

function formatDate(dateStr: string, locale: SupportedLocale): string {
  try {
    const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const tag = locale === "ar" ? "ar-SA" : locale === "he" ? "he-IL" : "en-US";
    return date.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string | null, locale: SupportedLocale): string {
  if (!timeStr) return locale === "ar" ? "—" : locale === "he" ? "—" : "—";
  try {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    const tag = locale === "ar" ? "ar-SA" : locale === "he" ? "he-IL" : "en-US";
    return d.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return timeStr;
  }
}

function buildWhatsAppHref(phone: string): string | null {
  const supportPhone = process.env.NEXT_PUBLIC_ROYALCARE_SUPPORT_WHATSAPP ?? "";
  const normalized = normalizeForWhatsApp(phone, readWhatsAppDefaultCode());
  if (!/^\d{7,15}$/.test(normalized)) return null;
  void supportPhone; // suppress unused
  return `https://wa.me/${normalized}`;
}

const statusBadgeClass: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-600",
};

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass[status] ?? "border-[#E5E7EB] bg-[#F8FAFC] text-[#526176]"}`}
    >
      {label}
    </span>
  );
}

function BookingRequestRow({
  request,
  locale,
  d,
  onAccept,
  onReject,
}: {
  request: TenantBookingRequest;
  locale: SupportedLocale;
  d: CenterAdminDictionary;
  onAccept: (id: string, patientResolution?: PatientResolution) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const br = d.bookingRequests;
  const [actionState, setActionState] = useState<"idle" | "accepting" | "rejecting">("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [patientConflict, setPatientConflict] =
    useState<BookingRequestPatientConflict | null>(null);
  const isOfferBooking = Boolean(request.offerId);
  const displayName = resolveDisplayName(request, locale);
  const waHref = buildWhatsAppHref(request.phone);
  const isPending = request.status === "PENDING";

  const handleAccept = async (patientResolution?: PatientResolution) => {
    setActionState("accepting");
    setActionError(null);
    try {
      await onAccept(request.id, patientResolution);
      setPatientConflict(null);
    } catch (err: unknown) {
      const e = err as {
        details?: Partial<BookingRequestPatientConflict> & {
          code?: string;
          message?: string;
        };
        status?: number;
      };
      if (
        e.status === 409 &&
        e.details?.existingPatientName &&
        e.details?.existingPatientPhone &&
        e.details?.bookingFullName &&
        e.details?.bookingPhone
      ) {
        setPatientConflict({
          bookingFullName: e.details.bookingFullName,
          bookingPhone: e.details.bookingPhone,
          existingPatientName: e.details.existingPatientName,
          existingPatientPhone: e.details.existingPatientPhone,
        });
        setActionState("idle");
        return;
      }
      const msg =
        e?.details?.message?.toLowerCase().includes("already")
          ? br.errorAlreadyProcessed
          : br.errorGeneric;
      setActionError(msg);
      setActionState("idle");
    }
  };

  const handleReject = async () => {
    setActionState("rejecting");
    setActionError(null);
    try {
      await onReject(request.id);
    } catch (err: unknown) {
      const e = err as { details?: { message?: string } };
      const msg =
        e?.details?.message?.toLowerCase().includes("already")
          ? br.errorAlreadyProcessed
          : br.errorGeneric;
      setActionError(msg);
      setActionState("idle");
    }
  };

  const statusLabel =
    request.status === "PENDING"
      ? br.statusPending
      : request.status === "ACCEPTED"
        ? br.statusAccepted
        : br.statusRejected;

  return (
    <div className="min-w-0 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0B2D5C]">{request.fullName}</p>
          <p className="mt-0.5 truncate text-xs text-[#66758a]">{displayName}</p>
          {isOfferBooking ? (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <span aria-hidden="true">🎁</span>
              <span>{locale === "ar" ? "عرض" : locale === "he" ? "מבצע" : "Offer"}</span>
              {request.offerPrice ? (
                <span dir="ltr" className="shrink-0 font-bold">
                  · {request.offerPrice} {request.offerCurrency ?? ""}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <StatusBadge label={statusLabel} status={request.status} />
      </div>

      {/* Details */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9AA5B4]">
            {br.requestedDate}
          </p>
          <p className="mt-0.5 text-xs font-medium text-[#0B2D5C]">
            {formatDate(request.requestedDate, locale)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9AA5B4]">
            {br.requestedTime}
          </p>
          <p className="mt-0.5 text-xs font-medium text-[#0B2D5C]">
            {formatTime(request.requestedTime, locale)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9AA5B4]">
            {br.phone}
          </p>
          <p className="mt-0.5 text-xs font-medium text-[#0B2D5C]" dir="ltr">
            {request.phone}
          </p>
        </div>
      </div>

      {request.notes && (
        <p className="mt-2.5 line-clamp-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs text-[#526176]">
          {request.notes}
        </p>
      )}

      {actionError && (
        <p className="mt-2 text-xs font-medium text-red-600">{actionError}</p>
      )}

      {patientConflict ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold leading-5 text-amber-900">
            {br.patientConflictMessage(patientConflict.existingPatientName)}
          </p>
          <div className="mt-2 grid gap-2 text-xs text-amber-800 sm:grid-cols-2">
            <p>
              <span className="font-semibold">{br.existingPatient}:</span>{" "}
              {patientConflict.existingPatientName}{" "}
              <span dir="ltr">({patientConflict.existingPatientPhone})</span>
            </p>
            <p>
              <span className="font-semibold">{br.bookingPatient}:</span>{" "}
              {patientConflict.bookingFullName}{" "}
              <span dir="ltr">({patientConflict.bookingPhone})</span>
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#0B2D5C] bg-[#0B2D5C] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0a2550] disabled:opacity-60"
              disabled={actionState !== "idle"}
              onClick={() => handleAccept("LINK_EXISTING")}
              type="button"
            >
              {br.linkToExistingPatient}
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-600 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
              disabled={actionState !== "idle"}
              onClick={() => handleAccept("CREATE_NEW")}
              type="button"
            >
              {br.createNewPatient}
            </button>
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {isPending && (
          <>
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-lg border-2 border-emerald-600 bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={actionState !== "idle"}
              onClick={() => handleAccept()}
              type="button"
            >
              {actionState === "accepting" ? br.accepting : br.accept}
            </button>
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-lg border-2 border-red-500 bg-transparent px-3.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={actionState !== "idle"}
              onClick={handleReject}
              type="button"
            >
              {actionState === "rejecting" ? br.rejecting : br.reject}
            </button>
          </>
        )}
        {request.status === "ACCEPTED" && request.appointmentId ? (
          <Link
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border-2 border-[#0B2D5C] bg-[#0B2D5C] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#0a2550]"
            href={`/tenant/appointments/${request.appointmentId}`}
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {br.openAppointment}
          </Link>
        ) : request.status === "ACCEPTED" && !request.appointmentId ? (
          <p className="self-center text-xs font-medium text-amber-600">
            {br.linkedAppointmentUnavailable}
          </p>
        ) : null}
        {waHref && (
          <a
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            href={waHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            {br.contactWhatsApp}
          </a>
        )}
      </div>
    </div>
  );
}

export function TenantBookingRequestsPage() {
  const { locale } = useLanguage();

  return (
    <CenterAdminShell
      activeNav="bookingRequests"
      subtitle={(d) => d.bookingRequests.subtitle}
      title={(d) => d.bookingRequests.title}
    >
      {({ dictionary: d, session }) => (
        <BookingRequestsContent
          d={d}
          locale={locale as SupportedLocale}
          session={session}
        />
      )}
    </CenterAdminShell>
  );
}

function BookingRequestsContent({
  d,
  locale,
}: {
  d: CenterAdminDictionary;
  locale: SupportedLocale;
  session: CenterSession;
}) {
  const br = d.bookingRequests;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [items, setItems] = useState<TenantBookingRequest[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("PENDING");

  const load = useCallback(() => {
    setStatus("loading");
    listTenantBookingRequests(filter === "ALL" ? undefined : filter)
      .then((res) => {
        setItems(res.items);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [filter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const handleAccept = async (id: string, patientResolution?: PatientResolution) => {
    const updated = await acceptTenantBookingRequest(id, patientResolution);
    setItems((prev) => prev.map((r) => (r.id === id ? updated : r)));
    window.dispatchEvent(new Event("tenant-booking-requests-updated"));
  };

  const handleReject = async (id: string) => {
    const updated = await rejectTenantBookingRequest(id);
    setItems((prev) => prev.map((r) => (r.id === id ? updated : r)));
    window.dispatchEvent(new Event("tenant-booking-requests-updated"));
  };

  const filterOptions: Array<{ key: StatusFilter; label: string }> = [
    { key: "PENDING", label: br.filterPending },
    { key: "ACCEPTED", label: br.filterAccepted },
    { key: "REJECTED", label: br.filterRejected },
    { key: "ALL", label: br.filterAll },
  ];

  const pendingCount = items.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {filterOptions.map((opt) => (
          <button
            className={`inline-flex min-h-9 items-center justify-center rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
              filter === opt.key
                ? "border-[#0B2D5C] bg-[#0B2D5C] text-white"
                : "border-[#E5E7EB] bg-white text-[#526176] hover:border-[#0B2D5C]/40"
            }`}
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            type="button"
          >
            {opt.label}
            {opt.key === "PENDING" && pendingCount > 0 && status === "ready" && (
              <span className="ms-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {status === "loading" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              className="h-44 animate-pulse rounded-xl border border-[#E5E7EB] bg-white"
              key={i}
            />
          ))}
        </div>
      ) : status === "error" ? (
        <AdminState title={br.loadError} tone="error" />
      ) : items.length === 0 ? (
        <AdminState body={br.emptyBody} title={br.empty} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((request) => (
            <BookingRequestRow
              d={d}
              key={request.id}
              locale={locale}
              onAccept={handleAccept}
              onReject={handleReject}
              request={request}
            />
          ))}
        </div>
      )}
    </div>
  );
}
