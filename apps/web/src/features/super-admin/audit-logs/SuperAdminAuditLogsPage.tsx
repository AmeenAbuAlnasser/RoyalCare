"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminState } from "@/components/ui/admin-surfaces";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { useLanguage } from "@/i18n/LanguageProvider";
import { superAdminAuditLogsDictionaries } from "@/i18n/dictionaries/super-admin-audit-logs";
import { formatDate } from "@/i18n/formatters";
import type { SupportedLocale } from "@/i18n/locales";
import { getLocalizedBusinessName } from "@/lib/business-name";
import {
  listAuditLogs,
  type AuditLogEntry,
  type ListAuditLogsParams,
} from "@/lib/api/super-admin-audit-logs";
import {
  listSuperAdminUsers,
} from "@/lib/api/super-admin-users";

type Dictionary = (typeof superAdminAuditLogsDictionaries)["en"];

type UserOption = { id: string; fullName: string; email: string | null };

type PendingFilters = {
  centerId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
};

function getAuditLogsDictionary(locale: string): Dictionary {
  const fallback = superAdminAuditLogsDictionaries.en;
  const selected =
    superAdminAuditLogsDictionaries[locale as SupportedLocale] ?? fallback;

  return {
    ...fallback,
    ...selected,
    brand: { ...fallback.brand, ...selected.brand },
    languages: { ...fallback.languages, ...selected.languages },
    shell: { ...fallback.shell, ...selected.shell },
    nav: { ...fallback.nav, ...selected.nav },
    header: { ...fallback.header, ...selected.header },
    filters: { ...fallback.filters, ...selected.filters },
    table: { ...fallback.table, ...selected.table },
    timeline: { ...fallback.timeline, ...selected.timeline },
    metadataLabels: {
      ...fallback.metadataLabels,
      ...selected.metadataLabels,
    },
    actions: { ...fallback.actions, ...selected.actions },
    actionLabels: { ...fallback.actionLabels, ...selected.actionLabels },
    pagination: { ...fallback.pagination, ...selected.pagination },
  };
}

const ACTION_OPTIONS = [
  "CENTER_ACTIVATED",
  "CENTER_DEACTIVATED",
  "CENTER_STATUS_CHANGED",
  "PASSWORD_RESET",
  "STAFF_PASSWORD_RESET",
  "STAFF_STATUS_CHANGED",
  "TENANT_STAFF_STATUS_CHANGED",
  "TENANT_APPOINTMENT_CREATED",
  "TENANT_APPOINTMENT_UPDATED",
  "TENANT_APPOINTMENT_STATUS_CHANGED",
  "TENANT_APPOINTMENT_CANCELLED",
  "TENANT_APPOINTMENT_RESTORED",
  "TENANT_PATIENT_CREATED",
  "TENANT_PATIENT_UPDATED",
  "TENANT_PATIENT_STATUS_CHANGED",
  "TENANT_PATIENT_RESTORED",
  "TENANT_INVOICE_CREATED",
  "TENANT_INVOICE_STATUS_CHANGED",
  "TENANT_INVOICE_RESTORED",
  "TENANT_PAYMENT_ADDED",
  "TENANT_CREDIT_CREATED",
  "TENANT_CREDIT_USED",
  "TENANT_INVOICE_CANCELLED",
  "SUBSCRIPTION_INVOICE_CREATED",
  "SUBSCRIPTION_INVOICE_PAID",
  "SUBSCRIPTION_INVOICE_CANCELLED",
  "SUBSCRIPTION_INVOICE_DOWNLOADED",
  "USER_UPDATED",
  "USER_STATUS_CHANGED",
  "user.created",
  "user.updated",
  "user.status_changed",
  "user.password_reset",
  "user.center_role_assigned",
  "user.center_role_removed",
  "center.login_as",
  "LOGIN_AS_CENTER",
] as const;

const TENANT_BILLING_ACTIONS = [
  "TENANT_INVOICE_CREATED",
  "TENANT_PAYMENT_ADDED",
  "TENANT_CREDIT_CREATED",
  "TENANT_CREDIT_USED",
  "TENANT_INVOICE_CANCELLED",
] as const;

function getActionLabel(action: string, d: Dictionary): string {
  const readableFallback = action
    .replace(/[._]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    d.actionLabels[action as keyof typeof d.actionLabels] ??
    superAdminAuditLogsDictionaries.en.actionLabels[
      action as keyof typeof superAdminAuditLogsDictionaries.en.actionLabels
    ] ??
    readableFallback
  );
}

function getReadableActionLabel(
  entry: AuditLogEntry,
  d: Dictionary,
  locale: string,
): string {
  if (
    locale === "ar" &&
    entry.readableActionAr &&
    [
      "CENTER_STATUS_CHANGED",
      "CENTER_ACTIVATED",
      "CENTER_DEACTIVATED",
      "PASSWORD_RESET",
      "STAFF_PASSWORD_RESET",
      "STAFF_STATUS_CHANGED",
      "USER_STATUS_CHANGED",
      "center.login_as",
    ].includes(entry.action) &&
    entry.readableActionAr
  ) {
    return entry.readableActionAr;
  }

  const oldStatus = getMetadataString(entry.metadata, "oldStatus");
  const newStatus = getMetadataString(entry.metadata, "newStatus");
  const baseLabel = getActionLabel(entry.action, d);

  if (
    locale !== "en" &&
    oldStatus &&
    newStatus &&
    [
      "CENTER_STATUS_CHANGED",
      "CENTER_ACTIVATED",
      "CENTER_DEACTIVATED",
      "STAFF_STATUS_CHANGED",
      "TENANT_STAFF_STATUS_CHANGED",
      "USER_STATUS_CHANGED",
      "user.status_changed",
    ].includes(entry.action)
  ) {
    return `${baseLabel}: ${oldStatus} → ${newStatus}`;
  }

  return baseLabel;
}

function getMetadataString(
  metadata: Record<string, unknown> | null,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function getMetadataLabel(key: string, d: Dictionary): string {
  return (
    d.metadataLabels[key] ??
    superAdminAuditLogsDictionaries.en.metadataLabels[key] ??
    key
  );
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function firstFriendlyValue(...values: Array<string | null | undefined>) {
  return values.find((value) => value && !isUuidLike(value)) ?? "";
}

function firstValue(...values: Array<string | null | undefined>) {
  return values.find(Boolean) ?? "";
}

function secondaryId(
  friendlyValue: string,
  idValue: string | null | undefined,
) {
  return friendlyValue && idValue && idValue !== friendlyValue ? idValue : null;
}

function getLocalizedName(
  metadata: Record<string, unknown> | null,
  baseKey: string,
  locale: string,
): string {
  return firstFriendlyValue(
    getLocalizedBusinessName(
      {
        name: getMetadataString(metadata, baseKey),
        nameAr: getMetadataString(metadata, `${baseKey}Ar`),
        nameEn: getMetadataString(metadata, `${baseKey}En`),
        nameHe: getMetadataString(metadata, `${baseKey}He`),
      },
      (locale as SupportedLocale) || "en",
    ),
  );
}

function ActionBadge({
  d,
  entry,
  locale,
}: {
  d: Dictionary;
  entry: AuditLogEntry;
  locale: string;
}) {
  const action = entry.action;
  const label = getReadableActionLabel(entry, d, locale);
  const newStatus = getMetadataString(entry.metadata, "newStatus");
  const colorMap: Record<string, string> = {
    CENTER_STATUS_CHANGED:
      newStatus === "ACTIVE"
        ? "bg-green-50 text-green-700 border-green-200"
        : newStatus === "SUSPENDED"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200",
    PASSWORD_RESET: "bg-purple-50 text-purple-700 border-purple-200",
    STAFF_PASSWORD_RESET: "bg-purple-50 text-purple-700 border-purple-200",
    STAFF_STATUS_CHANGED:
      newStatus === "ACTIVE"
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-red-50 text-red-700 border-red-200",
    TENANT_STAFF_STATUS_CHANGED:
      newStatus === "ACTIVE"
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-red-50 text-red-700 border-red-200",
    USER_UPDATED: "bg-blue-50 text-blue-700 border-blue-200",
    USER_STATUS_CHANGED:
      newStatus === "ACTIVE"
        ? "bg-green-50 text-green-700 border-green-200"
        : newStatus === "SUSPENDED"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200",
    "user.created": "bg-green-50 text-green-700 border-green-200",
    "user.updated": "bg-blue-50 text-blue-700 border-blue-200",
    "user.status_changed": "bg-amber-50 text-amber-700 border-amber-200",
    "user.password_reset": "bg-purple-50 text-purple-700 border-purple-200",
    "user.center_role_assigned": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "user.center_role_removed": "bg-red-50 text-red-700 border-red-200",
    "center.login_as": "bg-slate-50 text-slate-700 border-slate-200",
    // Tenant appointment actions
    TENANT_APPOINTMENT_CREATED: "bg-blue-50 text-blue-700 border-blue-200",
    TENANT_APPOINTMENT_UPDATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    TENANT_APPOINTMENT_STATUS_CHANGED:
      newStatus === "COMPLETED"
        ? "bg-green-50 text-green-700 border-green-200"
        : newStatus === "CANCELLED" || newStatus === "NO_SHOW"
          ? "bg-red-50 text-red-700 border-red-200"
          : newStatus === "IN_PROGRESS"
            ? "bg-orange-50 text-orange-700 border-orange-200"
            : "bg-amber-50 text-amber-700 border-amber-200",
    TENANT_APPOINTMENT_CANCELLED: "bg-red-50 text-red-700 border-red-200",
    TENANT_APPOINTMENT_RESTORED: "bg-green-50 text-green-700 border-green-200",
    // Tenant patient actions
    TENANT_PATIENT_CREATED: "bg-blue-50 text-blue-700 border-blue-200",
    TENANT_PATIENT_UPDATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    TENANT_PATIENT_STATUS_CHANGED:
      newStatus === "ACTIVE"
        ? "bg-green-50 text-green-700 border-green-200"
        : newStatus === "ARCHIVED"
          ? "bg-slate-50 text-slate-700 border-slate-200"
          : "bg-amber-50 text-amber-700 border-amber-200",
    TENANT_PATIENT_RESTORED: "bg-green-50 text-green-700 border-green-200",
    // Tenant invoice actions
    TENANT_INVOICE_STATUS_CHANGED:
      newStatus === "PAID"
        ? "bg-green-50 text-green-700 border-green-200"
        : newStatus === "CANCELLED"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200",
    TENANT_INVOICE_RESTORED: "bg-amber-50 text-amber-700 border-amber-200",
    // Subscription invoice actions
    SUBSCRIPTION_INVOICE_CREATED: "bg-blue-50 text-blue-700 border-blue-200",
    SUBSCRIPTION_INVOICE_PAID: "bg-green-50 text-green-700 border-green-200",
    SUBSCRIPTION_INVOICE_CANCELLED: "bg-red-50 text-red-700 border-red-200",
    SUBSCRIPTION_INVOICE_DOWNLOADED: "bg-slate-50 text-slate-700 border-slate-200",
  };
  const cls = colorMap[action] ?? "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function TimelineDetail({
  label,
  primary,
  secondary,
  unspecified,
}: {
  label: string;
  primary?: string | null;
  secondary?: string | null;
  unspecified: string;
}) {
  const value = primary || "";
  const subValue = secondary || "";

  return (
    <div className="min-w-0 rounded-lg bg-gray-50 px-3 py-2">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="truncate text-sm font-semibold text-gray-900">
        {value || unspecified}
      </div>
      {subValue && subValue !== value && (
        <div className="truncate text-xs text-gray-500">{subValue}</div>
      )}
    </div>
  );
}

function TenantBillingAuditSummary({
  d,
  entry,
  locale,
  actorName,
  actorId,
}: {
  d: Dictionary;
  entry: AuditLogEntry;
  locale: string;
  actorName: string;
  actorId: string | null;
}) {
  if (!(TENANT_BILLING_ACTIONS as readonly string[]).includes(entry.action)) {
    return null;
  }

  const metadata = entry.metadata;
  const creditAmount =
    getMetadataString(metadata, "creditAmount") ||
    (["TENANT_CREDIT_CREATED", "TENANT_CREDIT_USED"].includes(entry.action)
      ? getMetadataString(metadata, "amount")
      : "");
  const paymentAmount =
    getMetadataString(metadata, "paymentAmount") ||
    (entry.action === "TENANT_PAYMENT_ADDED"
      ? getMetadataString(metadata, "amount")
      : "");
  const amount = getMetadataString(metadata, "amount");
  const total = getMetadataString(metadata, "total");
  const currency = getMetadataString(metadata, "currency");
  const patientName = firstFriendlyValue(
    getLocalizedName(metadata, "patientName", locale),
    getMetadataString(metadata, "patient"),
  );
  const patientId = getMetadataString(metadata, "patientId");
  const invoiceNumber = firstFriendlyValue(
    getMetadataString(metadata, "invoiceNumber"),
    getMetadataString(metadata, "displayNumber"),
    getMetadataString(metadata, "invoice"),
  );
  const invoiceId = getMetadataString(metadata, "invoiceId");
  const subscriptionInvoiceNumber = firstFriendlyValue(
    getMetadataString(metadata, "subscriptionInvoiceNumber"),
    getMetadataString(metadata, "invoiceNumber"),
  );
  const subscriptionInvoiceId = getMetadataString(
    metadata,
    "subscriptionInvoiceId",
  );
  const subscriptionId = firstValue(
    getMetadataString(metadata, "subscriptionId"),
    getMetadataString(metadata, "subscription"),
  );
  const planName = getMetadataString(metadata, "planName");
  const status = getMetadataString(metadata, "status");
  const paymentMethod = getMetadataString(metadata, "paymentMethod");
  const dueDate = formatDate(getMetadataString(metadata, "dueDate"), locale as SupportedLocale);
  const paidAt = formatDate(getMetadataString(metadata, "paidAt"), locale as SupportedLocale);
  const cancelledAt = formatDate(getMetadataString(metadata, "cancelledAt"), locale as SupportedLocale);
  const centerName = firstFriendlyValue(
    getLocalizedName(metadata, "centerName", locale),
    entry.centerName,
    entry.centerDisplayName,
    entry.center?.name,
  );
  const centerId = getMetadataString(metadata, "centerId");
  const cards: Array<{
    labelKey: string;
    primary: string;
    secondary?: string | null;
    unspecified?: string;
  }> = [];

  function addCard(
    labelKey: string,
    primary: string,
    secondary?: string | null,
    unspecified = d.table.unspecified,
  ) {
    if (!primary && !secondary) return;
    cards.push({ labelKey, primary, secondary, unspecified });
  }

  addCard("actor", actorName, null, d.table.unknownActor);
  addCard("patient", patientName, null, d.table.unknownTarget);
  addCard("centerName", centerName, null, d.table.unknownCenter);
  if (creditAmount) addCard("creditAmount", creditAmount, currency || null);
  if (paymentAmount) addCard("paymentAmount", paymentAmount, currency || null);
  if (!creditAmount && !paymentAmount) {
    addCard(
      total ? "total" : "amount",
      total || amount,
      currency || null,
    );
  }
  addCard(
    "invoice",
    invoiceNumber || d.timeline.invoiceUnavailable,
    null,
  );
  addCard("planName", planName);
  addCard("status", status);
  addCard("paymentMethod", paymentMethod);
  addCard("dueDate", dueDate);
  addCard("paidAt", paidAt);
  addCard("cancelledAt", cancelledAt);
  addCard("subscriptionId", subscriptionId);
  addCard("subscriptionInvoiceId", subscriptionInvoiceNumber);

  const technicalCards = [
    { key: "actorId", value: actorId ?? "" },
    { key: "patientId", value: patientId },
    { key: "invoiceId", value: invoiceId },
    { key: "centerId", value: centerId || entry.centerId || "" },
    { key: "subscriptionInvoiceId", value: subscriptionInvoiceId },
  ].filter((item) => item.value);

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <TimelineDetail
            key={`${entry.id}-${card.labelKey}`}
            label={getMetadataLabel(card.labelKey, d)}
            primary={card.primary}
            secondary={card.secondary}
            unspecified={card.unspecified ?? d.table.unspecified}
          />
        ))}
      </div>

      {technicalCards.length > 0 && (
        <details className="rounded-lg border border-gray-200 bg-white/60 px-3 py-2 transition-colors duration-150 open:bg-gray-50/80">
          <summary className="cursor-pointer select-none text-xs font-semibold text-gray-500 transition-colors duration-100 hover:text-gray-800">
            {d.timeline.technicalDetails}
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {technicalCards.map((item) => (
              <TimelineDetail
                key={`${entry.id}-technical-${item.key}`}
                label={getMetadataLabel(item.key, d)}
                primary={item.value}
                unspecified={d.table.unspecified}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function TimelineCard({
  d,
  entry,
  locale,
}: {
  d: Dictionary;
  entry: AuditLogEntry;
  locale: string;
}) {
  const ipAddress =
    getMetadataString(entry.metadata, "ip") ||
    getMetadataString(entry.metadata, "ipAddress");
  const device =
    getMetadataString(entry.metadata, "device") ||
    getMetadataString(entry.metadata, "userAgent");
  const metadataPatientName = firstFriendlyValue(
    getLocalizedName(entry.metadata, "patientName", locale),
    getMetadataString(entry.metadata, "patient"),
  );
  const metadataInvoiceNumber = firstFriendlyValue(
    getMetadataString(entry.metadata, "invoiceNumber"),
    getMetadataString(entry.metadata, "invoice"),
  );
  const metadataSubscriptionInvoiceNumber = firstFriendlyValue(
    getMetadataString(entry.metadata, "subscriptionInvoiceNumber"),
  );
  const metadataCenterName = firstFriendlyValue(
    getLocalizedName(entry.metadata, "centerName", locale),
  );
  const metadataActorName = getLocalizedName(
    entry.metadata,
    "actorName",
    locale,
  );
  const actorName = firstFriendlyValue(
    metadataActorName,
    entry.actorName,
    entry.actorDisplayName,
    entry.actor?.fullName,
  );
  const actorId = entry.actor?.id ?? entry.actorUserId;
  const targetName = firstFriendlyValue(
    entry.targetName,
    entry.targetDisplayName,
    entry.target?.fullName,
    metadataPatientName,
    metadataInvoiceNumber,
    metadataSubscriptionInvoiceNumber,
  );
  const targetId = firstValue(
    entry.targetId,
    entry.target?.id,
    entry.targetUserId,
    getMetadataString(entry.metadata, "patientId"),
    getMetadataString(entry.metadata, "invoiceId"),
    getMetadataString(entry.metadata, "subscriptionInvoiceId"),
  );
  const centerName = firstFriendlyValue(
    entry.centerName,
    entry.centerDisplayName,
    entry.center?.name,
    metadataCenterName,
  );
  const centerId = firstValue(
    entry.center?.id,
    entry.centerId,
    getMetadataString(entry.metadata, "centerId"),
  );
  const isTenantBillingAction = (
    TENANT_BILLING_ACTIONS as readonly string[]
  ).includes(entry.action);

  return (
    <article className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#1B4F8A]/30 hover:shadow-md sm:p-5">
      <div className="absolute bottom-4 top-4 w-1 rounded-full bg-[#1B4F8A]/20 ltr:left-0 rtl:right-0" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <ActionBadge d={d} entry={entry} locale={locale} />
          <h3 className="mt-2 break-words text-base font-semibold text-gray-950">
            {getReadableActionLabel(entry, d, locale)}
          </h3>
        </div>
        <div className="shrink-0 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
          {formatDate(entry.createdAt, locale as SupportedLocale)}
        </div>
      </div>

      {isTenantBillingAction ? (
        <TenantBillingAuditSummary
          d={d}
          entry={entry}
          locale={locale}
          actorName={actorName}
          actorId={actorId}
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <TimelineDetail
            label={d.timeline.actor}
            primary={actorName}
            secondary={
              entry.actorEmail ??
              entry.actor?.email ??
              secondaryId(actorName, actorId)
            }
            unspecified={d.table.unknownActor}
          />
          <TimelineDetail
            label={d.timeline.target}
            primary={targetName}
            secondary={
              entry.targetEmail ??
              entry.targetDisplayEmail ??
              entry.target?.email ??
              secondaryId(targetName, targetId)
            }
            unspecified={d.table.unknownTarget}
          />
          <TimelineDetail
            label={d.timeline.center}
            primary={centerName}
            secondary={secondaryId(centerName, centerId)}
            unspecified={d.table.unknownCenter}
          />
        </div>
      )}

      {(ipAddress || device) && (
        <div className="mt-3">
          <div className="mb-2 text-xs font-semibold text-gray-600">
            {d.timeline.technicalDetails}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ipAddress ? (
              <TimelineDetail
                label={d.timeline.ip}
                primary={ipAddress}
                unspecified={d.table.unspecified}
              />
            ) : null}
            {device ? (
              <TimelineDetail
                label={d.timeline.device}
                primary={device}
                unspecified={d.table.unspecified}
              />
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}

function UserAutocomplete({
  label,
  placeholder,
  noResults,
  clearSelectionLabel,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  noResults: string;
  clearSelectionLabel: string;
  value: UserOption | null;
  onChange: (user: UserOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<UserOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const delay = query.trim() ? 250 : 0;
    const timer = setTimeout(async () => {
      setLoadingOptions(true);
      try {
        const res = await listSuperAdminUsers({
          search: query.trim() || undefined,
          pageSize: 20,
        });
        if (!cancelled) {
          setOptions(
            res.data.map((u) => ({
              id: u.id,
              fullName: u.fullName,
              email: u.email ?? null,
            })),
          );
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsOpen(false);
    }
  }

  function handleSelect(user: UserOption) {
    onChange(user);
    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(-1);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setQuery("");
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlightedIndex];
      if (opt) handleSelect(opt);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" onBlur={handleContainerBlur}>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>

      {value ? (
        <div className="flex min-h-[38px] items-center gap-2 rounded-lg border border-[#1B4F8A] bg-[#EEF4FF] px-3 py-1.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[#1B4F8A]">
              {value.fullName}
            </div>
            {value.email && (
              <div className="truncate text-xs text-[#4B7ABF]">{value.email}</div>
            )}
          </div>
          <button
            type="button"
            tabIndex={0}
            className="shrink-0 rounded p-0.5 text-[#1B4F8A] transition hover:bg-[#1B4F8A]/10 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
            onClick={handleClear}
            aria-label={clearSelectionLabel}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4F8A] focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
            placeholder={placeholder}
            value={query}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
          />

          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
              {loadingOptions ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1B4F8A] border-t-transparent" />
                </div>
              ) : options.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-500">{noResults}</p>
              ) : (
                options.map((user, idx) => (
                  <button
                    key={user.id}
                    type="button"
                    tabIndex={-1}
                    className={`w-full px-3 py-2.5 text-start transition ${
                      idx === highlightedIndex
                        ? "bg-[#1B4F8A] text-white"
                        : "text-gray-900 hover:bg-gray-50"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(user)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="text-sm font-medium leading-tight">
                      {user.fullName}
                    </div>
                    {user.email && (
                      <div
                        className={`text-xs leading-tight ${
                          idx === highlightedIndex
                            ? "text-white/75"
                            : "text-gray-500"
                        }`}
                      >
                        {user.email}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SuperAdminAuditLogsPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const d = getAuditLogsDictionary(locale);

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState<ListAuditLogsParams>(() => {
    if (typeof window === "undefined") return {};
    const p = new URLSearchParams(window.location.search);
    const dateParam = p.get("date");
    const actionParam = p.get("action");
    const centerIdParam = p.get("centerId");
    const initial: ListAuditLogsParams = {};
    if (dateParam) { initial.dateFrom = dateParam; initial.dateTo = dateParam; }
    if (actionParam) initial.action = actionParam;
    if (centerIdParam) initial.centerId = centerIdParam;
    return initial;
  });
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(() => {
    if (typeof window === "undefined") return {};
    const p = new URLSearchParams(window.location.search);
    const dateParam = p.get("date");
    const actionParam = p.get("action");
    const centerIdParam = p.get("centerId");
    const initial: PendingFilters = {};
    if (dateParam) { initial.dateFrom = dateParam; initial.dateTo = dateParam; }
    if (actionParam) initial.action = actionParam;
    if (centerIdParam) initial.centerId = centerIdParam;
    return initial;
  });
  const [pendingActor, setPendingActor] = useState<UserOption | null>(null);
  const [pendingTarget, setPendingTarget] = useState<UserOption | null>(null);
  const [urlActiveFilter, setUrlActiveFilter] = useState(() => {
    if (typeof window === "undefined") return false;
    const p = new URLSearchParams(window.location.search);
    return Boolean(p.get("date") || p.get("action") || p.get("centerId"));
  });

  const isRtl = locale === "ar" || locale === "he";

  async function loadEntries(params: ListAuditLogsParams = {}) {
    setLoading(true);
    setError(null);
    try {
      const res = await listAuditLogs(params);
      setEntries(res.data);
      setPagination(res.pagination);
    } catch {
      setError(d.loadingError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadEntries(filters);
    }, 0);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function handleApplyFilters() {
    setFilters({
      ...pendingFilters,
      ...(pendingActor ? { actorUserId: pendingActor.id } : {}),
      ...(pendingTarget ? { targetUserId: pendingTarget.id } : {}),
      page: 1,
    });
  }

  function handleClearFilters() {
    setPendingFilters({});
    setPendingActor(null);
    setPendingTarget(null);
    setFilters({});
    setUrlActiveFilter(false);
    router.replace("/super-admin/audit-logs", { scroll: false });
  }

  function handlePageChange(newPage: number) {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }

  const showingFrom =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;
  const showingTo = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );

  return (
    <SuperAdminLayout activeNav="auditLogs" dictionary={d}>
      <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Active URL filter chip */}
        {urlActiveFilter && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#C8A45D]/30 bg-[#FFFBF0] px-5 py-2.5">
            <span className="text-xs font-semibold text-[#7A5C20]">
              {d.filters.activeFilterLabel}
              {pendingFilters.dateFrom ? ` · ${pendingFilters.dateFrom}` : ""}
              {pendingFilters.action ? ` · ${getActionLabel(pendingFilters.action, d)}` : ""}
              {pendingFilters.centerId ? ` · ${pendingFilters.centerId}` : ""}
            </span>
            <button
              className="ms-auto shrink-0 rounded px-2.5 py-1 text-xs font-medium text-[#7A5C20] hover:bg-[#C8A45D]/15"
              onClick={handleClearFilters}
              type="button"
            >
              {d.filters.clearFilter}
            </button>
          </div>
        )}

        {/* Filters */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            {d.filters.title}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Actor autocomplete */}
            <UserAutocomplete
              label={d.filters.actorSearchLabel}
              placeholder={d.filters.actorSearchPlaceholder}
              noResults={d.filters.actorSearchNoResults}
              clearSelectionLabel={d.actions.clearSelection}
              value={pendingActor}
              onChange={setPendingActor}
            />

            {/* Target autocomplete */}
            <UserAutocomplete
              label={d.filters.targetSearchLabel}
              placeholder={d.filters.targetSearchPlaceholder}
              noResults={d.filters.targetSearchNoResults}
              clearSelectionLabel={d.actions.clearSelection}
              value={pendingTarget}
              onChange={setPendingTarget}
            />

            {/* Center ID */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {d.filters.centerIdLabel}
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4F8A] focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                placeholder={d.filters.centerIdPlaceholder}
                type="text"
                value={pendingFilters.centerId ?? ""}
                onChange={(e) =>
                  setPendingFilters((p) => ({
                    ...p,
                    centerId: e.target.value || undefined,
                  }))
                }
              />
            </div>

            {/* Action */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {d.filters.actionLabel}
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#1B4F8A] focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                value={pendingFilters.action ?? ""}
                onChange={(e) =>
                  setPendingFilters((p) => ({
                    ...p,
                    action: e.target.value || undefined,
                  }))
                }
              >
                <option value="">{d.filters.actionPlaceholder}</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {getActionLabel(a, d)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  {d.filters.dateFromLabel}
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#1B4F8A] focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                  type="date"
                  value={pendingFilters.dateFrom ?? ""}
                  onChange={(e) =>
                    setPendingFilters((p) => ({
                      ...p,
                      dateFrom: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  {d.filters.dateToLabel}
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#1B4F8A] focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                  type="date"
                  value={pendingFilters.dateTo ?? ""}
                  onChange={(e) =>
                    setPendingFilters((p) => ({
                      ...p,
                      dateTo: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              className="rounded-lg bg-[#1B4F8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#163f6e] focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:ring-offset-1"
              onClick={handleApplyFilters}
            >
              {d.filters.applyButton}
            </button>
            <button
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={handleClearFilters}
            >
              {d.filters.clearButton}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <AdminState className="min-h-24" title={error} tone="error" />
        )}

        {/* Timeline */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          {loading ? (
            <AdminState
              loading
              title={d.header.title}
            />
          ) : entries.length === 0 ? (
            <AdminState title={d.timeline.noResults} />
          ) : (
            <div className="relative space-y-4">
              {entries.map((entry) => (
                <TimelineCard
                  key={entry.id}
                  d={d}
                  entry={entry}
                  locale={locale}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3.5">
              <p className="text-sm text-gray-600">
                {d.pagination.showing} {showingFrom}–{showingTo}{" "}
                {d.pagination.of} {pagination.total} {d.pagination.results}
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  {d.pagination.previous}
                </button>
                <button
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  {d.pagination.next}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </SuperAdminLayout>
  );
}
