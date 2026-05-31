"use client";

import { useEffect, useState } from "react";
import { TenantMarketingInjector } from "@/components/marketing/TenantMarketingInjector";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  getPatientPortalDictionary,
  type PatientPortalDictionary,
} from "@/i18n/dictionaries/patient-portal";
import { supportedLocales, type SupportedLocale } from "@/i18n/locales";
import {
  getPatientPortal,
  PortalApiError,
  type PatientPortalData,
  type PortalAppointment,
  type PortalInvoice,
  type PortalInvoiceStatus,
  type PortalAppointmentStatus,
  type PortalPaymentMethod,
  type PortalServiceName,
} from "@/lib/api/patient-portal";
import { trackMarketingEvent } from "@/lib/marketing/track-event";
import { normalizeForWhatsApp, readWhatsAppDefaultCode } from "@/lib/whatsapp";
import { RoyalCareLogo } from "@/components/brand/RoyalCareLogo";

// ─── Constants ────────────────────────────────────────────────────────────────
const localeLabels: Record<SupportedLocale, string> = { en: "EN", ar: "ع", he: "ע" };

const appointmentStatusColors: Record<PortalAppointmentStatus, string> = {
  SCHEDULED:   "bg-blue-100   text-blue-800",
  CONFIRMED:   "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-amber-100  text-amber-800",
  COMPLETED:   "bg-emerald-100 text-emerald-800",
  CANCELLED:   "bg-red-100    text-red-700",
  NO_SHOW:     "bg-gray-100   text-gray-600",
};

const invoiceStatusColors: Record<PortalInvoiceStatus, string> = {
  PENDING:   "bg-amber-100  text-amber-800",
  PARTIAL:   "bg-blue-100   text-blue-800",
  PAID:      "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100    text-red-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function formatTs(isoTs: string): string {
  const date = new Date(isoTs);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function localizedCenterName(
  center: Pick<PatientPortalData["center"], "name" | "nameAr" | "nameEn" | "nameHe">,
  locale: SupportedLocale,
): string {
  if (locale === "ar") return center.nameAr || center.nameEn || center.name;
  if (locale === "he") return center.nameHe || center.nameEn || center.name;
  return center.nameEn || center.name;
}

function localizedServiceName(service: PortalServiceName, locale: SupportedLocale): string {
  if (locale === "ar") return service.nameAr || service.nameEn;
  if (locale === "he") return service.nameHe || service.nameEn;
  return service.nameEn || service.nameAr || service.nameHe;
}

function buildWaUrl(phone: string, text?: string): string {
  const code = readWhatsAppDefaultCode();
  const normalized = normalizeForWhatsApp(phone, code);
  const base = `https://wa.me/${normalized}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// ─── Primitive UI ─────────────────────────────────────────────────────────────
function Badge({ className, label }: { className: string; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-[#66758a] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`shrink-0 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({
  children,
  count,
  defaultOpen = false,
  title,
}: {
  children: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
  title: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_10px_rgba(11,45,92,0.05)]">
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-start transition-colors hover:bg-[#F8FAFC] active:bg-[#F1F5F9]"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#0B2D5C]">{title}</span>
          {count > 0 && (
            <span className="rounded-full bg-[#EAF1FA] px-2 py-0.5 text-xs font-semibold text-[#0B2D5C]">
              {count}
            </span>
          )}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="border-t border-[#F1F5F9]">{children}</div>}
    </div>
  );
}

// ─── Expandable appointment row ───────────────────────────────────────────────
function AppointmentRow({
  appt,
  d,
  defaultOpen = false,
  locale,
}: {
  appt: PortalAppointment;
  d: PatientPortalDictionary;
  defaultOpen?: boolean;
  locale: SupportedLocale;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const status = appt.status as PortalAppointmentStatus;
  const serviceName = localizedServiceName(appt.service, locale);
  const dateStr = formatDate(appt.appointmentDate);

  return (
    <div className="border-b border-[#F1F5F9] last:border-0">
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-start transition-colors hover:bg-[#F8FAFC] active:bg-[#F1F5F9]"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {/* Date block */}
        <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-[#EAF1FA] py-2 text-center">
          <span className="text-xs font-bold leading-none text-[#0B2D5C]">
            {dateStr.slice(0, 2)}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold leading-none text-[#66758a]">
            {dateStr.slice(3, 5)}/{dateStr.slice(6)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#0B2D5C]">{serviceName}</p>
          <p className="mt-0.5 text-xs text-[#66758a]">
            {appt.startTime} – {appt.endTime}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            className={appointmentStatusColors[status] ?? "bg-gray-100 text-gray-600"}
            label={d.appointmentStatus[status] ?? status}
          />
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-[#F1F5F9] bg-[#F8FAFC] px-5 py-4">
          <p className="text-xs text-[#66758a]">
            <span className="font-semibold text-[#24364f]">{d.provider}:</span>{" "}
            {appt.staffUser.fullName}
          </p>
          {appt.notes && (
            <p className="mt-2 text-xs text-[#66758a]">
              <span className="font-semibold text-[#24364f]">{d.notes}:</span>{" "}
              {appt.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Invoice row ──────────────────────────────────────────────────────────────
function InvoiceRow({
  d,
  inv,
  locale,
}: {
  d: PatientPortalDictionary;
  inv: PortalInvoice;
  locale: SupportedLocale;
}) {
  const [open, setOpen] = useState(false);
  const status = inv.status as PortalInvoiceStatus;
  const totalPaid = inv.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="border-b border-[#F1F5F9] last:border-0">
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-start transition-colors hover:bg-[#F8FAFC] active:bg-[#F1F5F9]"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#0B2D5C]">
            {localizedServiceName(inv.service, locale)}
          </p>
          <p className="mt-0.5 text-xs text-[#66758a]">{formatTs(inv.createdAt)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold text-[#0B2D5C]">
            {parseFloat(inv.amount).toFixed(2)}
          </span>
          <Badge
            className={invoiceStatusColors[status] ?? "bg-gray-100 text-gray-600"}
            label={d.invoiceStatus[status] ?? status}
          />
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-[#F1F5F9] bg-[#F8FAFC] px-5 py-4 text-xs text-[#66758a]">
          {inv.invoiceNumber && (
            <p className="mb-2">
              {d.invoiceNumber} #{inv.invoiceNumber}
            </p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <span>
              {d.total}:{" "}
              <span className="font-bold text-[#0B2D5C]">
                {parseFloat(inv.amount).toFixed(2)} {inv.currency}
              </span>
            </span>
            {totalPaid > 0 && (
              <span>
                {d.paid}:{" "}
                <span className="font-semibold text-emerald-700">
                  {totalPaid.toFixed(2)} {inv.currency}
                </span>
              </span>
            )}
          </div>
          {inv.payments.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {inv.payments.map((p, i) => (
                <div className="flex flex-wrap gap-x-3" key={i}>
                  <span className="text-[#24364f]">
                    {d.paymentMethod[p.method as PortalPaymentMethod] ?? p.method}
                  </span>
                  <span className="font-semibold text-[#0B2D5C]">
                    {parseFloat(p.amount).toFixed(2)} {inv.currency}
                  </span>
                  <span>{formatTs(p.paidAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────
function PortalError({
  code,
  d,
}: {
  code: "EXPIRED" | "NOT_FOUND" | "GENERIC";
  d: PatientPortalDictionary;
}) {
  const message =
    code === "EXPIRED" ? d.errorExpired
    : code === "NOT_FOUND" ? d.errorNotFound
    : d.errorGeneric;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <svg aria-hidden="true" className="h-7 w-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mb-2 text-lg font-bold text-[#0B2D5C]">{d.errorTitle}</h1>
      <p className="max-w-xs text-sm leading-relaxed text-[#66758a]">{message}</p>
    </div>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────
function HeroCard({
  center,
  d,
  locale,
  nextAppt,
  patient,
}: {
  center: PatientPortalData["center"];
  d: PatientPortalDictionary;
  locale: SupportedLocale;
  nextAppt: PortalAppointment | null;
  patient: PatientPortalData["patient"];
}) {
  const primaryColor = center.branding?.primaryColor ?? "#0B2D5C";
  const creditAmount = parseFloat(patient.creditBalance);
  const hasCredit = creditAmount > 0;

  const waBaseUrl = center.whatsappPhone
    ? buildWaUrl(center.whatsappPhone)
    : null;

  const rescheduleUrl =
    center.whatsappPhone && nextAppt
      ? buildWaUrl(
          center.whatsappPhone,
          d.rescheduleMessage(
            localizedServiceName(nextAppt.service, locale),
            formatDate(nextAppt.appointmentDate),
            nextAppt.startTime,
          ),
        )
      : null;

  const cancelUrl =
    center.whatsappPhone && nextAppt
      ? buildWaUrl(
          center.whatsappPhone,
          d.cancelMessage(
            localizedServiceName(nextAppt.service, locale),
            formatDate(nextAppt.appointmentDate),
            nextAppt.startTime,
          ),
        )
      : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 pb-6 pt-7 text-white"
      style={{ backgroundColor: primaryColor }}
    >
      {/* Subtle circle decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-8 -top-8 h-40 w-40 rounded-full opacity-[0.07]"
        style={{ backgroundColor: "#fff" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -start-10 h-52 w-52 rounded-full opacity-[0.05]"
        style={{ backgroundColor: "#fff" }}
      />

      {/* Greeting */}
      <p className="relative mb-0.5 text-sm font-medium text-white/70">
        {d.greeting},
      </p>
      <h1 className="relative mb-5 text-2xl font-bold leading-tight text-white">
        {patient.fullName}
      </h1>

      {/* Credit badge */}
      {hasCredit && (
        <div className="relative mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.428-.422-.607a6.22 6.22 0 0 0-1.328-.7ZM8.09 9.87a3.094 3.094 0 0 0-.608.463c-.22.205-.482.603-.482 1.17 0 .796.555 1.394 1.329 1.75V9.303c-.12.056-.164.118-.238.567ZM10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2ZM8 13.25c-.318-.078-.63-.21-.93-.395-.44-.27-.82-.713-.82-1.48 0-.615.218-1.102.617-1.485.39-.374.903-.602 1.133-.694V7.417A2.5 2.5 0 0 0 7.25 8c-.15.094-.25.22-.25.375a.75.75 0 0 1-1.5 0c0-.7.42-1.22.865-1.52A4 4 0 0 1 8 6.25V5.75a.75.75 0 0 1 1.5 0v.5c.318.078.63.21.93.395a.75.75 0 1 1-.76 1.29 2.498 2.498 0 0 0-.17-.08v2.21c.46.157.893.373 1.257.652.574.44.993 1.097.993 1.908 0 .614-.22 1.1-.62 1.484-.39.375-.903.603-1.13.695v.468a.75.75 0 0 1-1.5 0v-.468Z" />
          </svg>
          {creditAmount.toFixed(2)} {d.currency}
        </div>
      )}

      {/* Next appointment */}
      <div className="relative">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
          {d.nextAppointment}
        </p>

        {nextAppt ? (
          <>
            <p className="text-xl font-bold leading-snug text-white">
              {localizedServiceName(nextAppt.service, locale)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-lg font-bold text-white">
                {formatDate(nextAppt.appointmentDate)}
              </span>
              <span className="text-base font-semibold text-white/80">
                {nextAppt.startTime} – {nextAppt.endTime}
              </span>
            </div>
            <div className="mt-2">
              <Badge
                className="border border-white/20 bg-white/15 text-white"
                label={d.appointmentStatus[nextAppt.status as PortalAppointmentStatus] ?? nextAppt.status}
              />
            </div>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-white/80">{d.noNextAppointment}</p>
            <p className="mt-1 text-sm text-white/55">{d.noNextAppointmentBody}</p>
          </>
        )}
      </div>

      {/* Action buttons */}
      {(waBaseUrl || rescheduleUrl || cancelUrl) && (
        <div className="relative mt-6 flex flex-wrap gap-2">
          {waBaseUrl && (
            <a
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:scale-95"
              href={waBaseUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <WhatsAppIcon />
              {d.whatsappCenter}
            </a>
          )}
          {rescheduleUrl && (
            <a
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-opacity hover:bg-white/20 active:scale-95"
              href={rescheduleUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {d.reschedule}
            </a>
          )}
          {cancelUrl && (
            <a
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-opacity hover:bg-white/15 active:scale-95"
              href={cancelUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {d.cancelRequest}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Portal content ───────────────────────────────────────────────────────────
function PortalContent({
  d,
  data,
  locale,
}: {
  d: PatientPortalDictionary;
  data: PatientPortalData;
  locale: SupportedLocale;
}) {
  const { patient, center } = data;

  const [nextAppt, ...otherUpcoming] = data.upcomingAppointments;
  const nextApptOrNull = nextAppt ?? null;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <HeroCard
        center={center}
        d={d}
        locale={locale}
        nextAppt={nextApptOrNull}
        patient={patient}
      />

      {/* Other upcoming */}
      {otherUpcoming.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_10px_rgba(11,45,92,0.05)]">
          <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-[#66758a]">
            {d.moreUpcoming(otherUpcoming.length)}
          </p>
          {otherUpcoming.map((appt) => (
            <AppointmentRow
              appt={appt}
              d={d}
              key={appt.id}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* History accordion */}
      <Accordion
        count={data.pastAppointments.length}
        title={d.previousAppointments}
      >
        {data.pastAppointments.length === 0 ? (
          <p className="px-5 py-4 text-sm text-[#66758a]">{d.noAppointmentHistory}</p>
        ) : (
          data.pastAppointments.map((appt) => (
            <AppointmentRow appt={appt} d={d} key={appt.id} locale={locale} />
          ))
        )}
      </Accordion>

      {/* Bills accordion */}
      <Accordion count={data.invoices.length} title={d.myBills}>
        {data.invoices.length === 0 ? (
          <p className="px-5 py-4 text-sm text-[#66758a]">{d.noBillingHistory}</p>
        ) : (
          data.invoices.map((inv) => (
            <InvoiceRow d={d} inv={inv} key={inv.id} locale={locale} />
          ))
        )}
      </Accordion>

      <div className="h-4" />
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────
export function PatientPortalPage({
  centerSlug,
  token,
}: {
  centerSlug: string;
  token: string;
}) {
  const { locale, setLocale } = useLanguage();
  const d = getPatientPortalDictionary(locale);

  type LoadState =
    | { status: "loading" }
    | { status: "error"; code: "EXPIRED" | "NOT_FOUND" | "GENERIC" }
    | { status: "success"; data: PatientPortalData };

  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setState({ status: "loading" });
    });
    getPatientPortal(centerSlug, token)
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", data });
          trackMarketingEvent("PatientPortalView", {
            centerName: data.center.nameEn || data.center.name,
            centerSlug,
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof PortalApiError) {
          setState({ status: "error", code: err.code });
        } else {
          setState({ status: "error", code: "GENERIC" });
        }
      });
    return () => { cancelled = true; };
  }, [centerSlug, token]);

  const centerName =
    state.status === "success"
      ? localizedCenterName(state.data.center, locale)
      : "RoyalCare";

  const logoUrl =
    state.status === "success"
      ? (state.data.center.branding?.logoUrl ?? null)
      : null;

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <TenantMarketingInjector slug={centerSlug} />
      {/* Slim header */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={centerName} className="h-7 w-7 shrink-0 rounded-md object-cover" src={logoUrl} />
            ) : (
              <RoyalCareLogo className="h-7 w-7 shrink-0" variant="mark" />
            )}
            <span className="truncate text-sm font-bold text-[#0B2D5C]">{centerName}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#F1F5F9] p-1">
            {supportedLocales.map((loc) => (
              <button
                aria-pressed={locale === loc}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  locale === loc
                    ? "bg-white text-[#0B2D5C] shadow-sm"
                    : "text-[#66758a] hover:bg-white/60 hover:text-[#0B2D5C]"
                }`}
                key={loc}
                onClick={() => setLocale(loc)}
                type="button"
              >
                {localeLabels[loc]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-5">
        {state.status === "loading" && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-[#66758a]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#0B2D5C]/20 border-t-[#0B2D5C]" />
            <p className="text-sm">{d.loading}</p>
          </div>
        )}
        {state.status === "error" && <PortalError code={state.code} d={d} />}
        {state.status === "success" && (
          <PortalContent d={d} data={state.data} locale={locale} />
        )}
      </main>
    </div>
  );
}
