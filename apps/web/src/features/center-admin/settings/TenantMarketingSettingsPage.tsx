"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCard, AdminSectionHeader, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import {
  getTenantMarketingSettings,
  listTenantMarketingLogs,
  testTenantMetaCapi,
  updateTenantMarketingSettings,
  type MarketingTrackingLog,
  type TenantMarketingSettings,
  type TenantMarketingSettingsPayload,
} from "@/lib/api/tenant-marketing-settings";
import { formatDateTime } from "@/i18n/formatters";
import { trackMarketingEvent } from "@/lib/marketing/track-event";
import { CenterAdminShell } from "../layout/CenterAdminShell";

const emptyForm: TenantMarketingSettingsPayload = {
  customBodyScript: null,
  customHeadScript: null,
  ga4Id: null,
  gtmId: null,
  metaConversionApiToken: null,
  metaPixelId: null,
  snapPixelId: null,
  tiktokPixelId: null,
};

type FormKey = keyof TenantMarketingSettingsPayload;

const pixelFields: FormKey[] = [
  "metaPixelId",
  "tiktokPixelId",
  "snapPixelId",
  "ga4Id",
  "gtmId",
];

const scriptFields: FormKey[] = [
  "metaConversionApiToken",
  "customHeadScript",
  "customBodyScript",
];
const formFields: FormKey[] = [...pixelFields, ...scriptFields];

function normalizeForm(form: TenantMarketingSettingsPayload) {
  return formFields.reduce<TenantMarketingSettingsPayload>(
    (next, key) => ({
      ...next,
      [key]:
        typeof form[key] === "string" && form[key]?.trim()
          ? form[key]?.trim()
          : null,
    }),
    { ...emptyForm },
  );
}

export function TenantMarketingSettingsPage() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [form, setForm] = useState<TenantMarketingSettingsPayload>(emptyForm);
  const [saved, setSaved] = useState<TenantMarketingSettingsPayload>(emptyForm);
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [tokenDirty, setTokenDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState("");
  const [testState, setTestState] = useState<
    "ga4" | "meta" | "metaCapi" | "snap" | "tiktok" | null
  >(null);
  const [testMessage, setTestMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [logs, setLogs] = useState<MarketingTrackingLog[]>([]);
  const [logsState, setLogsState] = useState<"idle" | "loading" | "error">("idle");

  const applySettings = (settings: TenantMarketingSettings) => {
    const next = normalizeForm({ ...emptyForm, ...settings, metaConversionApiToken: null });
    setForm(next);
    setSaved(next);
    setHasSavedToken(settings.hasMetaConversionApiToken);
    setTokenDirty(false);
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([getTenantMarketingSettings(), listTenantMarketingLogs(20)])
      .then(([{ settings }, logResponse]) => {
        if (!isMounted) return;
        applySettings(settings);
        setLogs(logResponse.logs);
        setState("ready");
      })
      .catch(() => {
        if (isMounted) setState("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isDirty = useMemo(
    () => tokenDirty || JSON.stringify(normalizeForm(form)) !== JSON.stringify(saved),
    [form, saved, tokenDirty],
  );

  const updateField = (key: FormKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "metaConversionApiToken") setTokenDirty(true);
    setMessage("");
  };

  return (
    <CenterAdminShell
      activeNav="marketing"
      requiredPermission="settings:view"
      subtitle={(d) => d.marketing.subtitle}
      title={(d) => d.marketing.title}
    >
      {({ dictionary }) => {
        const t = dictionary.marketing;

        if (state === "loading") {
          return <AdminState className="mt-5" loading title={t.loading} />;
        }

        if (state === "error") {
          return <AdminState className="mt-5" title={t.loadError} tone="error" />;
        }

        const save = async () => {
          setSaveState("saving");
          setMessage("");
          try {
            const payload = normalizeForm(form);
            if (!tokenDirty) {
              delete payload.metaConversionApiToken;
            }
            const response = await updateTenantMarketingSettings(payload);
            applySettings(response.settings);
            setMessage(t.saved);
          } catch {
            setMessage(t.saveError);
          } finally {
            setSaveState("idle");
          }
        };

        const runClientTest = (
          provider: "ga4" | "meta" | "snap" | "tiktok",
          successMessage: string,
          errorMessage: string,
        ) => {
          setTestState(provider);
          setTestMessage(null);
          try {
            trackMarketingEvent(
              "TestMarketingEvent",
              {
                source: "tenant_marketing_settings",
              },
              { providers: [provider] },
            );
            setTestMessage({ tone: "success", text: successMessage });
          } catch {
            setTestMessage({ tone: "error", text: errorMessage });
          } finally {
            setTestState(null);
          }
        };

        const runMetaCapiTest = async () => {
          setTestState("metaCapi");
          setTestMessage(null);
          try {
            await testTenantMetaCapi();
            const logResponse = await listTenantMarketingLogs(20);
            setLogs(logResponse.logs);
            setTestMessage({ tone: "success", text: t.testMetaCapiSuccess });
          } catch {
            setTestMessage({ tone: "error", text: t.testMetaCapiError });
          } finally {
            setTestState(null);
          }
        };

        const refreshLogs = async () => {
          setLogsState("loading");
          try {
            const logResponse = await listTenantMarketingLogs(20);
            setLogs(logResponse.logs);
            setLogsState("idle");
          } catch {
            setLogsState("error");
          }
        };

        return (
          <div className="mt-5 space-y-5">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
              {t.helper}
            </p>

            {message ? (
              <p
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                  message === t.saved
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
                }`}
              >
                {message}
              </p>
            ) : null}

            <AdminCard className="p-4 sm:p-5">
              <AdminSectionHeader
                subtitle={t.pixelSubtitle}
                title={t.pixelSection}
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {pixelFields.map((key) => (
                  <TextInput
                    key={key}
                    label={t.fields[key]}
                    onChange={(value) => updateField(key, value)}
                    placeholder={t.optional}
                    value={form[key] ?? ""}
                  />
                ))}
              </div>
            </AdminCard>

            <AdminCard className="p-4 sm:p-5">
              <AdminSectionHeader
                subtitle={t.scriptSubtitle}
                title={t.scriptSection}
              />
              <div className="mt-4 space-y-4">
                <TextInput
                  helper={hasSavedToken && !tokenDirty ? t.tokenSaved : t.tokenHelper}
                  label={t.fields.metaConversionApiToken}
                  onChange={(value) => updateField("metaConversionApiToken", value)}
                  placeholder={hasSavedToken && !tokenDirty ? t.tokenPlaceholder : t.optional}
                  value={form.metaConversionApiToken ?? ""}
                />
                {hasSavedToken && !tokenDirty ? (
                  <button
                    className="text-start text-sm font-bold text-rose-700 transition hover:text-rose-800"
                    onClick={() => updateField("metaConversionApiToken", "")}
                    type="button"
                  >
                    {t.clearToken}
                  </button>
                ) : null}
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
                  {t.scriptWarning}
                </p>
                {scriptFields.slice(1).map((key) => (
                  <label className="block min-w-0" key={key}>
                    <span className="text-sm font-semibold text-[#24364f]">
                      {t.fields[key]}
                    </span>
                    <textarea
                      className="mt-2 min-h-36 w-full resize-y rounded-md border border-[#D8DEE8] bg-white px-3 py-3 font-mono text-sm text-[#132238] outline-none transition focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
                      onChange={(event) => updateField(key, event.target.value)}
                      placeholder={t.scriptPlaceholder}
                      value={form[key] ?? ""}
                    />
                  </label>
                ))}
              </div>
            </AdminCard>

            <AdminCard className="p-4 sm:p-5">
              <AdminSectionHeader
                subtitle={t.testSubtitle}
                title={t.testSection}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <TestButton
                  disabled={testState !== null}
                  label={t.testMetaPixel}
                  loading={testState === "meta"}
                  onClick={() => runClientTest("meta", t.testMetaPixelSuccess, t.testClientError)}
                />
                <TestButton
                  disabled={testState !== null}
                  label={t.testTikTokPixel}
                  loading={testState === "tiktok"}
                  onClick={() => runClientTest("tiktok", t.testTikTokSuccess, t.testClientError)}
                />
                <TestButton
                  disabled={testState !== null}
                  label={t.testGa4}
                  loading={testState === "ga4"}
                  onClick={() => runClientTest("ga4", t.testGa4Success, t.testClientError)}
                />
                <TestButton
                  disabled={testState !== null}
                  label={t.testSnapPixel}
                  loading={testState === "snap"}
                  onClick={() => runClientTest("snap", t.testSnapSuccess, t.testClientError)}
                />
                <TestButton
                  disabled={testState !== null || !hasSavedToken}
                  label={t.testMetaCapi}
                  loading={testState === "metaCapi"}
                  onClick={runMetaCapiTest}
                />
              </div>
              {testMessage ? (
                <p
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
                    testMessage.tone === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}
                >
                  {testMessage.text}
                </p>
              ) : null}
            </AdminCard>

            <AdminCard className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <AdminSectionHeader
                  subtitle={t.logsSubtitle}
                  title={t.logsSection}
                />
                <button
                  className={buttonClassName("secondary", "sm")}
                  disabled={logsState === "loading"}
                  onClick={refreshLogs}
                  type="button"
                >
                  {logsState === "loading" ? t.logsRefreshing : t.logsRefresh}
                </button>
              </div>
              {logsState === "error" ? (
                <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
                  {t.logsError}
                </p>
              ) : null}
              <div className="mt-4 space-y-3">
                {logs.length === 0 ? (
                  <p className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-4 text-sm font-semibold text-[#66758a]">
                    {t.logsEmpty}
                  </p>
                ) : (
                  logs.map((log) => (
                    <TrackingLogRow
                      key={log.id}
                      log={log}
                      providerLabels={t.logProviders}
                      statusLabels={t.logStatuses}
                    />
                  ))
                )}
              </div>
            </AdminCard>

            <div className="sticky bottom-0 z-20 -mx-4 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-[0_-12px_28px_rgba(11,45,92,0.08)] backdrop-blur sm:mx-0 sm:rounded-t-lg sm:border sm:px-5">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[#66758a]">
                  {isDirty ? t.unsaved : t.noChanges}
                </p>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <button
                    className={buttonClassName("secondary", "md")}
                    disabled={!isDirty || saveState === "saving"}
                    onClick={() => {
                      setForm(saved);
                      setMessage("");
                    }}
                    type="button"
                  >
                    {t.cancel}
                  </button>
                  <button
                    className={buttonClassName("primary", "md")}
                    disabled={!isDirty || saveState === "saving"}
                    onClick={save}
                    type="button"
                  >
                    {saveState === "saving" ? t.saving : t.save}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </CenterAdminShell>
  );
}

function TrackingLogRow({
  log,
  providerLabels,
  statusLabels,
}: {
  log: MarketingTrackingLog;
  providerLabels: Record<MarketingTrackingLog["provider"], string>;
  statusLabels: Record<MarketingTrackingLog["status"], string>;
}) {
  const statusClass =
    log.status === "SUCCESS"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : log.status === "SKIPPED"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#0B2D5C]">
              {providerLabels[log.provider] ?? log.provider}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${statusClass}`}>
              {statusLabels[log.status] ?? log.status}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[#24364f]">{log.eventName}</p>
          {log.message ? (
            <p className="mt-1 text-sm leading-6 text-[#66758a]">{log.message}</p>
          ) : null}
          {log.eventId ? (
            <p className="mt-1 break-all text-xs text-[#8A96A8]" dir="ltr">
              {log.eventId}
            </p>
          ) : null}
        </div>
        <time className="shrink-0 text-xs font-semibold text-[#66758a]">
          {formatDateTime(log.createdAt)}
        </time>
      </div>
    </div>
  );
}

function TestButton({
  disabled,
  label,
  loading,
  onClick,
}: {
  disabled: boolean;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#D8DEE8] bg-white px-3 py-2 text-sm font-bold text-[#0B2D5C] transition hover:border-[#C8A45D] hover:bg-[#C8A45D]/10 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {loading ? "..." : label}
    </button>
  );
}

function TextInput({
  helper,
  label,
  onChange,
  placeholder,
  value,
}: {
  helper?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-semibold text-[#24364f]">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {helper ? <span className="mt-1.5 block text-xs font-medium text-[#66758a]">{helper}</span> : null}
    </label>
  );
}
