"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { AdminState } from "@/components/ui/admin-surfaces";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  listCenterLeads,
  updateCenterLeadStatus,
  type CenterLead,
  type CenterLeadStatus,
} from "@/lib/api/center-leads";

// ─── Dictionaries ─────────────────────────────────────────────────────────────

const dict = {
  en: {
    brand: { name: "RoyalCare", console: "Super Admin" },
    languages: { en: "English", ar: "Arabic", he: "Hebrew" },
    shell: { menu: "Menu", close: "Close" },
    nav: {
      dashboard: "Dashboard", centers: "Centers", subscriptions: "Subscriptions",
      domains: "Domains", plans: "Plans", users: "Users",
      notifications: "Notifications", auditLogs: "Audit Logs", settings: "Settings",
    },
    header: {
      eyebrow: "Marketing",
      title: "Center Leads",
      subtitle: "Manage incoming center registration requests from the /open-center form.",
      language: "Language",
      account: "Platform Admin",
    },
    search: "Search leads...",
    filter: "Filter by status",
    allStatuses: "All Statuses",
    columns: {
      center: "Center", owner: "Owner", contact: "Contact",
      city: "City", type: "Type", status: "Status", date: "Date", actions: "Actions",
    },
    statuses: {
      NEW:            "New",
      CONTACTED:      "Contacted",
      NO_ANSWER:      "No Answer",
      WRONG_NUMBER:   "Wrong Number",
      NOT_INTERESTED: "Not Interested",
      CANCELLED:      "Cancelled",
      DEMO_BOOKED:    "Demo Booked",
      CONVERTED:      "Converted",
    },
    businessTypes: {
      LASER:           "Laser Center",
      PHYSIOTHERAPY:   "Physiotherapy",
      HIJAMA:          "Hijama Center",
      BEAUTY:          "Beauty Center",
      BEAUTY_CLINIC:   "Beauty Clinic",
      WELLNESS:        "Wellness Center",
      MULTI_SPECIALTY: "Multi-specialty",
      DENTAL:          "Dental Clinic",
      MEDICAL_CLINIC:  "Medical Clinic",
      OTHER:           "Other",
    },
    changeStatus: "Change status",
    noLeads: "No leads found.",
    loadError: "Failed to load leads.",
    total: (n: number) => `${n} lead${n !== 1 ? "s" : ""}`,
    page: "Page",
    of: "of",
    prev: "Previous",
    next: "Next",
    notes: "Notes",
    whatsapp: "WhatsApp",
    phone: "Phone",
  },
  ar: {
    brand: { name: "RoyalCare", console: "سوبر أدمن" },
    languages: { en: "الإنجليزية", ar: "العربية", he: "العبرية" },
    shell: { menu: "القائمة", close: "إغلاق" },
    nav: {
      dashboard: "لوحة التحكم", centers: "المراكز", subscriptions: "الاشتراكات",
      domains: "النطاقات", plans: "الخطط", users: "المستخدمون",
      notifications: "الإشعارات", auditLogs: "سجل المراجعة", settings: "الإعدادات",
    },
    header: {
      eyebrow: "التسويق",
      title: "طلبات المراكز",
      subtitle: "إدارة طلبات تسجيل المراكز الواردة من نموذج /open-center.",
      language: "اللغة",
      account: "مدير المنصة",
    },
    search: "بحث في الطلبات...",
    filter: "تصفية حسب الحالة",
    allStatuses: "كل الحالات",
    columns: {
      center: "المركز", owner: "المالك", contact: "التواصل",
      city: "المدينة", type: "النوع", status: "الحالة", date: "التاريخ", actions: "الإجراءات",
    },
    statuses: {
      NEW:            "جديد",
      CONTACTED:      "تم التواصل",
      NO_ANSWER:      "لا يوجد رد",
      WRONG_NUMBER:   "رقم خاطئ",
      NOT_INTERESTED: "غير مهتم",
      CANCELLED:      "ملغي",
      DEMO_BOOKED:    "عرض محجوز",
      CONVERTED:      "تحويل ناجح",
    },
    businessTypes: {
      LASER:           "مركز ليزر",
      PHYSIOTHERAPY:   "علاج طبيعي",
      HIJAMA:          "مركز حجامة",
      BEAUTY:          "مركز تجميل",
      BEAUTY_CLINIC:   "عيادة تجميل",
      WELLNESS:        "مركز عافية",
      MULTI_SPECIALTY: "متعدد التخصصات",
      DENTAL:          "عيادة أسنان",
      MEDICAL_CLINIC:  "عيادة طبية",
      OTHER:           "أخرى",
    },
    changeStatus: "تغيير الحالة",
    noLeads: "لا توجد طلبات.",
    loadError: "فشل تحميل الطلبات.",
    total: (n: number) => `${n} طلب`,
    page: "صفحة",
    of: "من",
    prev: "السابق",
    next: "التالي",
    notes: "ملاحظات",
    whatsapp: "واتساب",
    phone: "هاتف",
  },
  he: {
    brand: { name: "RoyalCare", console: "סופר אדמין" },
    languages: { en: "אנגלית", ar: "ערבית", he: "עברית" },
    shell: { menu: "תפריט", close: "סגור" },
    nav: {
      dashboard: "לוח בקרה", centers: "מרכזים", subscriptions: "מנויים",
      domains: "דומיינים", plans: "תוכניות", users: "משתמשים",
      notifications: "התראות", auditLogs: "יומן ביקורת", settings: "הגדרות",
    },
    header: {
      eyebrow: "שיווק",
      title: "פניות מרכזים",
      subtitle: "ניהול בקשות הרשמת מרכזים מטופס /open-center.",
      language: "שפה",
      account: "מנהל פלטפורמה",
    },
    search: "חיפוש פניות...",
    filter: "סינון לפי סטטוס",
    allStatuses: "כל הסטטוסים",
    columns: {
      center: "מרכז", owner: "בעלים", contact: "יצירת קשר",
      city: "עיר", type: "סוג", status: "סטטוס", date: "תאריך", actions: "פעולות",
    },
    statuses: {
      NEW:            "חדש",
      CONTACTED:      "נוצר קשר",
      NO_ANSWER:      "אין מענה",
      WRONG_NUMBER:   "מספר שגוי",
      NOT_INTERESTED: "לא מעוניין",
      CANCELLED:      "בוטל",
      DEMO_BOOKED:    "הדגמה נקבעה",
      CONVERTED:      "הומר",
    },
    businessTypes: {
      LASER:           "מרכז לייזר",
      PHYSIOTHERAPY:   "פיזיותרפיה",
      HIJAMA:          "מרכז חיג'אמה",
      BEAUTY:          "מרכז יופי",
      BEAUTY_CLINIC:   "קליניקת יופי",
      WELLNESS:        "מרכז ווellness",
      MULTI_SPECIALTY: "רב תחומי",
      DENTAL:          "מרפאת שיניים",
      MEDICAL_CLINIC:  "מרפאה רפואית",
      OTHER:           "אחר",
    },
    changeStatus: "שנה סטטוס",
    noLeads: "לא נמצאו פניות.",
    loadError: "טעינת הפניות נכשלה.",
    total: (n: number) => `${n} פניות`,
    page: "עמוד",
    of: "מתוך",
    prev: "הקודם",
    next: "הבא",
    notes: "הערות",
    whatsapp: "וואטסאפ",
    phone: "טלפון",
  },
};

type Dict = (typeof dict)["en"];

// ─── Status configuration ──────────────────────────────────────────────────────

const ALL_STATUSES: CenterLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "NO_ANSWER",
  "WRONG_NUMBER",
  "NOT_INTERESTED",
  "CANCELLED",
  "DEMO_BOOKED",
  "CONVERTED",
];

const STATUS_COLORS: Record<CenterLeadStatus, string> = {
  NEW:            "bg-blue-100 text-blue-700 border border-blue-200",
  CONTACTED:      "bg-amber-100 text-amber-700 border border-amber-200",
  NO_ANSWER:      "bg-slate-100 text-slate-600 border border-slate-200",
  WRONG_NUMBER:   "bg-rose-100 text-rose-600 border border-rose-200",
  NOT_INTERESTED: "bg-gray-100 text-gray-500 border border-gray-200",
  CANCELLED:      "bg-red-100 text-red-700 border border-red-200",
  DEMO_BOOKED:    "bg-purple-100 text-purple-700 border border-purple-200",
  CONVERTED:      "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

// ─── Business type translation ─────────────────────────────────────────────────

function resolveBusinessType(raw: string | null, labels: Dict["businessTypes"]): string {
  if (!raw) return "—";
  return labels[raw as keyof typeof labels] ?? raw;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: CenterLeadStatus; label: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {label}
    </span>
  );
}

// ─── Status dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({
  lead,
  labels,
  onUpdate,
}: {
  lead: CenterLead;
  labels: Dict["statuses"];
  onUpdate: (id: string, status: CenterLeadStatus) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as CenterLeadStatus;
    if (next === lead.status) return;
    setLoading(true);
    try { await onUpdate(lead.id, next); } finally { setLoading(false); }
  }

  return (
    <select
      className="rounded-md border border-[#E3E8EF] bg-white px-2 py-1 text-xs font-semibold text-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 disabled:opacity-50"
      disabled={loading}
      onChange={(e) => void onChange(e)}
      value={lead.status}
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s}>{labels[s]}</option>
      ))}
    </select>
  );
}

// ─── Lead card (mobile) ────────────────────────────────────────────────────────

function LeadCard({
  lead,
  d,
  onUpdate,
}: {
  lead: CenterLead;
  d: Dict;
  onUpdate: (id: string, status: CenterLeadStatus) => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-[#E3E8EF] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#0B2D5C]">{lead.centerName}</p>
          {lead.businessType ? (
            <p className="truncate text-xs text-[#526176]">
              {resolveBusinessType(lead.businessType, d.businessTypes)}
            </p>
          ) : null}
        </div>
        <StatusBadge label={d.statuses[lead.status]} status={lead.status} />
      </div>

      <div className="space-y-1 text-sm text-[#526176]">
        <p>
          <span className="font-medium text-[#132238]">{d.columns.owner}:</span>{" "}
          {lead.ownerName}
        </p>
        <p>
          <span className="font-medium text-[#132238]">{d.phone}:</span>{" "}
          <a className="hover:text-[#0B2D5C]" dir="ltr" href={`tel:${lead.phone}`}>{lead.phone}</a>
        </p>
        {lead.whatsapp ? (
          <p>
            <span className="font-medium text-[#132238]">{d.whatsapp}:</span>{" "}
            <a
              className="hover:text-[#0B2D5C]"
              dir="ltr"
              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
              rel="noreferrer"
              target="_blank"
            >
              {lead.whatsapp}
            </a>
          </p>
        ) : null}
        {lead.city ? (
          <p><span className="font-medium text-[#132238]">{d.columns.city}:</span> {lead.city}</p>
        ) : null}
        {lead.notes ? (
          <p className="pt-1 text-xs italic text-[#9BABBF]">{lead.notes}</p>
        ) : null}
        <p className="text-xs text-[#9BABBF]">{new Date(lead.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-medium text-[#526176]">{d.changeStatus}:</span>
        <StatusDropdown labels={d.statuses} lead={lead} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export function LeadsPage() {
  const { locale } = useLanguage();
  const d = dict[locale];

  const [leads, setLeads]     = useState<CenterLead[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState<CenterLeadStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(
    async (p: number, s: string, st: CenterLeadStatus | "") => {
      setLoading(true);
      setError("");
      try {
        const result = await listCenterLeads({
          search: s,
          status: st || undefined,
          page: p,
          pageSize: PAGE_SIZE,
        });
        setLeads(result.leads);
        setTotal(result.total);
      } catch {
        setError(d.loadError);
      } finally {
        setLoading(false);
      }
    },
    [d.loadError],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(page, search, status);
  }, [load, page, search, status]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatus(e.target.value as CenterLeadStatus | "");
    setPage(1);
  }

  async function handleStatusUpdate(id: string, next: CenterLeadStatus) {
    const updated = await updateCenterLeadStatus(id, next);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated.lead : l)));
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <SuperAdminLayout activeNav="leads" dictionary={d}>
      {/* Page header */}
      <div className="border-b border-[#E5E7EB] bg-white px-4 py-6 sm:px-6 lg:px-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#C8A45D]">
          {d.header.eyebrow}
        </p>
        <h1 className="text-2xl font-bold text-[#0B2D5C] lg:text-3xl">{d.header.title}</h1>
        <p className="mt-1 text-sm text-[#526176]">{d.header.subtitle}</p>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="w-full rounded-lg border border-[#E3E8EF] bg-white px-4 py-2.5 text-sm text-[#132238] placeholder-[#9BABBF] focus:border-[#0B2D5C]/50 focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/10 sm:max-w-72"
              onChange={handleSearchChange}
              placeholder={d.search}
              type="search"
              value={search}
            />
            <select
              className="w-full rounded-lg border border-[#E3E8EF] bg-white px-4 py-2.5 text-sm text-[#132238] focus:border-[#0B2D5C]/50 focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/10 sm:w-52"
              onChange={handleStatusChange}
              value={status}
            >
              <option value="">{d.allStatuses}</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{d.statuses[s]}</option>
              ))}
            </select>
          </div>
          {total > 0 ? (
            <p className="shrink-0 text-sm text-[#526176]">{d.total(total)}</p>
          ) : null}
        </div>

        {/* Error */}
        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Content */}
        {loading ? (
          <AdminState className="min-h-64" loading title={d.header.title} />
        ) : leads.length === 0 ? (
          <AdminState className="min-h-64" title={d.noLeads} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-[#E3E8EF] bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E3E8EF] bg-[#F8FAFC]">
                      {[
                        d.columns.center,
                        d.columns.owner,
                        d.columns.contact,
                        d.columns.city,
                        d.columns.type,
                        d.columns.status,
                        d.columns.date,
                        d.columns.actions,
                      ].map((col) => (
                        <th
                          className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-[#526176]"
                          key={col}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F5]">
                    {leads.map((lead) => (
                      <tr className="group hover:bg-[#F8FAFC]" key={lead.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#0B2D5C]">{lead.centerName}</p>
                          {lead.notes ? (
                            <p className="mt-0.5 line-clamp-1 max-w-[180px] text-xs italic text-[#9BABBF]">
                              {lead.notes}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-[#132238]">{lead.ownerName}</td>
                        <td className="px-4 py-3">
                          <a
                            className="block text-[#0B2D5C] hover:underline"
                            dir="ltr"
                            href={`tel:${lead.phone}`}
                          >
                            {lead.phone}
                          </a>
                          {lead.whatsapp ? (
                            <a
                              className="block text-xs text-[#526176] hover:underline"
                              dir="ltr"
                              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {lead.whatsapp}
                            </a>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-[#526176]">{lead.city ?? "—"}</td>
                        <td className="px-4 py-3 text-[#526176]">
                          {resolveBusinessType(lead.businessType, d.businessTypes)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge label={d.statuses[lead.status]} status={lead.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-[#9BABBF]">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusDropdown
                            labels={d.statuses}
                            lead={lead}
                            onUpdate={handleStatusUpdate}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
              {leads.map((lead) => (
                <LeadCard
                  d={d}
                  key={lead.id}
                  lead={lead}
                  onUpdate={handleStatusUpdate}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  className={buttonClassName("secondary", "sm")}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  {d.prev}
                </button>
                <p className="text-sm text-[#526176]">
                  {d.page} {page} {d.of} {totalPages}
                </p>
                <button
                  className={buttonClassName("secondary", "sm")}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  type="button"
                >
                  {d.next}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}
