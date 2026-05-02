import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import type { AppointmentConflictDetails } from "@/lib/api/tenant-appointments";
import type { SupportedLocale } from "@/i18n/locales";

function localizedServiceName(
  details: AppointmentConflictDetails,
  locale: SupportedLocale,
): string {
  if (locale === "ar") return details.serviceNameAr || details.serviceNameEn;
  if (locale === "he") return details.serviceNameHe || details.serviceNameEn;
  return details.serviceNameEn;
}

function formatDate(dateStr: string, locale: SupportedLocale): string {
  if (!dateStr || !dateStr.trim()) return "—";
  // Accept both "YYYY-MM-DD" and full ISO datetime strings — take only the
  // date part so we never double-append a time component.
  const datePart = dateStr.slice(0, 10);
  try {
    const d = new Date(`${datePart}T00:00:00Z`);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(
      locale === "ar" ? "ar-SA" : locale === "he" ? "he-IL" : "en-GB",
      { day: "2-digit", month: "short", year: "numeric" },
    );
  } catch {
    return "—";
  }
}

export function AppointmentConflictAlert({
  details,
  dictionary,
  locale,
}: {
  details: AppointmentConflictDetails;
  dictionary: CenterAdminDictionary;
  locale: SupportedLocale;
}) {
  const d = dictionary.appointments;

  return (
    <div
      className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] p-4 shadow-sm"
      role="alert"
    >
      <div className="flex items-start gap-3 rtl:flex-row-reverse">
        {/* Warning icon */}
        <div className="mt-0.5 shrink-0">
          <svg
            aria-hidden="true"
            className="h-5 w-5 text-[#B42318]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#B42318]">{d.conflictTitle}</p>

          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <ConflictRow label={d.conflictPatient} value={details.patientName} />
            <ConflictRow
              label={d.conflictService}
              value={localizedServiceName(details, locale)}
            />
            <ConflictRow label={d.conflictProvider} value={details.providerName} />
            <ConflictRow
              label={d.conflictDate}
              value={formatDate(details.appointmentDate, locale)}
            />
            <ConflictRow label={d.conflictStart} value={details.startTime} />
            <ConflictRow label={d.conflictEnd} value={details.endTime} />
          </dl>

          <p className="mt-4 text-sm font-semibold text-[#7D1B1B]">
            {d.conflictMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConflictRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 gap-2 rtl:flex-row-reverse">
      <dt className="shrink-0 font-semibold text-[#7D1B1B]">{label}:</dt>
      <dd className="min-w-0 truncate text-[#B42318]">{value || "—"}</dd>
    </div>
  );
}
