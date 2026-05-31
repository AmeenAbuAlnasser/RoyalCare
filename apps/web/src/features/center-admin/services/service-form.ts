import type {
  TenantService,
  TenantServicePayload,
} from "@/lib/api/tenant-services";

export type TenantServiceFormState = {
  currency: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionHe: string;
  bufferMinutes: string;
  durationMinutes: string;
  durationUnit: "HOURS" | "MINUTES";
  followUpEnabled: boolean;
  followUpType: "FIXED_INTERVAL" | "SESSION_PLAN";
  defaultIntervalDays: string;
  totalRecommendedSessions: string;
  autoCreateNextReminder: boolean;
  reminderMessageAr: string;
  reminderMessageEn: string;
  reminderMessageHe: string;
  followUpRules: Array<{
    fromSessionNumber: string;
    toSessionNumber: string;
    intervalDays: string;
  }>;
  isActive: boolean;
  nameAr: string;
  nameEn: string;
  nameHe: string;
  price: string;
};

export type TenantServiceFormErrors = Partial<
  Record<keyof TenantServiceFormState, string>
>;

export function serviceToForm(service?: TenantService): TenantServiceFormState {
  return {
    currency: service?.currency ?? "ILS",
    descriptionAr: service?.descriptionAr ?? "",
    descriptionEn: service?.descriptionEn ?? "",
    descriptionHe: service?.descriptionHe ?? "",
    bufferMinutes: service?.bufferMinutes?.toString() ?? "0",
    durationMinutes: service?.durationMinutes?.toString() ?? "",
    durationUnit: "MINUTES",
    followUpEnabled: service?.followUpEnabled ?? false,
    followUpType: service?.followUpType ?? "FIXED_INTERVAL",
    defaultIntervalDays: service?.defaultIntervalDays?.toString() ?? "",
    totalRecommendedSessions:
      service?.totalRecommendedSessions?.toString() ?? "",
    autoCreateNextReminder: service?.autoCreateNextReminder ?? true,
    reminderMessageAr: service?.reminderMessageAr ?? "",
    reminderMessageEn: service?.reminderMessageEn ?? "",
    reminderMessageHe: service?.reminderMessageHe ?? "",
    followUpRules:
      service?.followUpRules?.map((rule) => ({
        fromSessionNumber: rule.fromSessionNumber.toString(),
        toSessionNumber: rule.toSessionNumber.toString(),
        intervalDays: rule.intervalDays.toString(),
      })) ?? [
        { fromSessionNumber: "1", toSessionNumber: "4", intervalDays: "30" },
        { fromSessionNumber: "5", toSessionNumber: "8", intervalDays: "40" },
      ],
    isActive: service?.isActive ?? true,
    nameAr: service?.nameAr ?? "",
    nameEn: service?.nameEn ?? "",
    nameHe: service?.nameHe ?? "",
    price: service?.price?.toString() ?? "",
  };
}

export function formToPayload(
  form: TenantServiceFormState,
): TenantServicePayload {
  const durationValue = Number(form.durationMinutes);
  const durationMinutes =
    form.durationMinutes && Number.isFinite(durationValue)
      ? form.durationUnit === "HOURS"
        ? durationValue * 60
        : durationValue
      : null;

  return {
    bufferMinutes: form.bufferMinutes || 0,
    currency: form.currency,
    descriptionAr: form.descriptionAr || null,
    descriptionEn: form.descriptionEn || null,
    descriptionHe: form.descriptionHe || null,
    durationMinutes,
    followUpEnabled: form.followUpEnabled,
    followUpType: form.followUpType,
    defaultIntervalDays: form.defaultIntervalDays || null,
    totalRecommendedSessions: form.totalRecommendedSessions || null,
    autoCreateNextReminder: form.autoCreateNextReminder,
    reminderMessageAr: form.reminderMessageAr || null,
    reminderMessageEn: form.reminderMessageEn || null,
    reminderMessageHe: form.reminderMessageHe || null,
    followUpRules: form.followUpEnabled
      ? form.followUpRules.map((rule) => ({
          fromSessionNumber: rule.fromSessionNumber,
          toSessionNumber: rule.toSessionNumber,
          intervalDays: rule.intervalDays,
        }))
      : null,
    isActive: form.isActive,
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    nameHe: form.nameHe,
    price: form.price || null,
  };
}
