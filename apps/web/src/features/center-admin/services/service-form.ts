import type {
  TenantService,
  TenantServicePayload,
} from "@/lib/api/tenant-services";

export type TenantServiceFormState = {
  currency: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionHe: string;
  durationMinutes: string;
  durationUnit: "HOURS" | "MINUTES";
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
    durationMinutes: service?.durationMinutes?.toString() ?? "",
    durationUnit: "MINUTES",
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
    currency: form.currency,
    descriptionAr: form.descriptionAr || null,
    descriptionEn: form.descriptionEn || null,
    descriptionHe: form.descriptionHe || null,
    durationMinutes,
    isActive: form.isActive,
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    nameHe: form.nameHe,
    price: form.price || null,
  };
}
