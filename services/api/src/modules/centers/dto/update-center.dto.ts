type BillingInterval = 'MONTHLY' | 'YEARLY' | 'CUSTOM';
type CenterStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'ARCHIVED';
type CenterType =
  | 'LASER'
  | 'PHYSIOTHERAPY'
  | 'HIJAMA'
  | 'BEAUTY'
  | 'WELLNESS'
  | 'MULTI_SPECIALTY';
type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';
type DomainStatus = 'PENDING' | 'VERIFIED' | 'ACTIVE' | 'FAILED' | 'DISABLED';
type DomainType = 'CUSTOM' | 'SUBDOMAIN';
type SupportedLanguage = 'AR' | 'HE' | 'EN';

export class UpdateCenterAdminDto {
  email?: string;
  fullName?: string;
  phone?: string;
}

export class UpdateCenterDomainDto {
  hostname?: string;
  isPrimary?: boolean;
  status?: DomainStatus;
  type?: DomainType;
}

export class UpdateCenterSubscriptionDto {
  billingInterval?: BillingInterval;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  planCode?: string;
  planName?: string;
  status?: SubscriptionStatus;
}

export class UpdateCenterDto {
  admin?: UpdateCenterAdminDto;
  centerName?: string;
  domain?: UpdateCenterDomainDto;
  name?: string;
  nameAr?: string | null;
  nameEn?: string | null;
  nameHe?: string | null;
  primaryLanguage?: SupportedLanguage;
  status?: CenterStatus;
  subscription?: UpdateCenterSubscriptionDto;
  type?: CenterType;
}
