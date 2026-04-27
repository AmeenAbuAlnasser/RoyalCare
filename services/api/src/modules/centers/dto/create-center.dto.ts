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
type SupportedLanguage = 'AR' | 'HE' | 'EN';
type DomainStatus = 'PENDING' | 'VERIFIED' | 'ACTIVE' | 'FAILED' | 'DISABLED';
type DomainType = 'CUSTOM' | 'SUBDOMAIN';

export class CreateCenterAdminDto {
  email?: string;
  fullName!: string;
  phone?: string;
  permissionsPreset?: string;
  temporaryPassword?: string;
  userId?: string;
}

export class CreateCenterBrandingDto {
  defaultLanguage!: SupportedLanguage;
  enabledLanguages!: SupportedLanguage[];
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: Record<string, unknown>;
}

export class CreateCenterDomainDto {
  hostname!: string;
  isPrimary?: boolean;
  status?: DomainStatus;
  type?: DomainType;
}

export class CreateCenterSubscriptionDto {
  billingInterval?: BillingInterval;
  currentPeriodEnd!: string;
  currentPeriodStart!: string;
  planCode!: string;
  planName!: string;
  status?: SubscriptionStatus;
  trialEndsAt?: string;
}

export class CreateCenterDto {
  admin?: CreateCenterAdminDto;
  branding?: CreateCenterBrandingDto;
  domain?: CreateCenterDomainDto;
  name!: string;
  primaryLanguage?: SupportedLanguage;
  slug?: string;
  status?: CenterStatus;
  subscription?: CreateCenterSubscriptionDto;
  timezone?: string;
  type!: CenterType;
}
