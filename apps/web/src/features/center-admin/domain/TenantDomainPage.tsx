"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminCard, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { CenterAdminShell } from "@/features/center-admin/layout/CenterAdminShell";
import {
  listTenantDomains,
  addTenantDomain,
  updateTenantDomain,
  deleteTenantDomain,
  verifyTenantDomain,
  type TenantDomain,
  type DnsInstructions,
} from "@/lib/api/tenant-domains";

type Lang = "en" | "ar" | "he";

const copy = {
  en: {
    title: "Custom Domains",
    subtitle: "Connect your own domain to this center's public website",
    addSection: "Add Domain",
    addPlaceholder: "clinic.example.com",
    addButton: "Add Domain",
    adding: "Adding…",
    domainsSection: "Your Domains",
    empty: "No custom domains yet",
    emptyBody: "Add a domain above to get started.",
    primary: "Primary",
    makePrimary: "Make Primary",
    makingPrimary: "Updating…",
    verify: "Verify",
    verifying: "Verifying…",
    verified: "Verified",
    delete: "Delete",
    deleting: "Deleting…",
    confirmDelete: "Delete this domain?",
    confirmYes: "Yes, Delete",
    confirmNo: "Cancel",
    loadError: "Failed to load domains.",
    statusPending: "Pending",
    statusVerified: "Verified",
    statusActive: "Active",
    statusFailed: "Failed",
    statusDisabled: "Disabled",
    sslPending: "SSL Pending",
    sslProvisioning: "SSL Provisioning",
    sslActive: "SSL Active",
    sslFailed: "SSL Failed",
    dnsInstructions: "DNS Verification Instructions",
    dnsBody:
      "Add the following TXT record to your domain's DNS settings, then click Verify again.",
    dnsRecordType: "Record Type",
    dnsHost: "Host / Name",
    dnsValue: "Value",
    dnsCopy: "Copy",
    dnsCopied: "Copied!",
    notVerifiedYet: "DNS record not found yet. This may take up to 48 hours to propagate.",
    verifiedSuccess: "Domain verified successfully.",
    primarySuccess: "Primary domain updated.",
    deleteSuccess: "Domain removed.",
    errGeneric: "Something went wrong. Please try again.",
    instructions:
      "Point your domain to our servers after verification by updating your CNAME or A records.",
  },
  ar: {
    title: "النطاقات المخصصة",
    subtitle: "اربط نطاقك الخاص بالموقع العام لهذا المركز",
    addSection: "إضافة نطاق",
    addPlaceholder: "clinic.example.com",
    addButton: "إضافة نطاق",
    adding: "جارٍ الإضافة…",
    domainsSection: "نطاقاتك",
    empty: "لا توجد نطاقات مخصصة بعد",
    emptyBody: "أضف نطاقاً أعلاه للبدء.",
    primary: "الرئيسي",
    makePrimary: "تعيين كرئيسي",
    makingPrimary: "جارٍ التحديث…",
    verify: "التحقق",
    verifying: "جارٍ التحقق…",
    verified: "تم التحقق",
    delete: "حذف",
    deleting: "جارٍ الحذف…",
    confirmDelete: "هل تريد حذف هذا النطاق؟",
    confirmYes: "نعم، احذف",
    confirmNo: "إلغاء",
    loadError: "فشل تحميل النطاقات.",
    statusPending: "قيد الانتظار",
    statusVerified: "تم التحقق",
    statusActive: "نشط",
    statusFailed: "فشل",
    statusDisabled: "معطل",
    sslPending: "SSL قيد الانتظار",
    sslProvisioning: "SSL قيد الإعداد",
    sslActive: "SSL نشط",
    sslFailed: "SSL فشل",
    dnsInstructions: "تعليمات التحقق من DNS",
    dnsBody:
      "أضف سجل TXT التالي إلى إعدادات DNS لنطاقك، ثم انقر على التحقق مرة أخرى.",
    dnsRecordType: "نوع السجل",
    dnsHost: "المضيف / الاسم",
    dnsValue: "القيمة",
    dnsCopy: "نسخ",
    dnsCopied: "تم النسخ!",
    notVerifiedYet: "لم يتم العثور على سجل DNS بعد. قد يستغرق الأمر حتى 48 ساعة.",
    verifiedSuccess: "تم التحقق من النطاق بنجاح.",
    primarySuccess: "تم تحديث النطاق الرئيسي.",
    deleteSuccess: "تمت إزالة النطاق.",
    errGeneric: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    instructions:
      "بعد التحقق، وجّه نطاقك إلى خوادمنا عبر تحديث سجلات CNAME أو A.",
  },
  he: {
    title: "דומיינים מותאמים אישית",
    subtitle: "חבר את הדומיין שלך לאתר הציבורי של המרכז",
    addSection: "הוסף דומיין",
    addPlaceholder: "clinic.example.com",
    addButton: "הוסף דומיין",
    adding: "מוסיף…",
    domainsSection: "הדומיינים שלך",
    empty: "אין עדיין דומיינים מותאמים אישית",
    emptyBody: "הוסף דומיין למעלה כדי להתחיל.",
    primary: "ראשי",
    makePrimary: "הגדר כראשי",
    makingPrimary: "מעדכן…",
    verify: "אמת",
    verifying: "מאמת…",
    verified: "אומת",
    delete: "מחק",
    deleting: "מוחק…",
    confirmDelete: "למחוק דומיין זה?",
    confirmYes: "כן, מחק",
    confirmNo: "בטל",
    loadError: "טעינת הדומיינים נכשלה.",
    statusPending: "ממתין",
    statusVerified: "אומת",
    statusActive: "פעיל",
    statusFailed: "נכשל",
    statusDisabled: "מושבת",
    sslPending: "SSL ממתין",
    sslProvisioning: "SSL בהכנה",
    sslActive: "SSL פעיל",
    sslFailed: "SSL נכשל",
    dnsInstructions: "הוראות אימות DNS",
    dnsBody:
      "הוסף את רשומת ה-TXT הבאה להגדרות ה-DNS של הדומיין, ולחץ על אמת שוב.",
    dnsRecordType: "סוג רשומה",
    dnsHost: "Host / שם",
    dnsValue: "ערך",
    dnsCopy: "העתק",
    dnsCopied: "הועתק!",
    notVerifiedYet: "רשומת ה-DNS לא נמצאה עדיין. ייתכן ויידרשו עד 48 שעות.",
    verifiedSuccess: "הדומיין אומת בהצלחה.",
    primarySuccess: "הדומיין הראשי עודכן.",
    deleteSuccess: "הדומיין הוסר.",
    errGeneric: "אירעה שגיאה. נסה שוב.",
    instructions:
      "לאחר האימות, כוון את הדומיין לשרתים שלנו על ידי עדכון רשומות CNAME או A.",
  },
} as const;

type StatusKey = TenantDomain["status"];
type SslKey = TenantDomain["sslStatus"];

type CopyShape = {
  statusPending: string;
  statusVerified: string;
  statusActive: string;
  statusFailed: string;
  statusDisabled: string;
  sslPending: string;
  sslProvisioning: string;
  sslActive: string;
  sslFailed: string;
  [key: string]: unknown;
};

function statusBadge(
  status: StatusKey,
  t: CopyShape
): { label: string; className: string } {
  switch (status) {
    case "VERIFIED":
      return {
        label: t.statusVerified,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "ACTIVE":
      return {
        label: t.statusActive,
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "FAILED":
      return {
        label: t.statusFailed,
        className: "bg-red-50 text-red-700 border-red-200",
      };
    case "DISABLED":
      return {
        label: t.statusDisabled,
        className: "bg-gray-100 text-gray-500 border-gray-200",
      };
    default:
      return {
        label: t.statusPending,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
  }
}

function sslBadge(
  status: SslKey,
  t: CopyShape
): { label: string; className: string } {
  switch (status) {
    case "ACTIVE":
      return {
        label: t.sslActive,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "PROVISIONING":
      return {
        label: t.sslProvisioning,
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "FAILED":
      return {
        label: t.sslFailed,
        className: "bg-red-50 text-red-700 border-red-200",
      };
    default:
      return {
        label: t.sslPending,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
  }
}

type ActionState = {
  type: "verifying" | "makingPrimary" | "deleting" | "confirmDelete";
  domainId: string;
};

type VerifyResult = {
  verified: boolean;
  instructions?: DnsInstructions;
  message?: string;
};

export function TenantDomainPage() {
  const { locale } = useLanguage();
  const t = copy[(locale as Lang) in copy ? (locale as Lang) : "en"];

  const [domains, setDomains] = useState<TenantDomain[]>([]);
  const [pageState, setPageState] = useState<"loading" | "error" | "ok">(
    "loading"
  );
  const [addHostname, setAddHostname] = useState("");
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [verifyResults, setVerifyResults] = useState<
    Record<string, VerifyResult>
  >({});
  const [expandedVerify, setExpandedVerify] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showFeedback(message: string, tone: "success" | "error") {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ message, tone });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4000);
  }

  const load = useCallback(async () => {
    setPageState("loading");
    try {
      const items = await listTenantDomains();
      setDomains(items);
      setPageState("ok");
    } catch {
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleAdd() {
    setAddErrors({});
    if (!addHostname.trim()) {
      setAddErrors({ hostname: "Enter a domain name." });
      return;
    }
    setAdding(true);
    try {
      const item = await addTenantDomain(addHostname.trim());
      setDomains((prev) => [item, ...prev]);
      setAddHostname("");
      showFeedback("Domain added.", "success");
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string>; message?: string };
      if (e?.errors) {
        setAddErrors(e.errors);
      } else {
        setAddErrors({ hostname: t.errGeneric });
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(domain: TenantDomain) {
    setActionState({ type: "verifying", domainId: domain.id });
    try {
      const result = await verifyTenantDomain(domain.id);
      setVerifyResults((prev) => ({
        ...prev,
        [domain.id]: {
          verified: result.verified,
          instructions: result.instructions,
          message: result.verified ? t.verifiedSuccess : t.notVerifiedYet,
        },
      }));
      if (result.item) {
        setDomains((prev) =>
          prev.map((d) => (d.id === domain.id ? result.item! : d))
        );
      }
      setExpandedVerify(domain.id);
    } catch {
      setVerifyResults((prev) => ({
        ...prev,
        [domain.id]: { verified: false, message: t.errGeneric },
      }));
      setExpandedVerify(domain.id);
    } finally {
      setActionState(null);
    }
  }

  async function handleMakePrimary(domain: TenantDomain) {
    setActionState({ type: "makingPrimary", domainId: domain.id });
    try {
      await updateTenantDomain(domain.id, { isPrimary: true });
      setDomains((prev) =>
        prev.map((d) => ({ ...d, isPrimary: d.id === domain.id }))
      );
      showFeedback(t.primarySuccess, "success");
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string> };
      const msg =
        e?.errors?.isPrimary ?? t.errGeneric;
      showFeedback(msg, "error");
    } finally {
      setActionState(null);
    }
  }

  async function handleDelete(domainId: string) {
    setActionState({ type: "deleting", domainId });
    try {
      await deleteTenantDomain(domainId);
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
      setVerifyResults((prev) => {
        const next = { ...prev };
        delete next[domainId];
        return next;
      });
      showFeedback(t.deleteSuccess, "success");
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string> };
      const msg = e?.errors?.isPrimary ?? t.errGeneric;
      showFeedback(msg, "error");
    } finally {
      setActionState(null);
    }
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      setTimeout(() => setCopiedField((c) => (c === key ? null : c)), 2000);
    } catch {
      /* ignore */
    }
  }

  const isRtl = locale === "ar" || locale === "he";

  return (
    <CenterAdminShell
      activeNav="domain"
      requiredPermission="settings:view"
      title={() => t.title}
      subtitle={() => t.subtitle}
    >
      {() => (
        <div className="flex min-w-0 flex-col gap-6">
          {/* Feedback toast */}
          {feedback && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                feedback.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
              dir={isRtl ? "rtl" : "ltr"}
            >
              {feedback.message}
            </div>
          )}

          {/* Add Domain */}
          <AdminCard className="p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold text-[#0B2D5C]">
              {t.addSection}
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={addHostname}
                  onChange={(e) => setAddHostname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder={t.addPlaceholder}
                  dir="ltr"
                  disabled={adding}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[#0B2D5C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 disabled:opacity-60 ${
                    addErrors.hostname
                      ? "border-red-400 bg-red-50"
                      : "border-[#E5E7EB] bg-white"
                  }`}
                />
                {addErrors.hostname && (
                  <p className="mt-1 text-xs text-red-600">
                    {addErrors.hostname}
                  </p>
                )}
              </div>
              <button
                onClick={handleAdd}
                disabled={adding}
                className={buttonClassName("primary", "md", "shrink-0")}
              >
                {adding ? t.adding : t.addButton}
              </button>
            </div>
          </AdminCard>

          {/* Domains list */}
          <AdminCard className="p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold text-[#0B2D5C]">
              {t.domainsSection}
            </h2>

            {pageState === "loading" && (
              <AdminState loading title="Loading…" tone="neutral" />
            )}
            {pageState === "error" && (
              <AdminState
                title={t.loadError}
                tone="error"
                action={
                  <button
                    onClick={load}
                    className={buttonClassName("secondary", "sm")}
                  >
                    Retry
                  </button>
                }
              />
            )}
            {pageState === "ok" && domains.length === 0 && (
              <AdminState
                title={t.empty}
                body={t.emptyBody}
                tone="neutral"
              />
            )}

            {pageState === "ok" && domains.length > 0 && (
              <div className="flex flex-col gap-4">
                {domains.map((domain) => {
                  const sBadge = statusBadge(domain.status, t);
                  const ssl = sslBadge(domain.sslStatus, t);
                  const isVerifying =
                    actionState?.type === "verifying" &&
                    actionState.domainId === domain.id;
                  const isMakingPrimary =
                    actionState?.type === "makingPrimary" &&
                    actionState.domainId === domain.id;
                  const isDeleting =
                    actionState?.type === "deleting" &&
                    actionState.domainId === domain.id;
                  const isConfirmDelete =
                    actionState?.type === "confirmDelete" &&
                    actionState.domainId === domain.id;
                  const anyBusy = actionState !== null;
                  const vResult = verifyResults[domain.id];
                  const verifyExpanded = expandedVerify === domain.id;

                  return (
                    <div
                      key={domain.id}
                      className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC]"
                    >
                      {/* Domain row */}
                      <div
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
                        dir={isRtl ? "rtl" : "ltr"}
                      >
                        {/* Hostname + badges */}
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-[#0B2D5C]">
                              {domain.hostname}
                            </span>
                            {domain.isPrimary && (
                              <span className="rounded-full border border-[#0B2D5C]/25 bg-[#0B2D5C]/8 px-2 py-0.5 text-xs font-semibold text-[#0B2D5C]">
                                {t.primary}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${sBadge.className}`}
                            >
                              {sBadge.label}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs ${ssl.className}`}
                            >
                              {ssl.label}
                            </span>
                          </div>
                          {domain.verifiedAt && (
                            <span className="text-xs text-gray-400">
                              {new Date(domain.verifiedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        {isConfirmDelete ? (
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs font-medium text-[#0B2D5C]">
                              {t.confirmDelete}
                            </span>
                            <button
                              onClick={() => handleDelete(domain.id)}
                              className={buttonClassName("danger", "sm")}
                            >
                              {t.confirmYes}
                            </button>
                            <button
                              onClick={() => setActionState(null)}
                              className={buttonClassName("secondary", "sm")}
                            >
                              {t.confirmNo}
                            </button>
                          </div>
                        ) : (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {domain.status !== "VERIFIED" &&
                              domain.status !== "ACTIVE" && (
                                <button
                                  onClick={() => handleVerify(domain)}
                                  disabled={anyBusy}
                                  className={buttonClassName(
                                    "secondary",
                                    "sm"
                                  )}
                                >
                                  {isVerifying ? t.verifying : t.verify}
                                </button>
                              )}
                            {!domain.isPrimary &&
                              (domain.status === "VERIFIED" ||
                                domain.status === "ACTIVE") && (
                                <button
                                  onClick={() => handleMakePrimary(domain)}
                                  disabled={anyBusy}
                                  className={buttonClassName(
                                    "secondary",
                                    "sm"
                                  )}
                                >
                                  {isMakingPrimary
                                    ? t.makingPrimary
                                    : t.makePrimary}
                                </button>
                              )}
                            {!domain.isPrimary && (
                              <button
                                onClick={() =>
                                  setActionState({
                                    type: "confirmDelete",
                                    domainId: domain.id,
                                  })
                                }
                                disabled={anyBusy}
                                className={buttonClassName("danger", "sm")}
                              >
                                {isDeleting ? t.deleting : t.delete}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Verification result / instructions */}
                      {verifyExpanded && vResult && (
                        <div
                          className="border-t border-[#E5E7EB] p-4"
                          dir={isRtl ? "rtl" : "ltr"}
                        >
                          {vResult.verified ? (
                            <p className="text-sm font-medium text-emerald-700">
                              ✓ {vResult.message}
                            </p>
                          ) : (
                            <>
                              <p className="mb-3 text-sm font-medium text-amber-700">
                                {vResult.message}
                              </p>
                              {vResult.instructions && (
                                <div>
                                  <p className="mb-2 text-xs font-semibold text-[#0B2D5C]">
                                    {t.dnsInstructions}
                                  </p>
                                  <p className="mb-3 text-xs text-gray-500">
                                    {t.dnsBody}
                                  </p>
                                  <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                                          <th className="px-3 py-2 text-start font-semibold text-[#0B2D5C]">
                                            {t.dnsRecordType}
                                          </th>
                                          <th className="px-3 py-2 text-start font-semibold text-[#0B2D5C]">
                                            {t.dnsHost}
                                          </th>
                                          <th className="px-3 py-2 text-start font-semibold text-[#0B2D5C]">
                                            {t.dnsValue}
                                          </th>
                                          <th className="px-3 py-2" />
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="px-3 py-2.5 font-mono font-semibold text-[#0B2D5C]">
                                            {vResult.instructions.recordType}
                                          </td>
                                          <td className="px-3 py-2.5 font-mono text-gray-600">
                                            {vResult.instructions.host}
                                          </td>
                                          <td className="max-w-xs truncate px-3 py-2.5 font-mono text-gray-600">
                                            {vResult.instructions.value}
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <button
                                              onClick={() =>
                                                copyToClipboard(
                                                  vResult.instructions!.value,
                                                  domain.id + "-value"
                                                )
                                              }
                                              className={buttonClassName(
                                                "ghost",
                                                "sm"
                                              )}
                                            >
                                              {copiedField ===
                                              domain.id + "-value"
                                                ? t.dnsCopied
                                                : t.dnsCopy}
                                            </button>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => setExpandedVerify(null)}
                            className="mt-3 text-xs text-gray-400 underline hover:text-gray-600"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </AdminCard>

          {/* Info card */}
          <AdminCard className="p-4 sm:p-5">
            <p
              className="text-sm text-gray-600"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {t.instructions}
            </p>
          </AdminCard>
        </div>
      )}
    </CenterAdminShell>
  );
}
