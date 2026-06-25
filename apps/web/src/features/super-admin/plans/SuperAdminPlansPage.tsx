"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName, primaryButtonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatNumber } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminPlansDictionaries } from "@/i18n/dictionaries/super-admin-plans";
import type { SupportedLocale } from "@/i18n/locales";
import {
  createSuperAdminPlan,
  deactivateSuperAdminPlan,
  listSuperAdminPlans,
  reorderSuperAdminPlans,
  updateSuperAdminPlan,
  type ApiPlanFeature,
  type CreatePlanPayload,
  type SuperAdminPlan,
} from "@/lib/api/super-admin-plans";
import { ApiRequestError } from "@/lib/api/super-admin-centers";

type Dictionary = (typeof superAdminPlansDictionaries)["en"];

// ─── Static feature definitions ───────────────────────────────────────────
const KNOWN_FEATURES: Omit<ApiPlanFeature, "included">[] = [
  { key: "website_builder",    nameEn: "Website Builder",    nameAr: "منشئ المواقع",           nameHe: "בונה אתרים"           },
  { key: "online_booking",     nameEn: "Online Booking",     nameAr: "الحجز الإلكتروني",        nameHe: "הזמנה אונליין"         },
  { key: "patients",           nameEn: "Patients",           nameAr: "المرضى",                  nameHe: "מטופלים"               },
  { key: "appointments",       nameEn: "Appointments",       nameAr: "المواعيد",                 nameHe: "תורים"                 },
  { key: "services",           nameEn: "Services",           nameAr: "الخدمات",                  nameHe: "שירותים"               },
  { key: "billing",            nameEn: "Billing",            nameAr: "الفواتير",                  nameHe: "חיוב"                  },
  { key: "patient_portal",     nameEn: "Patient Portal",     nameAr: "بوابة المريض",            nameHe: "פורטל מטופלים"         },
  { key: "marketing_tracking", nameEn: "Marketing Tracking", nameAr: "تتبع التسويق",            nameHe: "מעקב שיווקי"           },
  { key: "custom_domain",      nameEn: "Custom Domain",      nameAr: "نطاق مخصص",               nameHe: "דומיין מותאם"          },
  { key: "advanced_reports",   nameEn: "Advanced Reports",   nameAr: "تقارير متقدمة",           nameHe: "דוחות מתקדמים"         },
  { key: "unlimited_users",    nameEn: "Unlimited Users",    nameAr: "مستخدمون غير محدودين",    nameHe: "משתמשים ללא הגבלה"     },
  { key: "priority_support",   nameEn: "Priority Support",   nameAr: "دعم أولوي",               nameHe: "תמיכה מועדפת"          },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function getPlanName(plan: SuperAdminPlan, locale: SupportedLocale): string {
  if (locale === "ar") return plan.nameAr || plan.nameEn;
  if (locale === "he") return plan.nameHe || plan.nameEn;
  return plan.nameEn;
}

function getFeatureName(feature: Omit<ApiPlanFeature, "included">, locale: SupportedLocale): string {
  if (locale === "ar") return feature.nameAr;
  if (locale === "he") return feature.nameHe;
  return feature.nameEn;
}

// ─── Form state ───────────────────────────────────────────────────────────

type PlanFormState = {
  code: string;
  nameEn: string; nameAr: string; nameHe: string;
  descriptionEn: string; descriptionAr: string; descriptionHe: string;
  yearlyPrice: string;
  currency: string;
  isActive: boolean; isPublic: boolean; isPopular: boolean; isContactPricing: boolean;
  displayOrder: string;
  maxUsers: string; maxPatients: string; maxAppointmentsPerMonth: string;
  featuresIncluded: Record<string, boolean>;
};

const defaultForm: PlanFormState = {
  code: "",
  nameEn: "", nameAr: "", nameHe: "",
  descriptionEn: "", descriptionAr: "", descriptionHe: "",
  yearlyPrice: "0",
  currency: "USD",
  isActive: true, isPublic: true, isPopular: false, isContactPricing: false,
  displayOrder: "0",
  maxUsers: "", maxPatients: "", maxAppointmentsPerMonth: "",
  featuresIncluded: Object.fromEntries(KNOWN_FEATURES.map((f) => [f.key, false])),
};

function planToForm(plan: SuperAdminPlan): PlanFormState {
  const featuresIncluded: Record<string, boolean> = {};
  KNOWN_FEATURES.forEach((f) => { featuresIncluded[f.key] = false; });
  plan.features?.forEach((f) => { featuresIncluded[f.key] = f.included; });
  return {
    code: plan.code,
    nameEn: plan.nameEn, nameAr: plan.nameAr, nameHe: plan.nameHe,
    descriptionEn: plan.descriptionEn ?? "", descriptionAr: plan.descriptionAr ?? "", descriptionHe: plan.descriptionHe ?? "",
    yearlyPrice: String(plan.yearlyPrice),
    currency: plan.currency,
    isActive: plan.isActive, isPublic: plan.isPublic, isPopular: plan.isPopular, isContactPricing: plan.isContactPricing,
    displayOrder: String(plan.displayOrder),
    maxUsers: plan.maxUsers !== null ? String(plan.maxUsers) : "",
    maxPatients: plan.maxPatients !== null ? String(plan.maxPatients) : "",
    maxAppointmentsPerMonth: plan.maxAppointmentsPerMonth !== null ? String(plan.maxAppointmentsPerMonth) : "",
    featuresIncluded,
  };
}

function formToPayload(form: PlanFormState): CreatePlanPayload {
  return {
    code: form.code.trim().toUpperCase(),
    nameEn: form.nameEn.trim(), nameAr: form.nameAr.trim(), nameHe: form.nameHe.trim(),
    descriptionEn: form.descriptionEn.trim() || null,
    descriptionAr: form.descriptionAr.trim() || null,
    descriptionHe: form.descriptionHe.trim() || null,
    yearlyPrice: parseFloat(form.yearlyPrice) || 0,
    currency: form.currency.trim() || "USD",
    isActive: form.isActive, isPublic: form.isPublic, isPopular: form.isPopular, isContactPricing: form.isContactPricing,
    displayOrder: parseInt(form.displayOrder) || 0,
    maxUsers: form.maxUsers ? parseInt(form.maxUsers) : null,
    maxPatients: form.maxPatients ? parseInt(form.maxPatients) : null,
    maxAppointmentsPerMonth: form.maxAppointmentsPerMonth ? parseInt(form.maxAppointmentsPerMonth) : null,
    features: KNOWN_FEATURES.map((f) => ({ ...f, included: form.featuresIncluded[f.key] ?? false })),
  };
}

// ─── UI atoms ─────────────────────────────────────────────────────────────

function Badge({ children, tone }: { children: ReactNode; tone: "gold" | "navy" | "emerald" | "rose" | "slate" }) {
  const s: Record<string, string> = {
    gold: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    navy: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s[tone]}`}>
      {children}
    </span>
  );
}

function Toggle({ checked, id, label, onChange }: { checked: boolean; id: string; label: string; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3" htmlFor={id}>
      <button
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-[#0B2D5C]" : "bg-slate-300"}`}
        id={id}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${checked ? "start-[18px]" : "start-0.5"}`} />
      </button>
      <span className="text-sm text-[#24364f]">{label}</span>
    </label>
  );
}

function Field({
  as = "input",
  disabled,
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  as?: "input" | "textarea";
  disabled?: boolean;
  label: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  const base = "mt-1.5 w-full rounded-md border border-[#D8DEE8] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#24364f]">
        {label}{required ? <span className="ms-1 text-rose-500">*</span> : null}
      </span>
      {as === "textarea" ? (
        <textarea className={`${base} min-h-16 py-2`} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} value={value} />
      ) : (
        <input className={`${base} h-11`} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} type={type} value={value} />
      )}
    </label>
  );
}

// ─── Plan Drawer ──────────────────────────────────────────────────────────

function PlanDrawer({
  dictionary, editTarget, isRtl, locale, onClose, onSave, saveError, saving,
}: {
  dictionary: Dictionary;
  editTarget: SuperAdminPlan | null;
  isRtl: boolean;
  locale: SupportedLocale;
  onClose: () => void;
  onSave: (form: PlanFormState) => void;
  saveError: string | null;
  saving: boolean;
}) {
  const [form, setForm] = useState<PlanFormState>(() =>
    editTarget ? planToForm(editTarget) : { ...defaultForm },
  );
  const prevId = useRef(editTarget?.id);

  useEffect(() => {
    if (editTarget?.id !== prevId.current) {
      prevId.current = editTarget?.id;
      setForm(editTarget ? planToForm(editTarget) : { ...defaultForm });
    }
  }, [editTarget]);

  function set<K extends keyof PlanFormState>(k: K, v: PlanFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const isEditing = editTarget !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* backdrop — click outside to close */}
      <div className={`flex-1 bg-black/40 ${isRtl ? "order-last" : ""}`} onMouseDown={onClose} />

      {/* panel */}
      <div className={`relative flex w-full max-w-xl flex-col bg-white shadow-2xl ${isRtl ? "order-first" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="text-base font-semibold text-[#0B2D5C]">
            {isEditing
              ? `${dictionary.form.editTitle}: ${getPlanName(editTarget, locale)}`
              : dictionary.form.createTitle}
          </h2>
          <button className="rounded-md p-1.5 text-[#66758a] transition hover:bg-slate-100" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Basic */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#66758a]">{dictionary.sections.summary}</p>
            <Field disabled={isEditing} label={dictionary.fields.code} onChange={(v) => set("code", v)} placeholder="BASIC" required value={form.code} />
            <div className="grid grid-cols-3 gap-2">
              <Field label={dictionary.fields.nameEn} onChange={(v) => set("nameEn", v)} required value={form.nameEn} />
              <Field label={dictionary.fields.nameAr} onChange={(v) => set("nameAr", v)} required value={form.nameAr} />
              <Field label={dictionary.fields.nameHe} onChange={(v) => set("nameHe", v)} required value={form.nameHe} />
            </div>
            <Field as="textarea" label={dictionary.fields.descriptionEn} onChange={(v) => set("descriptionEn", v)} value={form.descriptionEn} />
            <Field as="textarea" label={dictionary.fields.descriptionAr} onChange={(v) => set("descriptionAr", v)} value={form.descriptionAr} />
            <Field as="textarea" label={dictionary.fields.descriptionHe} onChange={(v) => set("descriptionHe", v)} value={form.descriptionHe} />
          </section>

          {/* Pricing & visibility */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#66758a]">{dictionary.fields.yearlyPrice}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={dictionary.fields.yearlyPrice} onChange={(v) => set("yearlyPrice", v)} placeholder="299" type="number" value={form.yearlyPrice} />
              <Field label={dictionary.fields.currency} onChange={(v) => set("currency", v)} placeholder="USD" value={form.currency} />
            </div>
            <Field label={dictionary.fields.displayOrder} onChange={(v) => set("displayOrder", v)} type="number" value={form.displayOrder} />
            <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <Toggle checked={form.isActive}        id="f-isActive"        label={dictionary.fields.isActive}        onChange={(v) => set("isActive", v)} />
              <Toggle checked={form.isPublic}        id="f-isPublic"        label={dictionary.fields.isPublic}        onChange={(v) => set("isPublic", v)} />
              <Toggle checked={form.isPopular}       id="f-isPopular"       label={dictionary.fields.isPopular}       onChange={(v) => set("isPopular", v)} />
              <Toggle checked={form.isContactPricing} id="f-isContact"      label={dictionary.fields.isContactPricing} onChange={(v) => set("isContactPricing", v)} />
            </div>
          </section>

          {/* Features */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#66758a]">{dictionary.form.featuresSection}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {KNOWN_FEATURES.map((f) => (
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[#E5E7EB] px-3 py-2.5 transition hover:border-[#0B2D5C]/30 hover:bg-[#F8FAFC]" key={f.key}>
                  <input
                    checked={form.featuresIncluded[f.key] ?? false}
                    className="h-4 w-4 accent-[#0B2D5C]"
                    onChange={(e) => set("featuresIncluded", { ...form.featuresIncluded, [f.key]: e.target.checked })}
                    type="checkbox"
                  />
                  <span className="text-sm text-[#24364f]">{getFeatureName(f, locale)}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Limits */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#66758a]">
              {dictionary.fields.maxUsers} / {dictionary.fields.maxPatients} / {dictionary.fields.maxAppointmentsPerMonth}
            </p>
            <p className="text-xs text-[#66758a]">{dictionary.form.limitsNote}</p>
            <div className="grid grid-cols-3 gap-2">
              <Field label={dictionary.fields.maxUsers}               onChange={(v) => set("maxUsers", v)}               placeholder={dictionary.values.noLimit} type="number" value={form.maxUsers} />
              <Field label={dictionary.fields.maxPatients}            onChange={(v) => set("maxPatients", v)}            placeholder={dictionary.values.noLimit} type="number" value={form.maxPatients} />
              <Field label={dictionary.fields.maxAppointmentsPerMonth} onChange={(v) => set("maxAppointmentsPerMonth", v)} placeholder={dictionary.values.noLimit} type="number" value={form.maxAppointmentsPerMonth} />
            </div>
          </section>

          {saveError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{saveError}</p>
          ) : null}
        </div>

        {/* footer */}
        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-5 py-4">
          <button className={buttonClassName("secondary")} disabled={saving} onClick={onClose} type="button">{dictionary.form.cancel}</button>
          <button className={primaryButtonClassName()} disabled={saving} onClick={() => onSave(form)} type="button">
            {saving ? dictionary.form.saving : isEditing ? dictionary.actions.saveChanges : dictionary.actions.createPlan}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────

function PlanCard({
  canMoveDown, canMoveUp, confirmingDeactivate, deactivateError, deactivating,
  dictionary, locale, onCancelDeactivate, onConfirmDeactivate, onEdit,
  onMoveDown, onMoveUp, onRequestDeactivate, plan,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  confirmingDeactivate: boolean;
  deactivateError: string | null;
  deactivating: boolean;
  dictionary: Dictionary;
  locale: SupportedLocale;
  onCancelDeactivate: () => void;
  onConfirmDeactivate: () => void;
  onEdit: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRequestDeactivate: () => void;
  plan: SuperAdminPlan;
}) {
  const name = getPlanName(plan, locale);
  const priceLabel = plan.isContactPricing
    ? dictionary.values.contactPricing
    : `${formatNumber(plan.yearlyPrice)} ${plan.currency}${dictionary.values.perYear}`;

  return (
    <article className={`min-w-0 rounded-lg border bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)] ${plan.isPopular ? "border-[#C8A45D]/65" : "border-[#E5E7EB]"}`}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[#0B2D5C]">{name}</h3>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{plan.code}</span>
          </div>
          <p className="mt-1 text-sm text-[#66758a]">{priceLabel}</p>
        </div>
        <div className="flex gap-1">
          <button aria-label={dictionary.actions.moveUp} className={buttonClassName("ghost", "icon")} disabled={!canMoveUp} onClick={onMoveUp} title={dictionary.actions.moveUp} type="button">↑</button>
          <button aria-label={dictionary.actions.moveDown} className={buttonClassName("ghost", "icon")} disabled={!canMoveDown} onClick={onMoveDown} title={dictionary.actions.moveDown} type="button">↓</button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {plan.isPopular ? <Badge tone="gold">{dictionary.values.featured}</Badge> : null}
        {plan.isContactPricing ? <Badge tone="navy">{dictionary.values.contactPricing}</Badge> : null}
        <Badge tone={plan.isActive ? "emerald" : "slate"}>{plan.isActive ? dictionary.statuses.active : dictionary.statuses.inactive}</Badge>
        {!plan.isPublic ? <Badge tone="slate">{dictionary.values.hidden}</Badge> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#66758a]">
        <span>{dictionary.fields.displayOrder}: {plan.displayOrder}</span>
        <span>{plan.subscriptionsCount} {dictionary.values.subscriptions}</span>
      </div>

      {deactivateError ? (
        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{deactivateError}</p>
      ) : null}

      {confirmingDeactivate ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">{dictionary.actions.deactivate} — {name}?</p>
          <div className="mt-2 flex gap-2">
            <button className={buttonClassName("danger", "sm")} disabled={deactivating} onClick={onConfirmDeactivate} type="button">
              {deactivating ? "…" : dictionary.actions.deactivate}
            </button>
            <button className={buttonClassName("secondary", "sm")} onClick={onCancelDeactivate} type="button">{dictionary.form.cancel}</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={buttonClassName("secondary", "sm")} onClick={onEdit} type="button">{dictionary.actions.editPlan}</button>
          {plan.isActive ? (
            <button className={buttonClassName("warning", "sm")} onClick={onRequestDeactivate} type="button">{dictionary.actions.deactivate}</button>
          ) : null}
        </div>
      )}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export function SuperAdminPlansPage() {
  const { locale, direction } = useLanguage();
  const isRtl = direction === "rtl";
  const dictionary = superAdminPlansDictionaries[locale];

  const [plans, setPlans] = useState<SuperAdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SuperAdminPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deactivateErrors, setDeactivateErrors] = useState<Record<string, string>>({});

  const [actionMessage, setActionMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  function loadPlans() {
    setLoading(true);
    setLoadError(null);
    listSuperAdminPlans()
      .then((data) => { setPlans(data); setLoading(false); })
      .catch(() => { setLoadError(dictionary.errors.loadError); setLoading(false); });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPlans(); }, []);

  const sortedPlans = [...plans].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.createdAt.localeCompare(b.createdAt),
  );

  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.isActive).length,
    popular: plans.find((p) => p.isPopular) ?? null,
    contactCount: plans.filter((p) => p.isContactPricing).length,
  };

  async function handleMove(planId: string, dir: "up" | "down") {
    const idx = sortedPlans.findIndex((p) => p.id === planId);
    const tgt = dir === "up" ? idx - 1 : idx + 1;
    if (tgt < 0 || tgt >= sortedPlans.length) return;

    const next = [...sortedPlans];
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    const items = next.map((p, i) => ({ id: p.id, displayOrder: (i + 1) * 10 }));
    setPlans(next.map((p, i) => ({ ...p, displayOrder: (i + 1) * 10 })));
    try {
      const updated = await reorderSuperAdminPlans(items);
      setPlans(updated);
    } catch {
      setPlans(plans);
    }
  }

  async function handleDeactivate(planId: string) {
    setDeactivatingId(planId);
    setDeactivateErrors((prev) => { const n = { ...prev }; delete n[planId]; return n; });
    try {
      await deactivateSuperAdminPlan(planId);
      const updated = await listSuperAdminPlans();
      setPlans(updated);
      setConfirmDeactivateId(null);
      setActionMessage({ tone: "success", text: dictionary.messages.deactivated });
    } catch (err) {
      let msg = dictionary.errors.deactivateBlocked;
      if (err instanceof ApiRequestError) {
        const d = err.details as { errors?: { subscriptions?: string }; message?: string } | null;
        msg = d?.errors?.subscriptions ?? d?.message ?? dictionary.errors.deactivateBlocked;
      }
      setDeactivateErrors((prev) => ({ ...prev, [planId]: msg }));
      setConfirmDeactivateId(null);
    } finally {
      setDeactivatingId(null);
    }
  }

  async function handleSave(form: PlanFormState) {
    setSaving(true);
    setSaveError(null);
    try {
      if (editTarget) {
        const payload = formToPayload(form);
        // code is immutable — omit it from update payload
        const { code: _c, ...updatePayload } = payload;
        void _c;
        const updated = await updateSuperAdminPlan(editTarget.id, updatePayload);
        setPlans((prev) => prev.map((p) => (p.id === editTarget.id ? updated : p)));
        setActionMessage({ tone: "success", text: dictionary.messages.updated });
      } else {
        const created = await createSuperAdminPlan(formToPayload(form));
        setPlans((prev) => [...prev, created]);
        setActionMessage({ tone: "success", text: dictionary.messages.created });
      }
      setDrawerOpen(false);
      setEditTarget(null);
    } catch (err) {
      setSaveError(err instanceof ApiRequestError ? err.message : dictionary.errors.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SuperAdminLayout activeNav="plans" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">

        {/* Action message banner */}
        {actionMessage ? (
          <AdminState
            action={<button className={buttonClassName("secondary", "sm")} onClick={() => setActionMessage(null)} type="button">✕</button>}
            className="mb-0"
            title={actionMessage.text}
            tone={actionMessage.tone === "success" ? "success" : "error"}
          />
        ) : null}

        {/* Header */}
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">{dictionary.header.eyebrow}</p>
            <h2 className="mt-1 text-xl font-semibold text-[#0B2D5C]">{dictionary.header.title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">{dictionary.header.subtitle}</p>
          </div>
          <button
            className={primaryButtonClassName("shrink-0 w-full sm:w-auto")}
            onClick={() => { setEditTarget(null); setSaveError(null); setDrawerOpen(true); }}
            type="button"
          >
            {dictionary.actions.addNewPlan}
          </button>
        </section>

        {/* Stats */}
        {!loading && !loadError ? (
          <section className="grid min-w-0 grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: dictionary.stats.totalPlans,        value: formatNumber(stats.total)  },
              { label: dictionary.stats.activePlans,       value: formatNumber(stats.active) },
              { label: dictionary.stats.mostPopularPlan,   value: stats.popular ? getPlanName(stats.popular, locale) : "—" },
              { label: dictionary.stats.highestRevenuePlan, value: formatNumber(stats.contactCount) },
            ].map((s) => (
              <article className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]" key={s.label}>
                <p className="text-sm font-medium text-[#66758a]">{s.label}</p>
                <p className="mt-3 min-w-0 truncate text-2xl font-semibold text-[#0B2D5C]">{s.value}</p>
              </article>
            ))}
          </section>
        ) : null}

        {/* Plans list */}
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <div className="border-b border-[#E5E7EB] px-5 py-4">
            <h3 className="text-sm font-semibold text-[#0B2D5C]">{dictionary.sections.plansList}</h3>
          </div>
          <div className="p-5">
            {loading ? (
              <AdminState loading title={dictionary.header.title} />
            ) : loadError ? (
              <AdminState
                action={<button className={primaryButtonClassName("", "sm")} onClick={loadPlans} type="button">{dictionary.filters.all}</button>}
                title={loadError}
                tone="error"
              />
            ) : sortedPlans.length === 0 ? (
              <AdminState title={dictionary.values.mobileHint} />
            ) : (
              <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
                {sortedPlans.map((plan, idx) => (
                  <PlanCard
                    canMoveDown={idx < sortedPlans.length - 1}
                    canMoveUp={idx > 0}
                    confirmingDeactivate={confirmDeactivateId === plan.id}
                    deactivateError={deactivateErrors[plan.id] ?? null}
                    deactivating={deactivatingId === plan.id}
                    dictionary={dictionary}
                    key={plan.id}
                    locale={locale}
                    onCancelDeactivate={() => setConfirmDeactivateId(null)}
                    onConfirmDeactivate={() => void handleDeactivate(plan.id)}
                    onEdit={() => { setEditTarget(plan); setSaveError(null); setDrawerOpen(true); }}
                    onMoveDown={() => void handleMove(plan.id, "down")}
                    onMoveUp={() => void handleMove(plan.id, "up")}
                    onRequestDeactivate={() => {
                      setDeactivateErrors((prev) => { const n = { ...prev }; delete n[plan.id]; return n; });
                      setConfirmDeactivateId(plan.id);
                    }}
                    plan={plan}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Drawer */}
      {drawerOpen ? (
        <PlanDrawer
          dictionary={dictionary}
          editTarget={editTarget}
          isRtl={isRtl}
          locale={locale}
          onClose={() => { setDrawerOpen(false); setEditTarget(null); setSaveError(null); }}
          onSave={(form) => void handleSave(form)}
          saveError={saveError}
          saving={saving}
        />
      ) : null}
    </SuperAdminLayout>
  );
}
