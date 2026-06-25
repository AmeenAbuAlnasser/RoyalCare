"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import {
  createTenantService,
  getTenantService,
  updateTenantService,
} from "@/lib/api/tenant-services";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import { ServiceCoverUpload } from "./ServiceCoverUpload";
import {
  calculateTotalSessionsFromRules,
  formToPayload,
  serviceToForm,
  type TenantServiceFormErrors,
  type TenantServiceFormState,
} from "./service-form";

type ServiceLanguage = "EN" | "AR" | "HE";
type FollowUpRuleField =
  | "fromSessionNumber"
  | "toSessionNumber"
  | "intervalDays";

const recurringLabels = {
  en: {
    repeatEvery: "Repeat every",
    helper: "A new follow-up will be created automatically after each completed session.",
    day: "Day",
    week: "Week",
    month: "Month",
    year: "Year",
    autoWhatsapp: "Enable automatic WhatsApp reminder",
    daysBefore: "Reminder days before due date",
  },
  ar: {
    repeatEvery: "تتكرر كل",
    helper: "سيتم إنشاء متابعة جديدة تلقائيًا بعد كل جلسة مكتملة.",
    day: "يوم",
    week: "أسبوع",
    month: "شهر",
    year: "سنة",
    autoWhatsapp: "تفعيل تذكير واتساب تلقائي",
    daysBefore: "أيام التذكير قبل تاريخ المتابعة",
  },
  he: {
    repeatEvery: "חוזר כל",
    helper: "מעקב חדש ייווצר אוטומטית לאחר כל טיפול שהושלם.",
    day: "יום",
    week: "שבוע",
    month: "חודש",
    year: "שנה",
    autoWhatsapp: "הפעלת תזכורת וואטסאפ אוטומטית",
    daysBefore: "ימי תזכורת לפני תאריך היעד",
  },
} as const;

const treatmentTemplateCopy = {
  en: {
    active: "Active",
    add: "Add template",
    default: "Default",
    delete: "Delete template",
    empty: "No templates yet. Add protocols such as light, standard, or intensive plans.",
    helper:
      "Create selectable protocols for this service. Patient plans keep a snapshot of the selected template.",
    sortOrder: "Sort order",
    templateTitle: (index: number) => `Template ${index}`,
    previewTitle: "Template plan preview",
    title: "Treatment plan templates",
    usesDefaultInterval:
      "No phase rules set. The template will use its default interval.",
  },
  ar: {
    active: "نشط",
    add: "إضافة قالب",
    default: "افتراضي",
    delete: "حذف القالب",
    empty: "لا توجد قوالب بعد. أضف خططًا مثل خفيفة أو عادية أو مكثفة.",
    helper:
      "أنشئ بروتوكولات قابلة للاختيار لهذه الخدمة. خطة المريض تحفظ نسخة مستقلة من القالب المختار.",
    sortOrder: "ترتيب العرض",
    templateTitle: (index: number) => `قالب ${index}`,
    previewTitle: "معاينة الخطة الخاصة بهذا القالب",
    title: "قوالب خطط العلاج",
    usesDefaultInterval:
      "لا توجد مراحل خاصة. سيستخدم القالب فترة التذكير الافتراضية.",
  },
  he: {
    active: "פעיל",
    add: "הוספת תבנית",
    default: "ברירת מחדל",
    delete: "מחיקת תבנית",
    empty: "אין עדיין תבניות. הוסיפו פרוטוקולים כמו קל, רגיל או אינטנסיבי.",
    helper:
      "צרו פרוטוקולים לבחירה עבור שירות זה. תוכנית המטופל שומרת עותק עצמאי של התבנית שנבחרה.",
    sortOrder: "סדר הצגה",
    templateTitle: (index: number) => `תבנית ${index}`,
    previewTitle: "תצוגה מקדימה של התבנית",
    title: "תבניות תוכנית טיפול",
    usesDefaultInterval:
      "לא הוגדרו שלבים. התבנית תשתמש במרווח ברירת המחדל.",
  },
} as const;

const sectionCopy = {
  en: {
    translations: "Optional translations",
    description: "Service description",
    whatsapp: "Optional WhatsApp messages",
    advanced: "Advanced settings",
    hasData: "Has data",
  },
  ar: {
    translations: "ترجمات اختيارية",
    description: "وصف الخدمة",
    whatsapp: "رسائل واتساب اختيارية",
    advanced: "إعدادات متقدمة",
    hasData: "يحتوي بيانات",
  },
  he: {
    translations: "תרגומים אופציונליים",
    description: "תיאור השירות",
    whatsapp: "הודעות וואטסאפ אופציונליות",
    advanced: "הגדרות מתקדמות",
    hasData: "מכיל נתונים",
  },
} as const;

/**
 * Collapsible container for optional/secondary fields. Closed by default so the
 * service form stays short and focused; shows a small "has data" badge when any
 * field inside already has a value (useful in edit mode). Matches the tenant admin
 * design system and is RTL-safe (uses logical text-start / flex, no left/right).
 */
function CollapsibleSection({
  title,
  hasData,
  hasDataLabel,
  children,
}: {
  title: string;
  hasData: boolean;
  hasDataLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start transition hover:bg-[#F8FAFC]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-bold text-[#0B2D5C]">{title}</span>
          {hasData ? (
            <span className="shrink-0 rounded-full border border-[#E4CE9B] bg-[#FBF6EA] px-2 py-0.5 text-[10px] font-bold text-[#8A6D1F]">
              {hasDataLabel}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-xs font-black text-[#66758a] transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open ? (
        <div className="border-t border-[#EEF1F5] px-4 py-4">{children}</div>
      ) : null}
    </section>
  );
}

function requiredFieldsForLanguage(language: string) {
  if (language === "AR") {
    return {
      name: "nameAr",
    } as const;
  }

  if (language === "HE") {
    return {
      name: "nameHe",
    } as const;
  }

  return {
    name: "nameEn",
  } as const;
}

function validateForm(
  form: TenantServiceFormState,
  primaryLanguage: ServiceLanguage,
  dictionary: CenterAdminDictionary,
) {
  const requiredFields = requiredFieldsForLanguage(primaryLanguage);
  const nextErrors: TenantServiceFormErrors = {};
  const durationValue = Number(form.durationMinutes);
  const durationMinutes =
    form.durationUnit === "HOURS" ? durationValue * 60 : durationValue;
  const bufferValue = Number(form.bufferMinutes);

  if (!form[requiredFields.name].trim()) {
    nextErrors[requiredFields.name] = dictionary.services.fieldRequired;
  }

  if (
    form.durationMinutes &&
    (!Number.isFinite(durationValue) ||
      durationValue <= 0 ||
      !Number.isInteger(durationMinutes))
  ) {
    nextErrors.durationMinutes = dictionary.services.invalidDuration;
  }

  if (
    form.bufferMinutes &&
    (!Number.isFinite(bufferValue) ||
      bufferValue < 0 ||
      bufferValue > 240 ||
      !Number.isInteger(bufferValue))
  ) {
    nextErrors.bufferMinutes = dictionary.services.invalidBuffer;
  }

  if (form.followUpMode === "SESSION_BASED_PLAN") {
    const hasTreatmentTemplates = form.treatmentTemplates.length > 0;

      if (!hasTreatmentTemplates) {
        const hasInvalidRule = form.followUpRules.some((rule) => {
          const from = Number(rule.fromSessionNumber);
          const to = Number(rule.toSessionNumber);
          const interval = Number(rule.intervalDays);

        return (
          !Number.isInteger(from) ||
          !Number.isInteger(to) ||
          !Number.isInteger(interval) ||
          from <= 0 ||
          to < from ||
          interval <= 0
        );
      });

        if (form.followUpRules.length === 0 || hasInvalidRule) {
          nextErrors.followUpRules = dictionary.services.invalidDuration;
        }
      } else {
        const hasInvalidTemplate = form.treatmentTemplates.some((template) => {
          const total = Number(template.totalSessions);
          const defaultInterval = Number(template.defaultIntervalDays);
          const hasInvalidTotal =
            !Number.isInteger(total) ||
            total <= 0 ||
            (template.defaultIntervalDays !== "" &&
              (!Number.isInteger(defaultInterval) || defaultInterval <= 0));
          const hasInvalidPhase = template.phases.some((rule) => {
            const from = Number(rule.fromSessionNumber);
            const to = Number(rule.toSessionNumber);
            const interval = Number(rule.intervalDays);

            return (
              !Number.isInteger(from) ||
              !Number.isInteger(to) ||
              !Number.isInteger(interval) ||
              from <= 0 ||
              to < from ||
              interval <= 0
            );
          });

          return hasInvalidTotal || hasInvalidPhase;
        });

        if (hasInvalidTemplate) {
          nextErrors.treatmentTemplates = dictionary.services.invalidDuration;
        }
      }
    }

  if (form.followUpMode === "RECURRING_CONTINUOUS") {
    const recurringValue = Number(form.recurringIntervalValue);

    if (
      !form.recurringIntervalValue ||
      !Number.isInteger(recurringValue) ||
      recurringValue <= 0
    ) {
      nextErrors.recurringIntervalValue =
        dictionary.services.invalidDuration;
    }
  }

  return nextErrors;
}

function extractErrors(error: unknown, dictionary: CenterAdminDictionary) {
  if (!(error instanceof ApiRequestError)) {
    return {};
  }

  const details = error.details;

  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const source = (details as { errors?: Record<string, unknown> }).errors;

  if (!source) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => {
      const fallback =
        key === "durationMinutes"
          ? dictionary.services.invalidDuration
          : key === "bufferMinutes"
            ? dictionary.services.invalidBuffer
          : key === "price"
            ? dictionary.services.invalidPrice
            : key === "currency"
              ? dictionary.services.invalidCurrency
              : dictionary.services.fieldRequired;

      return [key, typeof value === "string" ? fallback : fallback];
    }),
  ) as TenantServiceFormErrors;
}

function parseRuleValue(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function getRuleWarnings(
  form: TenantServiceFormState,
  dictionary: CenterAdminDictionary,
) {
  if (form.followUpMode !== "SESSION_BASED_PLAN") {
    return [];
  }

  const warnings: string[] = [];
  const normalized = form.followUpRules
    .map((rule) => ({
      from: parseRuleValue(rule.fromSessionNumber),
      to: parseRuleValue(rule.toSessionNumber),
      interval: parseRuleValue(rule.intervalDays),
    }))
    .filter(
      (rule): rule is { from: number; to: number; interval: number } =>
        rule.from !== null && rule.to !== null && rule.interval !== null,
    )
    .sort((a, b) => a.from - b.from);

  if (normalized.some((rule) => rule.from <= 0 || rule.to <= 0 || rule.from > rule.to)) {
    warnings.push(dictionary.services.invalidRangeOrder);
  }

  if (normalized.some((rule) => rule.interval <= 0)) {
    warnings.push(dictionary.services.invalidIntervals);
  }

  if (normalized.some((rule, index) => {
    const next = normalized[index + 1];
    return Boolean(next && rule.to >= next.from);
  })) {
    warnings.push(dictionary.services.overlappingRanges);
  }

  if (normalized.length > 0 && normalized[0].from !== 1) {
    warnings.push(dictionary.services.firstPhaseMustStartAtOne);
  }

  if (normalized.some((rule, index) => {
    const next = normalized[index + 1];
    return Boolean(next && next.from !== rule.to + 1);
  })) {
    warnings.push(dictionary.services.noGapsAllowed);
  }

  return warnings;
}

function getPlanPreview(form: TenantServiceFormState) {
  if (form.followUpMode !== "SESSION_BASED_PLAN") return [];

  const totalSessions = calculateTotalSessionsFromRules(form.followUpRules) ?? 8;
  const sessions = Array.from({ length: Math.min(totalSessions, 12) }, (_, i) => i + 1);

  let cumulativeDays = 0;
  return sessions
    .map((session) => {
      if (session === 1) {
        return { session, interval: 0, cumulativeDays: 0 };
      }
      const match = form.followUpRules.find((r) => {
        const from = parseRuleValue(r.fromSessionNumber);
        const to = parseRuleValue(r.toSessionNumber);
        return from !== null && to !== null && session >= from && session <= to;
      });
      const interval = match
        ? parseRuleValue(match.intervalDays)
        : parseRuleValue(form.defaultIntervalDays);
      if (!interval || interval <= 0) return null;
      cumulativeDays += interval;
      return { session, interval, cumulativeDays };
    })
    .filter((item): item is { session: number; interval: number; cumulativeDays: number } => Boolean(item));
}

function getTemplatePlanPreview(
  template: TenantServiceFormState["treatmentTemplates"][number],
) {
  const totalSessions =
    calculateTotalSessionsFromRules(template.phases) ??
    parseRuleValue(template.totalSessions) ??
    0;

  if (totalSessions <= 0) {
    return [];
  }

  const sessions = Array.from(
    { length: Math.min(totalSessions, 12) },
    (_, index) => index + 1,
  );

  let cumulativeDays = 0;
  return sessions
    .map((session) => {
      if (session === 1) {
        return { session, interval: 0, cumulativeDays: 0 };
      }
      const match = template.phases.find((rule) => {
        const from = parseRuleValue(rule.fromSessionNumber);
        const to = parseRuleValue(rule.toSessionNumber);
        return from !== null && to !== null && session >= from && session <= to;
      });
      const interval = match
        ? parseRuleValue(match.intervalDays)
        : parseRuleValue(template.defaultIntervalDays);

      if (!interval || interval <= 0) {
        return null;
      }

      cumulativeDays += interval;
      return { session, interval, cumulativeDays };
    })
    .filter(
      (
        item,
      ): item is { session: number; interval: number; cumulativeDays: number } =>
        Boolean(item),
    );
}

function ruleLabel(
  dictionary: CenterAdminDictionary,
  field: FollowUpRuleField,
) {
  if (field === "fromSessionNumber") return dictionary.services.sessionsFrom;
  if (field === "toSessionNumber") return dictionary.services.sessionsTo;
  return dictionary.services.intervalDays;
}


export function TenantServiceFormPage({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const serviceId = params.id;
  const [form, setForm] = useState<TenantServiceFormState>(() =>
    serviceToForm(),
  );
  const [errors, setErrors] = useState<TenantServiceFormErrors>({});
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !serviceId) {
      return;
    }

    let isMounted = true;

    getTenantService(serviceId)
      .then((service) => {
        if (isMounted) {
          setForm(serviceToForm(service));
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mode, serviceId]);

  return (
    <CenterAdminShell
      activeNav="services"
      requiredPermission={
        mode === "create" ? "services:create" : "services:update"
      }
      subtitle={(dictionary) => dictionary.services.subtitle}
      title={(dictionary) =>
        mode === "create"
          ? dictionary.services.addService
          : dictionary.services.editService
      }
    >
      {({ dictionary, session }) => {
        const primaryLanguage = session.center.primaryLanguage as ServiceLanguage;
        const localeKey =
          primaryLanguage === "AR" ? "ar" : primaryLanguage === "HE" ? "he" : "en";
        const recurringText = recurringLabels[localeKey];
        const templateText = treatmentTemplateCopy[localeKey];
        const requiredFields = requiredFieldsForLanguage(primaryLanguage);
        const hasTreatmentTemplates = (form.treatmentTemplates ?? []).length > 0;
        const derivedTotalSessions = calculateTotalSessionsFromRules(form.followUpRules);
        const sectionText = sectionCopy[localeKey];

        // ── Name / description fields keyed by language, split into the primary
        // (always visible / required) and the secondary translations (collapsible).
        type NameKey = "nameAr" | "nameEn" | "nameHe";
        type DescKey = "descriptionAr" | "descriptionEn" | "descriptionHe";
        const setText = (key: NameKey | DescKey, value: string) =>
          setForm({ ...form, [key]: value } as TenantServiceFormState);
        const nameDefs: ReadonlyArray<{ key: NameKey; label: string; dir: "rtl" | "ltr" }> = [
          { key: "nameAr", label: dictionary.services.nameAr, dir: "rtl" },
          { key: "nameEn", label: dictionary.services.nameEn, dir: "ltr" },
          { key: "nameHe", label: dictionary.services.nameHe, dir: "rtl" },
        ];
        const descDefs: ReadonlyArray<{ key: DescKey; label: string; dir: "rtl" | "ltr" }> = [
          { key: "descriptionAr", label: dictionary.services.descriptionAr, dir: "rtl" },
          { key: "descriptionEn", label: dictionary.services.descriptionEn, dir: "ltr" },
          { key: "descriptionHe", label: dictionary.services.descriptionHe, dir: "rtl" },
        ];
        const primaryNameKey = requiredFields.name as NameKey;
        const primaryDescKey: DescKey =
          primaryLanguage === "AR"
            ? "descriptionAr"
            : primaryLanguage === "HE"
              ? "descriptionHe"
              : "descriptionEn";
        const renderNameField = (def: { key: NameKey; label: string; dir: "rtl" | "ltr" }) => (
          <Field
            className="md:col-span-2"
            error={errors[def.key]}
            isRequired={def.key === primaryNameKey}
            key={def.key}
            label={def.label}
            optionalLabel={def.key === primaryNameKey ? undefined : dictionary.services.optional}
          >
            <input
              className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
              dir={def.dir}
              onChange={(event) => setText(def.key, event.target.value)}
              value={form[def.key]}
            />
          </Field>
        );
        const renderDescField = (def: { key: DescKey; label: string; dir: "rtl" | "ltr" }) => (
          <Field
            className="md:col-span-2"
            error={errors[def.key]}
            key={def.key}
            label={def.label}
            optionalLabel={dictionary.services.optional}
          >
            <textarea
              className="min-h-24 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
              dir={def.dir}
              onChange={(event) => setText(def.key, event.target.value)}
              value={form[def.key]}
            />
          </Field>
        );
        const secondaryNameDefs = nameDefs.filter((def) => def.key !== primaryNameKey);
        const secondaryDescDefs = descDefs.filter((def) => def.key !== primaryDescKey);
        const primaryDescDef = descDefs.find((def) => def.key === primaryDescKey)!;
        const translationsHaveData = [...secondaryNameDefs, ...secondaryDescDefs].some(
          (def) => form[def.key].trim().length > 0,
        );
        const descriptionHasData = form[primaryDescKey].trim().length > 0;
        const whatsappHasData = Boolean(
          form.reminderMessageAr.trim() ||
            form.reminderMessageEn.trim() ||
            form.reminderMessageHe.trim(),
        );
        const advancedHasData = Boolean(
          form.bufferMinutes && form.bufferMinutes !== "0",
        );
        const applyPreset = (
          preset: "LASER" | "HIJAMA" | "SKINCARE",
        ) => {
          if (preset === "LASER") {
            setForm({
              ...form,
              followUpEnabled: true,
              followUpMode: "SESSION_BASED_PLAN",
              defaultIntervalDays: "30",
              totalRecommendedSessions: "8",
              followUpRules: [
                {
                  fromSessionNumber: "1",
                  toSessionNumber: "4",
                  intervalDays: "30",
                },
                {
                  fromSessionNumber: "5",
                  toSessionNumber: "8",
                  intervalDays: "40",
                },
              ],
            });
            return;
          }

          setForm({
            ...form,
            followUpEnabled: true,
            followUpMode: "SESSION_BASED_PLAN",
            defaultIntervalDays: preset === "HIJAMA" ? "90" : "30",
            totalRecommendedSessions: "",
          });
        };
        const addTreatmentTemplate = () => {
          const totalSessions = derivedTotalSessions?.toString() || "8";
          setForm({
            ...form,
            treatmentTemplates: [
              ...form.treatmentTemplates,
              {
                nameAr: "",
                nameEn: "",
                nameHe: "",
                totalSessions,
                defaultIntervalDays: form.defaultIntervalDays || "30",
                phases: form.followUpRules.map((rule) => ({ ...rule })),
                isDefault: form.treatmentTemplates.length === 0,
                isActive: true,
                sortOrder: form.treatmentTemplates.length.toString(),
              },
            ],
          });
        };
        const updateTreatmentTemplate = (
          index: number,
          patch: Partial<TenantServiceFormState["treatmentTemplates"][number]>,
        ) => {
          setForm({
            ...form,
            treatmentTemplates: form.treatmentTemplates.map((template, itemIndex) => {
              if (itemIndex !== index) {
                return patch.isDefault === true
                  ? { ...template, isDefault: false }
                  : template;
              }
              return { ...template, ...patch };
            }),
          });
        };
        const submit = async () => {
          const nextErrors = validateForm(form, primaryLanguage, dictionary);

          setErrors(nextErrors);

          if (Object.keys(nextErrors).length > 0) {
            return;
          }

          setIsSaving(true);

          try {
            const saved =
              mode === "edit" && serviceId
                ? await updateTenantService(serviceId, formToPayload(form))
                : await createTenantService(formToPayload(form));

            router.push(`/tenant/services/${saved.id}`);
          } catch (error) {
            setErrors(extractErrors(error, dictionary));
          } finally {
            setIsSaving(false);
          }
        };

        return (
          <>
            <div className="mt-5">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/services"
              >
                {dictionary.nav.services}
              </Link>
            </div>

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.services.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.services.notFound}
              </p>
            ) : null}

            {!isLoading && !loadError ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <ServiceCoverUpload
                      alt={form.coverImageAlt}
                      locale={localeKey}
                      onAltChange={(alt) =>
                        setForm({ ...form, coverImageAlt: alt })
                      }
                      onChange={(url) =>
                        setForm({ ...form, coverImageUrl: url })
                      }
                      value={form.coverImageUrl}
                    />
                  </div>
                  {renderNameField(
                    nameDefs.find((def) => def.key === primaryNameKey)!,
                  )}
                  <Field
                    error={errors.durationMinutes}
                    label={dictionary.services.durationMinutes}
                  >
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(120px,0.55fr)] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.45fr)]">
                      <input
                        className="min-h-11 w-full min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                        min="0"
                        onChange={(event) =>
                          setForm({
                            ...form,
                            durationMinutes: event.target.value,
                          })
                        }
                        step="0.25"
                        type="number"
                        value={form.durationMinutes}
                      />
                      <select
                        className="min-h-11 w-full min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                        onChange={(event) =>
                          setForm({
                            ...form,
                            durationUnit: event.target.value as
                              | "HOURS"
                              | "MINUTES",
                          })
                        }
                        value={form.durationUnit}
                      >
                        <option value="MINUTES">
                          {dictionary.services.durationUnitMinutes}
                        </option>
                        <option value="HOURS">
                          {dictionary.services.durationUnitHours}
                        </option>
                      </select>
                    </div>
                  </Field>
                  <Field error={errors.price} label={dictionary.services.price}>
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                      min="0"
                      onChange={(event) =>
                        setForm({ ...form, price: event.target.value })
                      }
                      step="0.01"
                      type="number"
                      value={form.price}
                    />
                  </Field>
                  <Field
                    error={errors.currency}
                    label={dictionary.services.currency}
                  >
                    <input
                      className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm uppercase text-[#132238]"
                      dir="ltr"
                      maxLength={3}
                      onChange={(event) =>
                        setForm({ ...form, currency: event.target.value })
                      }
                      value={form.currency}
                    />
                  </Field>
                  <label className="flex min-h-11 items-center gap-3 rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#24364f]">
                    <input
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm({ ...form, isActive: event.target.checked })
                      }
                      type="checkbox"
                    />
                    {dictionary.serviceStatuses.ACTIVE}
                  </label>
                </div>

                {/* وصف الخدمة — primary-language description (collapsible) */}
                <CollapsibleSection
                  hasData={descriptionHasData}
                  hasDataLabel={sectionText.hasData}
                  title={sectionText.description}
                >
                  <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                    {renderDescField(primaryDescDef)}
                  </div>
                </CollapsibleSection>

                {/* ترجمات اختيارية — secondary names + descriptions (collapsible) */}
                <CollapsibleSection
                  hasData={translationsHaveData}
                  hasDataLabel={sectionText.hasData}
                  title={sectionText.translations}
                >
                  <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                    {secondaryNameDefs.map(renderNameField)}
                    {secondaryDescDefs.map(renderDescField)}
                  </div>
                </CollapsibleSection>

                {/* إعدادات متقدمة — rarely-used technical fields (collapsible) */}
                <CollapsibleSection
                  hasData={advancedHasData}
                  hasDataLabel={sectionText.hasData}
                  title={sectionText.advanced}
                >
                  <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                    <Field
                      error={errors.bufferMinutes}
                      label={dictionary.services.bufferMinutes}
                    >
                      <input
                        className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                        max="240"
                        min="0"
                        onChange={(event) =>
                          setForm({ ...form, bufferMinutes: event.target.value })
                        }
                        step="1"
                        type="number"
                        value={form.bufferMinutes}
                      />
                    </Field>
                  </div>
                </CollapsibleSection>

                <section className="mt-6 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2D5C]">
                        {dictionary.services.followUpSettings}
                      </h2>
                      <p className="mt-1 text-sm text-[#66758a]">
                        {dictionary.services.followUpDescription}
                      </p>
                    </div>
                    <div className="grid min-w-0 grid-cols-1 gap-2 sm:min-w-[360px]">
                      {[
                        ["NONE", dictionary.services.followUp.none, ""],
                        ["SESSION_BASED_PLAN", dictionary.services.followUp.sessionBasedPlan, dictionary.services.followUp.sessionBasedHelper],
                        ["RECURRING_CONTINUOUS", dictionary.services.followUp.recurring, dictionary.services.followUp.recurringHelper],
                      ].map(([modeValue, label, helper]) => (
                        <label
                          className="flex min-h-11 items-center gap-3 rounded-md border border-[#D8DEE8] bg-white px-3 text-sm font-semibold text-[#24364f]"
                          key={modeValue}
                        >
                          <input
                            checked={form.followUpMode === modeValue}
                            onChange={() =>
                              setForm({
                                ...form,
                                followUpEnabled: modeValue !== "NONE",
                                followUpMode: modeValue as TenantServiceFormState["followUpMode"],
                              })
                            }
                            type="radio"
                          />
                          <span className="min-w-0">
                            <span className="block">{label}</span>
                            {helper ? <span className="mt-0.5 block text-xs font-normal text-[#66758a]">{helper}</span> : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {form.followUpMode !== "NONE" ? (
                    <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                      {form.followUpMode === "SESSION_BASED_PLAN" ? (
                        <div className="md:col-span-2 space-y-4">
                          <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
                            {dictionary.services.followUp.sessionBasedHelper}
                          </p>
                          <label className="flex min-h-11 items-center gap-3 rounded-md border border-[#D8DEE8] bg-white px-3 text-sm font-semibold text-[#24364f]">
                            <input
                              checked={form.autoCreateNextReminder}
                              onChange={(event) => setForm({ ...form, autoCreateNextReminder: event.target.checked })}
                              type="checkbox"
                            />
                            {dictionary.services.createNextReminderAutomatically}
                          </label>
                        </div>
                      ) : null}

                      {form.followUpMode === "RECURRING_CONTINUOUS" ? (
                        <>
                          <p className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 md:col-span-2">
                            {dictionary.services.followUp.recurringHelper}
                          </p>
                          <Field
                            error={errors.recurringIntervalValue}
                            label={dictionary.services.recurringIntervalLabel ?? recurringText.repeatEvery}
                          >
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,0.8fr)] gap-2">
                              <input
                                className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                min="1"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    recurringIntervalValue: event.target.value,
                                  })
                                }
                                step="1"
                                type="number"
                                value={form.recurringIntervalValue}
                              />
                              <select
                                className="min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    recurringIntervalUnit: event.target.value as TenantServiceFormState["recurringIntervalUnit"],
                                  })
                                }
                                value={form.recurringIntervalUnit}
                              >
                                <option value="DAY">{dictionary.services.recurringUnitDay ?? recurringText.day}</option>
                                <option value="WEEK">{dictionary.services.recurringUnitWeek ?? recurringText.week}</option>
                                <option value="MONTH">{dictionary.services.recurringUnitMonth ?? recurringText.month}</option>
                                <option value="YEAR">{dictionary.services.recurringUnitYear ?? recurringText.year}</option>
                              </select>
                            </div>
                          </Field>
                        </>
                      ) : null}

                      {form.followUpMode === "SESSION_BASED_PLAN" ? (
                      <div className="md:col-span-2">
                        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
                          {[
                            {
                              key: "LASER" as const,
                              label: dictionary.services.laserPreset,
                            },
                            {
                              key: "HIJAMA" as const,
                              label: dictionary.services.hijamaPreset,
                            },
                            {
                              key: "SKINCARE" as const,
                              label: dictionary.services.skincarePreset,
                            },
                          ].map((preset) => (
                            <button
                              className={buttonClassName(
                                "secondary",
                                "sm",
                                "justify-between bg-white",
                              )}
                              key={preset.key}
                              onClick={() => applyPreset(preset.key)}
                              type="button"
                            >
                              <span>{preset.label}</span>
                              <span className="text-[#C8A45D]">
                                {dictionary.services.applyPreset}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      ) : null}

                      {form.followUpMode === "SESSION_BASED_PLAN" &&
                      !hasTreatmentTemplates &&
                      form.followUpRules.length > 0 ? (
                        <div className="md:col-span-2">
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
                            <p className="text-sm font-bold text-amber-800">
                              تحويل المراحل الحالية إلى قالب
                            </p>
                            <p className="mt-1 text-xs font-semibold text-amber-700">
                              هذه الخدمة تحتوي على مراحل علاج قديمة. لاستخدام قوالب خطط العلاج الجديدة، قم بتحويل المراحل إلى قالب.
                            </p>
                            <button
                              className={buttonClassName("secondary", "sm", "mt-3")}
                              onClick={addTreatmentTemplate}
                              type="button"
                            >
                              + تحويل المراحل الحالية إلى قالب
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {form.followUpMode === "SESSION_BASED_PLAN" ? (
                        <div className="md:col-span-2">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-[#24364f]">
                                {templateText.title}
                              </h3>
                              <p className="mt-0.5 text-xs text-[#66758a]">
                                {templateText.helper}
                              </p>
                            </div>
                            <button
                              className={buttonClassName("primary", "sm", "shrink-0")}
                              onClick={addTreatmentTemplate}
                              type="button"
                            >
                              + {templateText.add}
                            </button>
                          </div>

                          {form.treatmentTemplates.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-[#D8DEE8] bg-white px-4 py-5 text-sm font-semibold text-[#66758a]">
                              {templateText.empty}
                            </p>
                          ) : (
                            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
                              {form.treatmentTemplates.map((template, templateIndex) => (
                                <div
                                  className="rounded-lg border border-[#D8DEE8] bg-white p-4 shadow-[0_10px_24px_rgba(11,45,92,0.04)]"
                                  key={template.id ?? `new-template-${templateIndex}`}
                                >
                                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <h4 className="text-sm font-bold text-[#0B2D5C]">
                                        {templateText.templateTitle(templateIndex + 1)}
                                      </h4>
                                      <p className="mt-1 text-xs font-semibold text-[#66758a]">
                                        {dictionary.services.totalSessionsSummary(
                                          Number(template.totalSessions) || 0,
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                      <label className="flex items-center gap-2 text-xs font-bold text-[#24364f]">
                                        <input
                                          checked={template.isDefault}
                                          onChange={() =>
                                            updateTreatmentTemplate(templateIndex, {
                                              isDefault: true,
                                            })
                                          }
                                          type="radio"
                                        />
                                        {templateText.default}
                                      </label>
                                      <label className="flex items-center gap-2 text-xs font-bold text-[#24364f]">
                                        <input
                                          checked={template.isActive}
                                          onChange={(event) =>
                                            updateTreatmentTemplate(templateIndex, {
                                              isActive: event.target.checked,
                                            })
                                          }
                                          type="checkbox"
                                        />
                                        {templateText.active}
                                      </label>
                                    </div>
                                  </div>

                                  <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
                                    {(["nameAr", "nameEn", "nameHe"] as const).map((field) => (
                                      <Field
                                        key={field}
                                        label={
                                          field === "nameAr"
                                            ? dictionary.services.nameAr
                                            : field === "nameEn"
                                              ? dictionary.services.nameEn
                                              : dictionary.services.nameHe
                                        }
                                        optionalLabel={dictionary.services.optional}
                                      >
                                        <input
                                          className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                          dir={field === "nameEn" ? "ltr" : "rtl"}
                                          onChange={(event) =>
                                            updateTreatmentTemplate(templateIndex, {
                                              [field]: event.target.value,
                                            })
                                          }
                                          value={template[field]}
                                        />
                                      </Field>
                                    ))}
                                    <Field label={dictionary.services.totalRecommendedSessions}>
                                      <input
                                        className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                        min="1"
                                        onChange={(event) =>
                                          updateTreatmentTemplate(templateIndex, {
                                            totalSessions: event.target.value,
                                          })
                                        }
                                        type="number"
                                        value={template.totalSessions}
                                      />
                                    </Field>
                                    <Field
                                      label={dictionary.services.defaultIntervalDays}
                                      optionalLabel={dictionary.services.optional}
                                    >
                                      <input
                                        className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                        min="1"
                                        onChange={(event) =>
                                          updateTreatmentTemplate(templateIndex, {
                                            defaultIntervalDays: event.target.value,
                                          })
                                        }
                                        type="number"
                                        value={template.defaultIntervalDays}
                                      />
                                    </Field>
                                    <Field
                                      label={templateText.sortOrder}
                                      optionalLabel={dictionary.services.optional}
                                    >
                                      <input
                                        className="min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                                        min="0"
                                        onChange={(event) =>
                                          updateTreatmentTemplate(templateIndex, {
                                            sortOrder: event.target.value,
                                          })
                                        }
                                        type="number"
                                        value={template.sortOrder}
                                      />
                                    </Field>
                                  </div>

                                  <div className="mt-4 rounded-lg border border-[#EEF1F5] bg-[#F8FAFC] p-3">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                      <p className="text-xs font-bold text-[#24364f]">
                                        {dictionary.services.treatmentPhases}
                                      </p>
                                      <button
                                        className={buttonClassName("secondary", "sm", "bg-white")}
                                        onClick={() =>
                                          updateTreatmentTemplate(templateIndex, {
                                            phases: [
                                              ...template.phases,
                                              {
                                                fromSessionNumber: "",
                                                toSessionNumber: "",
                                                intervalDays: "",
                                              },
                                            ],
                                          })
                                        }
                                        type="button"
                                      >
                                        + {dictionary.services.addRule}
                                      </button>
                                    </div>

                                    {template.phases.length === 0 ? (
                                      <p className="text-xs font-semibold text-[#66758a]">
                                        {templateText.usesDefaultInterval}
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        {template.phases.map((rule, ruleIndex) => (
                                          <div
                                            className="grid min-w-0 grid-cols-1 gap-2 rounded-md border border-[#E5E7EB] bg-white p-3 md:grid-cols-4"
                                            key={`template-${templateIndex}-phase-${ruleIndex}`}
                                          >
                                            {(["fromSessionNumber", "toSessionNumber", "intervalDays"] as FollowUpRuleField[]).map((field) => (
                                              <label className="block min-w-0" key={field}>
                                                <span className="text-[11px] font-bold text-[#66758a]">
                                                  {ruleLabel(dictionary, field)}
                                                </span>
                                                <input
                                                  className="mt-1 min-h-9 w-full rounded-md border border-[#D8DEE8] px-2 text-sm text-[#132238]"
                                                  min="1"
                                                  onChange={(event) => {
                                                    const nextPhases = [...template.phases];
                                                    nextPhases[ruleIndex] = {
                                                      ...rule,
                                                      [field]: event.target.value,
                                                    };
                                                    updateTreatmentTemplate(templateIndex, {
                                                      phases: nextPhases,
                                                    });
                                                  }}
                                                  type="number"
                                                  value={rule[field]}
                                                />
                                              </label>
                                            ))}
                                            <div className="flex items-end">
                                              <button
                                                className={buttonClassName("danger", "sm", "w-full")}
                                                onClick={() =>
                                                  updateTreatmentTemplate(templateIndex, {
                                                    phases: template.phases.filter(
                                                      (_, itemIndex) => itemIndex !== ruleIndex,
                                                    ),
                                                  })
                                                }
                                                type="button"
                                              >
                                                {dictionary.services.deletePhase}
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-4 rounded-lg border border-[#D8DEE8] bg-white p-3">
                                    <h5 className="text-xs font-bold text-[#0B2D5C]">
                                      {templateText.previewTitle}
                                    </h5>
                                    {getTemplatePlanPreview(template).length > 0 ? (
                                      <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                                        {getTemplatePlanPreview(template).map((item) => (
                                          <div
                                            className="rounded-md bg-[#F8FAFC] px-3 py-2"
                                            key={`template-${templateIndex}-preview-${item.session}`}
                                          >
                                            <div className="text-xs font-bold text-[#24364f]">
                                              {dictionary.services.previewSessionLine(
                                                item.session,
                                                item.interval,
                                              )}
                                            </div>
                                            <div
                                              className="text-[10px] font-bold text-[#C8A45D]"
                                              dir="ltr"
                                            >
                                              +{item.cumulativeDays}d
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="mt-2 text-xs font-semibold text-[#66758a]">
                                        {templateText.usesDefaultInterval}
                                      </p>
                                    )}
                                  </div>

                                  <div className="mt-4 flex justify-end">
                                    <button
                                      className={buttonClassName("danger", "sm")}
                                      onClick={() =>
                                        setForm({
                                          ...form,
                                          treatmentTemplates: form.treatmentTemplates.filter(
                                            (_, itemIndex) => itemIndex !== templateIndex,
                                          ),
                                        })
                                      }
                                      type="button"
                                    >
                                      {templateText.delete}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {errors.treatmentTemplates ? (
                            <p className="mt-3 rounded-md border border-[#F3B8B8] bg-[#FFF7F7] px-3 py-2 text-sm font-semibold text-[#B42318]">
                              {errors.treatmentTemplates}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="md:col-span-2">
                        <CollapsibleSection
                          hasData={whatsappHasData}
                          hasDataLabel={sectionText.hasData}
                          title={sectionText.whatsapp}
                        >
                          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                            <Field
                              className="md:col-span-2"
                              label={dictionary.services.whatsappMessageArabic}
                              optionalLabel={dictionary.services.optional}
                            >
                              <textarea
                                className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                dir="rtl"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    reminderMessageAr: event.target.value,
                                  })
                                }
                                value={form.reminderMessageAr}
                              />
                            </Field>
                            <Field
                              label={dictionary.services.whatsappMessageEnglish}
                              optionalLabel={dictionary.services.optional}
                            >
                              <textarea
                                className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    reminderMessageEn: event.target.value,
                                  })
                                }
                                value={form.reminderMessageEn}
                              />
                            </Field>
                            <Field
                              label={dictionary.services.whatsappMessageHebrew}
                              optionalLabel={dictionary.services.optional}
                            >
                              <textarea
                                className="min-h-20 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238]"
                                dir="rtl"
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    reminderMessageHe: event.target.value,
                                  })
                                }
                                value={form.reminderMessageHe}
                              />
                            </Field>
                          </div>
                        </CollapsibleSection>
                      </div>
                    </div>
                  ) : null}
                </section>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    className={buttonClassName("secondary", "md")}
                    href="/tenant/services"
                  >
                    {dictionary.common.cancel}
                  </Link>
                  <button
                    className={buttonClassName("primary", "md")}
                    disabled={isSaving}
                    onClick={submit}
                    type="button"
                  >
                    {isSaving
                      ? dictionary.common.saving
                      : mode === "create"
                        ? dictionary.services.submit
                        : dictionary.services.update}
                  </button>
                </div>
              </section>
            ) : null}
          </>
        );
      }}
    </CenterAdminShell>
  );
}

function getTotalSessionsSummary(
  dictionary: CenterAdminDictionary,
  _locale: "en" | "ar" | "he",
  count: number,
) {
  return dictionary.services.totalSessionsSummary(count);
}

function getTotalSessionsCalculated(
  dictionary: CenterAdminDictionary,
  _locale: "en" | "ar" | "he",
) {
  return dictionary.services.totalSessionsCalculated;
}

function SessionTotalSummary({
  count,
  dictionary,
  locale,
}: {
  count: number;
  dictionary: CenterAdminDictionary;
  locale: "en" | "ar" | "he";
}) {
  return (
    <div className="min-w-0 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
      <p className="text-sm font-bold text-[#0B2D5C]">
        {getTotalSessionsSummary(dictionary, locale, count)}
      </p>
      <p className="mt-1 text-xs font-medium leading-5 text-[#66758a]">
        {getTotalSessionsCalculated(dictionary, locale)}
      </p>
    </div>
  );
}

function Field({
  children,
  className = "",
  error,
  isRequired = false,
  label,
  optionalLabel,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  isRequired?: boolean;
  label: string;
  optionalLabel?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-sm font-semibold text-[#24364f]">
        {label}
        {isRequired ? (
          <span aria-hidden="true" className="text-[#B42318]">
            {" "}
            *
          </span>
        ) : optionalLabel ? (
          <span className="ms-2 text-xs font-medium text-[#66758a]">
            {optionalLabel}
          </span>
        ) : null}
      </span>
      <span className="mt-2 block">{children}</span>
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-[#B42318]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
