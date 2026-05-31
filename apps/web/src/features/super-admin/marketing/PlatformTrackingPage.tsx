"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  getPlatformTrackingConfig,
  getPlatformTrackingLogs,
  testPlatformMetaCapi,
  updatePlatformTrackingConfig,
  type PlatformTrackingConfig,
  type PlatformTrackingConfigDto,
  type PlatformTrackingLog,
} from "@/lib/api/platform-tracking";

// ─── Dictionaries ───────────────────────────────────────────────────────────

const dictionaries = {
  en: {
    brand: { name: "RoyalCare", console: "Super Admin" },
    languages: { en: "English", ar: "Arabic", he: "Hebrew" },
    shell: { menu: "Menu", close: "Close" },
    nav: {
      dashboard: "Dashboard",
      centers: "Centers",
      subscriptions: "Subscriptions",
      domains: "Domains",
      plans: "Plans",
      users: "Users",
      notifications: "Notifications",
      auditLogs: "Audit Logs",
      settings: "Settings",
    },
    header: {
      eyebrow: "Marketing",
      title: "Platform Tracking",
      subtitle: "Configure Meta Pixel, TikTok, GA4, and GTM for RoyalCare platform pages. These settings do not affect individual center websites.",
      language: "Language",
      account: "Platform Admin",
    },
    sections: { config: "Tracking Configuration", logs: "Tracking Logs" },
    fields: {
      metaPixelId: "Meta Pixel ID",
      metaConversionApiToken: "Meta Conversion API Token",
      tiktokPixelId: "TikTok Pixel ID",
      snapPixelId: "Snapchat Pixel ID",
      ga4Id: "Google Analytics 4 ID",
      gtmId: "Google Tag Manager ID",
      testMode: "Test Mode",
    },
    hints: {
      metaConversionApiToken: "Leave blank to keep the existing token. Token is stored securely and never exposed publicly.",
      testMode: "When enabled, platform tracking scripts are not injected. Use this to pause tracking without deleting your configuration.",
    },
    labels: {
      noToken: "No token saved",
      tokenSaved: "Token saved (hidden)",
      enabled: "Enabled",
      disabled: "Disabled",
      on: "On",
      off: "Off",
      updatedAt: "Last updated",
      never: "Never",
      logsEmpty: "No tracking logs found.",
      logsUnavailable: "Logs are not available. The migration may not be applied.",
      statusSuccess: "Success",
      statusFailed: "Failed",
      statusSkipped: "Skipped",
      logsLimit: "Showing last 50 logs",
    },
    actions: {
      save: "Save Configuration",
      saving: "Saving…",
      testCapi: "Test Meta CAPI",
      testing: "Testing…",
      refreshLogs: "Refresh Logs",
    },
    errors: {
      loadFailed: "Failed to load platform tracking configuration.",
      saveFailed: "Failed to save configuration.",
      capiSuccess: "Meta CAPI test event sent successfully.",
      capiFailed: "Meta CAPI test failed.",
    },
    columns: { provider: "Provider", event: "Event", status: "Status", message: "Message", date: "Date" },
  },
  ar: {
    brand: { name: "RoyalCare", console: "سوبر أدمن" },
    languages: { en: "الإنجليزية", ar: "العربية", he: "العبرية" },
    shell: { menu: "القائمة", close: "إغلاق" },
    nav: {
      dashboard: "لوحة القيادة",
      centers: "المراكز",
      subscriptions: "الاشتراكات",
      domains: "النطاقات",
      plans: "الباقات",
      users: "المستخدمون",
      notifications: "الإشعارات",
      auditLogs: "سجل التدقيق",
      settings: "الإعدادات",
    },
    header: {
      eyebrow: "التسويق",
      title: "تتبع المنصة",
      subtitle: "إعداد Meta Pixel وTikTok وGA4 وGTM لصفحات منصة RoyalCare. لا تؤثر هذه الإعدادات على مواقع المراكز.",
      language: "اللغة",
      account: "أدمن المنصة",
    },
    sections: { config: "إعدادات التتبع", logs: "سجلات التتبع" },
    fields: {
      metaPixelId: "معرف Meta Pixel",
      metaConversionApiToken: "رمز Meta Conversion API",
      tiktokPixelId: "معرف TikTok Pixel",
      snapPixelId: "معرف Snapchat Pixel",
      ga4Id: "معرف Google Analytics 4",
      gtmId: "معرف Google Tag Manager",
      testMode: "وضع الاختبار",
    },
    hints: {
      metaConversionApiToken: "اتركه فارغاً للإبقاء على الرمز الحالي. يُحفظ الرمز بشكل آمن.",
      testMode: "عند التفعيل، لا يتم حقن نصوص التتبع في المنصة.",
    },
    labels: {
      noToken: "لا يوجد رمز محفوظ",
      tokenSaved: "الرمز محفوظ (مخفي)",
      enabled: "مفعّل",
      disabled: "معطّل",
      on: "تشغيل",
      off: "إيقاف",
      updatedAt: "آخر تحديث",
      never: "لم يُحدَّث",
      logsEmpty: "لا توجد سجلات تتبع.",
      logsUnavailable: "السجلات غير متوفرة. قد لا يكون التحديث قد طُبِّق.",
      statusSuccess: "نجاح",
      statusFailed: "فشل",
      statusSkipped: "تم التخطي",
      logsLimit: "عرض آخر 50 سجلاً",
    },
    actions: {
      save: "حفظ الإعدادات",
      saving: "جاري الحفظ…",
      testCapi: "اختبار Meta CAPI",
      testing: "جاري الاختبار…",
      refreshLogs: "تحديث السجلات",
    },
    errors: {
      loadFailed: "فشل تحميل إعدادات التتبع.",
      saveFailed: "فشل حفظ الإعدادات.",
      capiSuccess: "تم إرسال حدث اختبار Meta CAPI بنجاح.",
      capiFailed: "فشل اختبار Meta CAPI.",
    },
    columns: { provider: "المزود", event: "الحدث", status: "الحالة", message: "الرسالة", date: "التاريخ" },
  },
  he: {
    brand: { name: "RoyalCare", console: "סופר אדמין" },
    languages: { en: "אנגלית", ar: "ערבית", he: "עברית" },
    shell: { menu: "תפריט", close: "סגור" },
    nav: {
      dashboard: "לוח בקרה",
      centers: "מרכזים",
      subscriptions: "מנויים",
      domains: "דומיינים",
      plans: "תוכניות",
      users: "משתמשים",
      notifications: "התראות",
      auditLogs: "יומן ביקורת",
      settings: "הגדרות",
    },
    header: {
      eyebrow: "שיווק",
      title: "מעקב פלטפורמה",
      subtitle: "הגדר Meta Pixel, TikTok, GA4 ו-GTM עבור דפי פלטפורמת RoyalCare. הגדרות אלו אינן משפיעות על אתרי המרכזים.",
      language: "שפה",
      account: "מנהל פלטפורמה",
    },
    sections: { config: "הגדרות מעקב", logs: "יומני מעקב" },
    fields: {
      metaPixelId: "מזהה Meta Pixel",
      metaConversionApiToken: "אסימון Meta Conversion API",
      tiktokPixelId: "מזהה TikTok Pixel",
      snapPixelId: "מזהה Snapchat Pixel",
      ga4Id: "מזהה Google Analytics 4",
      gtmId: "מזהה Google Tag Manager",
      testMode: "מצב בדיקה",
    },
    hints: {
      metaConversionApiToken: "השאר ריק לשמירת האסימון הקיים. האסימון מאוחסן בצורה מאובטחת.",
      testMode: "כאשר מופעל, סקריפטי מעקב לא יוזרקו לפלטפורמה.",
    },
    labels: {
      noToken: "אין אסימון שמור",
      tokenSaved: "אסימון שמור (מוסתר)",
      enabled: "מופעל",
      disabled: "מושבת",
      on: "פועל",
      off: "כבוי",
      updatedAt: "עודכן לאחרונה",
      never: "מроד לא עודכן",
      logsEmpty: "לא נמצאו יומני מעקב.",
      logsUnavailable: "היומנים אינם זמינים. ייתכן שהמיגרציה לא הוחלה.",
      statusSuccess: "הצלחה",
      statusFailed: "כישלון",
      statusSkipped: "דולג",
      logsLimit: "מציג 50 יומנים אחרונים",
    },
    actions: {
      save: "שמור הגדרות",
      saving: "שומר…",
      testCapi: "בדוק Meta CAPI",
      testing: "בודק…",
      refreshLogs: "רענן יומנים",
    },
    errors: {
      loadFailed: "טעינת הגדרות המעקב נכשלה.",
      saveFailed: "שמירת ההגדרות נכשלה.",
      capiSuccess: "אירוע בדיקת Meta CAPI נשלח בהצלחה.",
      capiFailed: "בדיקת Meta CAPI נכשלה.",
    },
    columns: { provider: "ספק", event: "אירוע", status: "סטטוס", message: "הודעה", date: "תאריך" },
  },
};

type D = (typeof dictionaries)["en"];

// ─── Small UI helpers ────────────────────────────────────────────────────────

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-sm font-medium text-[#24364f]">{children}</span>;
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs leading-5 text-[#66758a]">{children}</p>;
}

function FieldError({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs font-medium text-rose-600">{children}</p>;
}

function Input({
  disabled,
  error,
  hint,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "password";
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <FieldLabel>{label}</FieldLabel>
      <input
        className={`h-11 w-full min-w-0 rounded-md border px-3 text-sm text-[#132238] outline-none transition focus:ring-3 focus:ring-[#0B2D5C]/12 ${
          error
            ? "border-rose-400 focus:border-rose-500"
            : "border-[#E5E7EB] focus:border-[#0B2D5C]"
        } ${disabled ? "cursor-not-allowed bg-[#F8FAFC] text-[#66758a]" : "bg-white"}`}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {hint && !error ? <FieldHint>{hint}</FieldHint> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </label>
  );
}

function Toggle({
  checked,
  disabled,
  hint,
  label,
  offLabel,
  onChange,
  onLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  label: string;
  offLabel: string;
  onChange: (v: boolean) => void;
  onLabel: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-md border border-[#E5E7EB] px-4 py-3 sm:col-span-2">
      <button
        aria-checked={checked}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${
          checked ? "border-[#0B2D5C] bg-[#0B2D5C]" : "border-[#D1D5DB] bg-[#D1D5DB]"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={`absolute top-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5"
          }`}
        />
      </button>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#24364f]">{label}</p>
        <p className="mt-0.5 text-xs text-[#66758a]">{checked ? onLabel : offLabel}</p>
        {hint ? <FieldHint>{hint}</FieldHint> : null}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-rose-50 text-rose-700 border-rose-200",
    SKIPPED: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const cls = map[status] ?? "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

// ─── Main page ───────────────────────────────────────────────────────────────

function getErrors(error: unknown): Record<string, string> {
  if (!error || typeof error !== "object") return {};
  const err = error as { details?: { errors?: Record<string, string> } };
  return err.details?.errors ?? {};
}

function getTopError(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const err = error as { details?: { message?: string } };
  return err.details?.message ?? null;
}

export function PlatformTrackingPage() {
  const { locale } = useLanguage();
  const d: D = dictionaries[locale as keyof typeof dictionaries] ?? dictionaries.en;

  const [config, setConfig] = useState<PlatformTrackingConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaCapiToken, setMetaCapiToken] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [snapPixelId, setSnapPixelId] = useState("");
  const [ga4Id, setGa4Id] = useState("");
  const [gtmId, setGtmId] = useState("");
  const [testMode, setTestMode] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isTestingCapi, setIsTestingCapi] = useState(false);
  const [capiResult, setCapiResult] = useState<{ success: boolean; message: string } | null>(null);

  const [logs, setLogs] = useState<PlatformTrackingLog[]>([]);
  const [logsUnavailable, setLogsUnavailable] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function loadConfig() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getPlatformTrackingConfig();
      if (!mounted.current) return;
      const c = result.config;
      setConfig(c);
      setMetaPixelId(c.metaPixelId ?? "");
      setTiktokPixelId(c.tiktokPixelId ?? "");
      setSnapPixelId(c.snapPixelId ?? "");
      setGa4Id(c.ga4Id ?? "");
      setGtmId(c.gtmId ?? "");
      setTestMode(c.testMode);
    } catch {
      if (mounted.current) setLoadError(d.errors.loadFailed);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }

  async function loadLogs() {
    setIsLoadingLogs(true);
    try {
      const result = await getPlatformTrackingLogs(50);
      if (!mounted.current) return;
      setLogs(result.logs);
      setLogsUnavailable(result.unavailable ?? false);
    } catch {
      if (mounted.current) setLogsUnavailable(true);
    } finally {
      if (mounted.current) setIsLoadingLogs(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadConfig();
    void loadLogs();
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const dto: PlatformTrackingConfigDto = {
        ga4Id: ga4Id || null,
        gtmId: gtmId || null,
        metaPixelId: metaPixelId || null,
        snapPixelId: snapPixelId || null,
        testMode,
        tiktokPixelId: tiktokPixelId || null,
      };
      if (metaCapiToken.trim()) {
        dto.metaConversionApiToken = metaCapiToken;
      }
      const result = await updatePlatformTrackingConfig(dto);
      if (!mounted.current) return;
      setConfig(result.config);
      setMetaCapiToken("");
      setSaveSuccess(true);
      void loadLogs();
      setTimeout(() => { if (mounted.current) setSaveSuccess(false); }, 4000);
    } catch (err) {
      if (mounted.current) setSaveError(err);
    } finally {
      if (mounted.current) setIsSaving(false);
    }
  }

  async function handleTestCapi() {
    setIsTestingCapi(true);
    setCapiResult(null);
    try {
      const result = await testPlatformMetaCapi();
      if (!mounted.current) return;
      setCapiResult({ success: result.success, message: d.errors.capiSuccess });
      void loadLogs();
    } catch {
      if (mounted.current) setCapiResult({ success: false, message: d.errors.capiFailed });
    } finally {
      if (mounted.current) setIsTestingCapi(false);
    }
  }

  const fieldErrors = getErrors(saveError);
  const topError = getTopError(saveError);

  return (
    <SuperAdminLayout activeNav="platformTracking" dictionary={d}>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Load error */}
        {loadError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {loadError}
          </div>
        ) : null}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-white border border-[#E5E7EB]" />
            ))}
          </div>
        ) : (
          <form onSubmit={(e) => void handleSave(e)}>
            {/* Save feedback */}
            {saveSuccess ? (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {d.actions.save} — OK
              </div>
            ) : null}
            {topError && !saveSuccess ? (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {topError}
              </div>
            ) : null}

            <Section title={d.sections.config}>
              <div className="space-y-5">
                {/* Config summary row */}
                {config?.updatedAt ? (
                  <p className="text-xs text-[#66758a]">
                    {d.labels.updatedAt}: {formatDate(config.updatedAt)}
                    {config.testMode ? (
                      <span className="ms-3 inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {d.labels.enabled}: {d.fields.testMode}
                      </span>
                    ) : null}
                  </p>
                ) : null}

                <FieldGroup>
                  <Input
                    error={fieldErrors.metaPixelId}
                    label={d.fields.metaPixelId}
                    onChange={setMetaPixelId}
                    placeholder="123456789012345"
                    value={metaPixelId}
                  />
                  <Input
                    error={fieldErrors.metaConversionApiToken}
                    hint={d.hints.metaConversionApiToken}
                    label={d.fields.metaConversionApiToken}
                    onChange={setMetaCapiToken}
                    placeholder={config?.hasMetaConversionApiToken ? d.labels.tokenSaved : d.labels.noToken}
                    type="password"
                    value={metaCapiToken}
                  />
                  <Input
                    error={fieldErrors.tiktokPixelId}
                    label={d.fields.tiktokPixelId}
                    onChange={setTiktokPixelId}
                    placeholder="C1A2B3D4E5F6G7H8"
                    value={tiktokPixelId}
                  />
                  <Input
                    error={fieldErrors.snapPixelId}
                    label={d.fields.snapPixelId}
                    onChange={setSnapPixelId}
                    placeholder="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
                    value={snapPixelId}
                  />
                  <Input
                    error={fieldErrors.ga4Id}
                    label={d.fields.ga4Id}
                    onChange={setGa4Id}
                    placeholder="G-XXXXXXXXXX"
                    value={ga4Id}
                  />
                  <Input
                    error={fieldErrors.gtmId}
                    label={d.fields.gtmId}
                    onChange={setGtmId}
                    placeholder="GTM-XXXXXXX"
                    value={gtmId}
                  />
                  <Toggle
                    checked={testMode}
                    hint={d.hints.testMode}
                    label={d.fields.testMode}
                    offLabel={d.labels.off}
                    onChange={setTestMode}
                    onLabel={d.labels.on}
                  />
                </FieldGroup>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 border-t border-[#E5E7EB] pt-4">
                  <button
                    className={buttonClassName("primary", "md")}
                    disabled={isSaving}
                    type="submit"
                  >
                    {isSaving ? d.actions.saving : d.actions.save}
                  </button>

                  <button
                    className={buttonClassName("secondary", "md")}
                    disabled={isTestingCapi}
                    onClick={() => void handleTestCapi()}
                    type="button"
                  >
                    {isTestingCapi ? d.actions.testing : d.actions.testCapi}
                  </button>

                  {capiResult ? (
                    <span
                      className={`text-sm font-medium ${capiResult.success ? "text-emerald-700" : "text-rose-600"}`}
                    >
                      {capiResult.message}
                    </span>
                  ) : null}
                </div>
              </div>
            </Section>
          </form>
        )}

        {/* Tracking Logs */}
        <Section title={d.sections.logs}>
          <div className="flex items-center justify-between gap-3 pb-4">
            <p className="text-xs text-[#66758a]">{d.labels.logsLimit}</p>
            <button
              className={buttonClassName("secondary", "sm")}
              disabled={isLoadingLogs}
              onClick={() => void loadLogs()}
              type="button"
            >
              {d.actions.refreshLogs}
            </button>
          </div>

          {logsUnavailable ? (
            <p className="py-4 text-center text-sm text-[#66758a]">{d.labels.logsUnavailable}</p>
          ) : isLoadingLogs ? (
            <div className="h-32 animate-pulse rounded-lg bg-[#F8FAFC]" />
          ) : logs.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#66758a]">{d.labels.logsEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-left">
                    {[d.columns.provider, d.columns.event, d.columns.status, d.columns.message, d.columns.date].map((col) => (
                      <th
                        key={col}
                        className="py-2.5 pe-4 text-xs font-semibold uppercase tracking-wider text-[#66758a]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#F3F4F6] hover:bg-[#F8FAFC]">
                      <td className="py-2.5 pe-4 font-medium text-[#0B2D5C]">{log.provider}</td>
                      <td className="py-2.5 pe-4 text-[#132238]">{log.eventName}</td>
                      <td className="py-2.5 pe-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="max-w-[200px] py-2.5 pe-4">
                        <span className="line-clamp-2 break-words text-xs text-[#66758a]">
                          {log.message ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-[#66758a]">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </SuperAdminLayout>
  );
}
