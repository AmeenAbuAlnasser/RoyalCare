import type { SupportedLocale } from "@/i18n/locales";
import type { ApiPlanFeature, PublicPlan } from "@/lib/api/super-admin-plans";

export type PricingWhatsAppCopy = {
  centerName: string;
  centerType: string;
  city: string;
  perYear: string;
  placeholder: string;
  price: string;
  thanks: string;
  wantContact: string;
  wantOffer: string;
};

export function getPublicPlanName(
  plan: PublicPlan,
  locale: SupportedLocale,
): string {
  if (locale === "ar") return plan.nameAr || plan.nameEn;
  if (locale === "he") return plan.nameHe || plan.nameEn;
  return plan.nameEn;
}

export function getPublicPlanDescription(
  plan: PublicPlan,
  locale: SupportedLocale,
): string | null {
  if (locale === "ar") return plan.descriptionAr || plan.descriptionEn;
  if (locale === "he") return plan.descriptionHe || plan.descriptionEn;
  return plan.descriptionEn;
}

export function getPublicFeatureName(
  feature: ApiPlanFeature,
  locale: SupportedLocale,
): string {
  if (locale === "ar") return feature.nameAr || feature.nameEn;
  if (locale === "he") return feature.nameHe || feature.nameEn;
  return feature.nameEn;
}

function getArabicEnglishPlanName(plan: PublicPlan): string {
  const arabicName = plan.nameAr || plan.nameEn;
  return arabicName === plan.nameEn
    ? plan.nameEn
    : `${arabicName} (${plan.nameEn})`;
}

export function buildPricingWhatsAppMessage(
  plan: PublicPlan,
  copy: PricingWhatsAppCopy,
): string {
  const ph = copy.placeholder;
  const planRef = getArabicEnglishPlanName(plan);
  const arabicGreeting = "مرحبا،";

  if (plan.isContactPricing) {
    return [
      arabicGreeting,
      "",
      `${copy.wantContact} ${planRef}.`,
      "",
      copy.centerName,
      ph,
      "",
      copy.city,
      ph,
      "",
      copy.centerType,
      ph,
      "",
      copy.thanks,
    ].join("\n");
  }

  return [
    arabicGreeting,
    "",
    `${copy.wantOffer} ${planRef}.`,
    "",
    copy.price,
    `${plan.yearlyPrice} ${plan.currency} ${copy.perYear}`,
    "",
    copy.centerName,
    ph,
    "",
    copy.city,
    ph,
    "",
    copy.centerType,
    ph,
    "",
    copy.thanks,
  ].join("\n");
}

export function buildPricingWhatsAppUrl(
  salesNumber: string,
  message: string,
): string {
  const clean = salesNumber.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
