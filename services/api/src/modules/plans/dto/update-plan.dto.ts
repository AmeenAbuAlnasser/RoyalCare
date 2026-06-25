// code is intentionally excluded — it is the stable identifier and cannot be changed.
export class UpdatePlanDto {
  nameEn?: string;
  nameAr?: string;
  nameHe?: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  descriptionHe?: string | null;
  yearlyPrice?: number;
  currency?: string;
  isActive?: boolean;
  isPublic?: boolean;
  isPopular?: boolean;
  isContactPricing?: boolean;
  displayOrder?: number;
  maxUsers?: number | null;
  maxPatients?: number | null;
  maxAppointmentsPerMonth?: number | null;
  features?: object[] | null;
}
