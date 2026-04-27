"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SupportedLocale } from "@/i18n/locales";
import { DateField } from "@/components/forms/DateField";
import { buttonClassName } from "@/components/ui/button-styles";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useLanguage } from "@/i18n/LanguageProvider";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import {
  API_BASE_URL,
  createSuperAdminCenter,
  type ApiCenterType,
  type ApiLanguage,
  type CreateCenterPayload,
} from "@/lib/api/super-admin-centers";
import {
  superAdminCenterWizardDictionaries,
  type CenterWizardDictionary,
} from "@/i18n/dictionaries/super-admin-center-wizard";

const stepKeys = [
  "basicInfo",
  "subscription",
  "domain",
  "branding",
  "adminAccount",
  "review",
] as const;
const brandingLanguageOrder: SupportedLocale[] = ["ar", "he", "en"];
const serviceOfferOrder = [
  "laser",
  "hijama",
  "physiotherapy",
  "occupationalTherapy",
  "beauty",
  "skinCare",
  "massage",
  "nutrition",
  "rehabilitation",
  "other",
] as const;

type StepKey = (typeof stepKeys)[number];
type ServiceKey = (typeof serviceOfferOrder)[number];
type OptionKey<T> = Extract<keyof T, string>;
type BrandingState = {
  defaultLanguage: SupportedLocale;
  enabledLanguages: SupportedLocale[];
  primaryColor: string;
  secondaryColor: string;
};
type CenterProfileState = {
  centerName: string;
  customServiceName: string;
  email: string;
  ownerName: string;
  phone: string;
  primaryCategory:
    | "medicalCenter"
    | "beautyCenter"
    | "wellnessCenter"
    | "multiSpecialtyCenter"
    | "other";
  servicesOffered: ServiceKey[];
};
type SubscriptionState = {
  autoRenewal: boolean;
  expiryDate: string;
  plan: "trial" | "starter" | "professional" | "enterprise";
  startDate: string;
};
type DomainState = {
  customDomain: string;
  dnsStatus: "pending" | "verified" | "failed";
  subdomain: string;
};
type AdminAccountState = {
  accountStatus: "active" | "pendingActivation";
  adminEmail: string;
  adminFullName: string;
  allowEmailNotifications: boolean;
  allowWhatsappNotifications: boolean;
  confirmPassword: string;
  mobileNumber: string;
  password: string;
  permissionsPreset: "fullAccess" | "standardManagement" | "limitedAccess" | "customPermissions";
  twoFactorAuthentication: boolean;
};

const languageApiMap: Record<SupportedLocale, ApiLanguage> = {
  ar: "AR",
  he: "HE",
  en: "EN",
};

const primaryCategoryApiMap: Record<
  CenterProfileState["primaryCategory"],
  ApiCenterType
> = {
  medicalCenter: "MULTI_SPECIALTY",
  beautyCenter: "BEAUTY",
  wellnessCenter: "WELLNESS",
  multiSpecialtyCenter: "MULTI_SPECIALTY",
  other: "MULTI_SPECIALTY",
};

const planCodeMap: Record<SubscriptionState["plan"], string> = {
  trial: "trial",
  starter: "starter",
  professional: "professional",
  enterprise: "enterprise",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCreateCenterPayload(
  adminAccount: AdminAccountState,
  branding: BrandingState,
  centerProfile: CenterProfileState,
  dictionary: CenterWizardDictionary,
  domain: DomainState,
  subscription: SubscriptionState,
): CreateCenterPayload {
  const hostname = (domain.customDomain || domain.subdomain).trim();

  return {
    admin: {
      email: adminAccount.adminEmail.trim(),
      fullName:
        adminAccount.adminFullName.trim() ||
        centerProfile.ownerName.trim() ||
        adminAccount.adminEmail.trim(),
      permissionsPreset: adminAccount.permissionsPreset,
      phone: adminAccount.mobileNumber.trim() || undefined,
      temporaryPassword: adminAccount.password || undefined,
    },
    branding: {
      defaultLanguage: languageApiMap[branding.defaultLanguage],
      enabledLanguages: branding.enabledLanguages.map(
        (language) => languageApiMap[language],
      ),
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      theme: {
        primaryCategory: centerProfile.primaryCategory,
        servicesOffered: centerProfile.servicesOffered,
        customServiceName: centerProfile.customServiceName || null,
      },
    },
    domain: hostname
      ? {
          hostname,
          isPrimary: true,
          status:
            domain.dnsStatus === "verified"
              ? "VERIFIED"
              : domain.dnsStatus === "failed"
                ? "FAILED"
                : "PENDING",
          type: domain.customDomain.trim() ? "CUSTOM" : "SUBDOMAIN",
        }
      : undefined,
    name: centerProfile.centerName.trim(),
    primaryLanguage: languageApiMap[branding.defaultLanguage],
    slug: slugify(centerProfile.centerName),
    subscription: {
      billingInterval: "MONTHLY",
      currentPeriodEnd: subscription.expiryDate,
      currentPeriodStart: subscription.startDate,
      planCode: planCodeMap[subscription.plan],
      planName: dictionary.plans[subscription.plan],
      status: subscription.plan === "trial" ? "TRIALING" : "ACTIVE",
    },
    timezone: "Asia/Jerusalem",
    type: primaryCategoryApiMap[centerProfile.primaryCategory],
  };
}

function validateCreateCenterForm(
  adminAccount: AdminAccountState,
  branding: BrandingState,
  centerProfile: CenterProfileState,
  dictionary: CenterWizardDictionary,
  subscription: SubscriptionState,
) {
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  if (!centerProfile.centerName.trim()) {
    missingFields.push(dictionary.fields.centerName);
  }

  if (!adminAccount.adminEmail.trim()) {
    missingFields.push(dictionary.fields.adminEmail);
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminAccount.adminEmail)) {
    invalidFields.push(dictionary.validation.invalidEmail);
  }

  if (!subscription.plan) {
    missingFields.push(dictionary.fields.subscriptionPlan);
  }

  if (!branding.defaultLanguage) {
    missingFields.push(dictionary.fields.defaultLanguage);
  }

  if (branding.enabledLanguages.length === 0) {
    missingFields.push(dictionary.fields.enabledLanguages);
  }

  if (
    branding.defaultLanguage &&
    branding.enabledLanguages.length > 0 &&
    !branding.enabledLanguages.includes(branding.defaultLanguage)
  ) {
    invalidFields.push(
      `${dictionary.fields.enabledLanguages}: ${dictionary.fields.defaultLanguage}`,
    );
  }

  if (
    adminAccount.confirmPassword.length > 0 &&
    adminAccount.password !== adminAccount.confirmPassword
  ) {
    invalidFields.push(dictionary.validation.passwordMismatch);
  }

  return {
    invalidFields,
    missingFields,
  };
}

function formatValidationMessage(
  validation: ReturnType<typeof validateCreateCenterForm>,
  dictionary: CenterWizardDictionary,
) {
  const messages: string[] = [];

  if (validation.missingFields.length > 0) {
    messages.push(
      `${dictionary.validation.requiredField}: ${validation.missingFields.join(", ")}`,
    );
  }

  if (validation.invalidFields.length > 0) {
    messages.push(validation.invalidFields.join(", "));
  }

  return messages.join(" ");
}

function FieldShell({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-[#24364f]">
        {label}
        {required ? <span className="text-[#B42318]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function TextInput({
  error,
  inputMode,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  error?: string;
  inputMode?: "email" | "numeric" | "tel" | "text" | "url";
  label: string;
  onChange?: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  value?: string;
}) {
  return (
    <FieldShell label={label} required={required}>
      <input
        aria-invalid={error ? "true" : "false"}
        className={`mt-2 h-11 w-full min-w-0 rounded-md border bg-white px-3 text-sm text-[#132238] outline-none transition focus:ring-3 ${
          error
            ? "border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/12"
            : "border-[#E5E7EB] focus:border-[#0B2D5C] focus:ring-[#0B2D5C]/12"
        }`}
        inputMode={inputMode}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? (
        <p className="mt-1 text-xs font-medium text-[#B42318]">{error}</p>
      ) : null}
    </FieldShell>
  );
}

function SelectInput<T extends Record<string, string>>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange?: (value: OptionKey<T>) => void;
  options: T;
  value?: OptionKey<T>;
}) {
  return (
    <FieldShell label={label}>
      <select
        className="mt-2 h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
        onChange={(event) => onChange?.(event.target.value as OptionKey<T>)}
        value={value}
      >
        {(Object.keys(options) as OptionKey<T>[]).map((key) => (
          <option key={key} value={key}>
            {options[key]}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function ColorInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <FieldShell label={label}>
      <div className="mt-2 flex h-11 min-w-0 items-center gap-3 rounded-md border border-[#E5E7EB] bg-white px-3">
        <input
          className="h-7 w-10 shrink-0 cursor-pointer rounded border border-[#E5E7EB] bg-transparent"
          type="color"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
        <span className="truncate text-sm font-medium text-[#24364f]">
          {value.toUpperCase()}
        </span>
      </div>
    </FieldShell>
  );
}

function ToggleLine({
  checked = true,
  dictionary,
  label,
  onChange,
}: {
  checked?: boolean;
  dictionary: CenterWizardDictionary;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <ToggleSwitch
      checked={checked}
      className="w-full max-w-sm"
      label={label}
      offLabel={dictionary.wizard.disabled}
      onChange={(nextChecked) => onChange?.(nextChecked)}
      onLabel={dictionary.wizard.enabled}
    />
  );
}

function LogoUpload({
  dictionary,
  fileName,
  onFileChange,
  previewUrl,
}: {
  dictionary: CenterWizardDictionary;
  fileName: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string;
}) {
  return (
    <FieldShell label={dictionary.fields.logoUpload}>
      <div className="mt-2 min-w-0 rounded-md border border-dashed border-[#C8A45D]/55 bg-[#F8FAFC] p-4">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={dictionary.wizard.logoPreviewAlt}
                className="h-full w-full object-contain"
                src={previewUrl}
              />
            ) : (
              <span className="text-xs font-semibold text-[#0B2D5C]">
                RC
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-6 text-[#66758a]">
              {dictionary.wizard.uploadHint}
            </p>
            {fileName ? (
              <p className="mt-2 break-words text-sm font-semibold text-[#0B2D5C]">
                {dictionary.wizard.selectedLogo}: {fileName}
              </p>
            ) : null}
            <label className={buttonClassName("secondary", "sm", "mt-3 cursor-pointer")}>
              {dictionary.wizard.chooseLogo}
              <input
                accept="image/*"
                className="sr-only"
                onChange={onFileChange}
                type="file"
              />
            </label>
          </div>
        </div>
      </div>
    </FieldShell>
  );
}

function FormSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 p-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function ReviewCard({
  children,
  items,
  title,
}: {
  children?: ReactNode;
  items: Array<[string, string]>;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      {children ? <div className="mt-4">{children}</div> : null}
      <dl className="mt-4 space-y-3">
        {items.map(([label, value]) => (
          <div
            className="grid min-w-0 grid-cols-1 gap-1 border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
            key={label}
          >
            <dt className="text-sm text-[#66758a]">{label}</dt>
            <dd className="min-w-0 break-words text-sm font-medium text-[#24364f]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function renderStepContent(
  activeStep: StepKey,
  adminAccount: AdminAccountState,
  centerProfile: CenterProfileState,
  dictionary: CenterWizardDictionary,
  locale: SupportedLocale,
  branding: BrandingState,
  subscription: SubscriptionState,
  domain: DomainState,
  logoFileName: string,
  logoPreviewUrl: string,
  onAdminAccountChange: (nextAdminAccount: Partial<AdminAccountState>) => void,
  onBrandingChange: (nextBranding: Partial<BrandingState>) => void,
  onCenterProfileChange: (nextCenterProfile: Partial<CenterProfileState>) => void,
  onSubscriptionChange: (nextSubscription: Partial<SubscriptionState>) => void,
  onDomainChange: (nextDomain: Partial<DomainState>) => void,
  onEnabledLanguageChange: (
    language: SupportedLocale,
    isEnabled: boolean,
  ) => void,
  onServiceOfferedChange: (service: ServiceKey, isEnabled: boolean) => void,
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void,
) {
  switch (activeStep) {
    case "basicInfo":
      return (
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <FormSection title={dictionary.groups.centerIdentity}>
            <TextInput
              label={dictionary.fields.centerName}
              onChange={(centerName) => onCenterProfileChange({ centerName })}
              placeholder={dictionary.placeholders.centerName}
              value={centerProfile.centerName}
            />
            <SelectInput
              label={dictionary.fields.primaryCategory}
              onChange={(primaryCategory) =>
                onCenterProfileChange({
                  primaryCategory:
                    primaryCategory as CenterProfileState["primaryCategory"],
                })
              }
              options={dictionary.primaryCategories}
              value={centerProfile.primaryCategory}
            />
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-[#24364f]">
                {dictionary.fields.servicesOffered}
              </p>
              <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                {serviceOfferOrder.map((service) => (
                  <ToggleLine
                    checked={centerProfile.servicesOffered.includes(service)}
                    dictionary={dictionary}
                    key={service}
                    label={dictionary.offeredServices[service]}
                    onChange={(isEnabled) =>
                      onServiceOfferedChange(service, isEnabled)
                    }
                  />
                ))}
              </div>
            </div>
            {centerProfile.servicesOffered.includes("other") ? (
              <div className="md:col-span-2">
                <TextInput
                  label={dictionary.fields.customServiceName}
                  onChange={(customServiceName) =>
                    onCenterProfileChange({ customServiceName })
                  }
                  placeholder={dictionary.placeholders.customServiceName}
                  value={centerProfile.customServiceName}
                />
              </div>
            ) : null}
          </FormSection>
          <FormSection title={dictionary.groups.contactDetails}>
            <TextInput
              label={dictionary.fields.ownerName}
              onChange={(ownerName) => onCenterProfileChange({ ownerName })}
              placeholder={dictionary.placeholders.ownerName}
              value={centerProfile.ownerName}
            />
            <TextInput
              label={dictionary.fields.phone}
              onChange={(phone) => onCenterProfileChange({ phone })}
              placeholder={dictionary.placeholders.phone}
              type="tel"
              value={centerProfile.phone}
            />
            <TextInput
              label={dictionary.fields.email}
              onChange={(email) => onCenterProfileChange({ email })}
              placeholder={dictionary.placeholders.email}
              type="email"
              value={centerProfile.email}
            />
          </FormSection>
        </div>
      );
    case "subscription":
      return (
        <FormSection title={dictionary.groups.planSetup}>
          <SelectInput
            label={dictionary.fields.subscriptionPlan}
            onChange={(plan) =>
              onSubscriptionChange({ plan: plan as SubscriptionState["plan"] })
            }
            options={dictionary.plans}
            value={subscription.plan}
          />
          <DateField
            defaultValue="2026-04-26"
            helperText={dictionary.wizard.datePickerHint}
            label={dictionary.fields.startDate}
            labels={dictionary.dateParts}
            locale={locale}
            onChange={(startDate) => onSubscriptionChange({ startDate })}
            placeholder={dictionary.placeholders.startDate}
            value={subscription.startDate}
          />
          <DateField
            defaultValue="2026-05-26"
            helperText={dictionary.wizard.datePickerHint}
            label={dictionary.fields.expiryDate}
            labels={dictionary.dateParts}
            locale={locale}
            onChange={(expiryDate) => onSubscriptionChange({ expiryDate })}
            placeholder={dictionary.placeholders.expiryDate}
            value={subscription.expiryDate}
          />
          <ToggleLine
            checked={subscription.autoRenewal}
            dictionary={dictionary}
            label={dictionary.fields.autoRenewal}
            onChange={(autoRenewal) => onSubscriptionChange({ autoRenewal })}
          />
        </FormSection>
      );
    case "domain":
      return (
        <FormSection title={dictionary.groups.domainRouting}>
          <TextInput
            label={dictionary.fields.customDomain}
            onChange={(customDomain) => onDomainChange({ customDomain })}
            placeholder={dictionary.placeholders.customDomain}
            value={domain.customDomain}
          />
          <TextInput
            label={dictionary.fields.subdomain}
            onChange={(subdomain) => onDomainChange({ subdomain })}
            placeholder={dictionary.placeholders.subdomain}
            value={domain.subdomain}
          />
          <SelectInput
            label={dictionary.fields.dnsStatus}
            onChange={(dnsStatus) =>
              onDomainChange({ dnsStatus: dnsStatus as DomainState["dnsStatus"] })
            }
            options={dictionary.dnsStatuses}
            value={domain.dnsStatus}
          />
        </FormSection>
      );
    case "branding":
      return (
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <FormSection title={dictionary.groups.brandSystem}>
            <LogoUpload
              dictionary={dictionary}
              fileName={logoFileName}
              onFileChange={onLogoChange}
              previewUrl={logoPreviewUrl}
            />
            <ColorInput
              label={dictionary.fields.primaryColor}
              onChange={(primaryColor) => onBrandingChange({ primaryColor })}
              value={branding.primaryColor}
            />
            <ColorInput
              label={dictionary.fields.secondaryColor}
              onChange={(secondaryColor) =>
                onBrandingChange({ secondaryColor })
              }
              value={branding.secondaryColor}
            />
          </FormSection>
          <FormSection title={dictionary.groups.languageSetup}>
            <SelectInput
              label={dictionary.fields.defaultLanguage}
              onChange={(defaultLanguage) =>
                onBrandingChange({
                  defaultLanguage: defaultLanguage as SupportedLocale,
                })
              }
              options={dictionary.languageNames}
              value={branding.defaultLanguage}
            />
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-[#24364f]">
                {dictionary.fields.enabledLanguages}
              </p>
              <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
                {brandingLanguageOrder.map((language) => (
                  <ToggleLine
                    checked={branding.enabledLanguages.includes(language)}
                    dictionary={dictionary}
                    key={language}
                    label={dictionary.languageNames[language]}
                    onChange={(isEnabled) =>
                      onEnabledLanguageChange(language, isEnabled)
                    }
                  />
                ))}
              </div>
            </div>
          </FormSection>
        </div>
      );
    case "adminAccount":
      const isEmailInvalid =
        adminAccount.adminEmail.length > 0 &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminAccount.adminEmail);
      const isPasswordMismatch =
        adminAccount.confirmPassword.length > 0 &&
        adminAccount.password !== adminAccount.confirmPassword;

      return (
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <FormSection title={dictionary.groups.adminIdentity}>
            <TextInput
              label={dictionary.fields.adminName}
              onChange={(adminFullName) =>
                onAdminAccountChange({ adminFullName })
              }
              placeholder={dictionary.placeholders.adminName}
              required
              value={adminAccount.adminFullName}
            />
            <TextInput
              error={
                isEmailInvalid ? dictionary.validation.invalidEmail : undefined
              }
              inputMode="email"
              label={dictionary.fields.adminEmail}
              onChange={(adminEmail) => onAdminAccountChange({ adminEmail })}
              placeholder={dictionary.placeholders.adminEmail}
              required
              type="email"
              value={adminAccount.adminEmail}
            />
            <TextInput
              inputMode="tel"
              label={dictionary.fields.mobileNumber}
              onChange={(mobileNumber) =>
                onAdminAccountChange({ mobileNumber })
              }
              placeholder={dictionary.placeholders.mobileNumber}
              required
              type="tel"
              value={adminAccount.mobileNumber}
            />
            <TextInput
              label={dictionary.fields.password}
              onChange={(password) => onAdminAccountChange({ password })}
              placeholder={dictionary.placeholders.password}
              required
              type="password"
              value={adminAccount.password}
            />
            <TextInput
              error={
                isPasswordMismatch
                  ? dictionary.validation.passwordMismatch
                  : undefined
              }
              label={dictionary.fields.confirmPassword}
              onChange={(confirmPassword) =>
                onAdminAccountChange({ confirmPassword })
              }
              placeholder={dictionary.placeholders.confirmPassword}
              required
              type="password"
              value={adminAccount.confirmPassword}
            />
          </FormSection>
          <FormSection title={dictionary.groups.accessSetup}>
            <SelectInput
              label={dictionary.fields.permissionsPreset}
              onChange={(permissionsPreset) =>
                onAdminAccountChange({
                  permissionsPreset:
                    permissionsPreset as AdminAccountState["permissionsPreset"],
                })
              }
              options={dictionary.permissionPresets}
              value={adminAccount.permissionsPreset}
            />
            <SelectInput
              label={dictionary.fields.accountStatus}
              onChange={(accountStatus) =>
                onAdminAccountChange({
                  accountStatus:
                    accountStatus as AdminAccountState["accountStatus"],
                })
              }
              options={dictionary.accountStatuses}
              value={adminAccount.accountStatus}
            />
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-[#24364f]">
                {dictionary.groups.notificationPreferences}
              </p>
              <div className="mt-2 grid min-w-0 grid-cols-1 gap-2">
                <ToggleLine
                  checked={adminAccount.allowWhatsappNotifications}
                  dictionary={dictionary}
                  label={dictionary.fields.allowWhatsappNotifications}
                  onChange={(allowWhatsappNotifications) =>
                    onAdminAccountChange({ allowWhatsappNotifications })
                  }
                />
                <ToggleLine
                  checked={adminAccount.allowEmailNotifications}
                  dictionary={dictionary}
                  label={dictionary.fields.allowEmailNotifications}
                  onChange={(allowEmailNotifications) =>
                    onAdminAccountChange({ allowEmailNotifications })
                  }
                />
                <ToggleLine
                  checked={adminAccount.twoFactorAuthentication}
                  dictionary={dictionary}
                  label={dictionary.fields.twoFactorAuthentication}
                  onChange={(twoFactorAuthentication) =>
                    onAdminAccountChange({ twoFactorAuthentication })
                  }
                />
              </div>
            </div>
          </FormSection>
        </div>
      );
    case "review":
      return (
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-[#C8A45D]/35 bg-[#C8A45D]/10 p-5 text-sm font-medium leading-6 text-[#7A5C20] xl:col-span-2">
            {dictionary.wizard.reviewWarning}
          </div>
          <ReviewCard
            title={dictionary.groups.reviewCenter}
            items={[
              [
                dictionary.fields.centerName,
                centerProfile.centerName || dictionary.placeholders.centerName,
              ],
              [
                dictionary.fields.ownerName,
                centerProfile.ownerName || dictionary.placeholders.ownerName,
              ],
              [
                dictionary.fields.phone,
                centerProfile.phone || dictionary.placeholders.phone,
              ],
              [
                dictionary.fields.email,
                centerProfile.email || dictionary.placeholders.email,
              ],
              [
                dictionary.fields.primaryCategory,
                dictionary.primaryCategories[centerProfile.primaryCategory],
              ],
              [
                dictionary.fields.servicesOffered,
                centerProfile.servicesOffered
                  .map((service) =>
                    service === "other" && centerProfile.customServiceName
                      ? centerProfile.customServiceName
                      : dictionary.offeredServices[service],
                  )
                  .join(", "),
              ],
            ]}
          />
          <ReviewCard
            title={dictionary.groups.reviewSubscription}
            items={[
              [
                dictionary.fields.subscriptionPlan,
                dictionary.plans[subscription.plan],
              ],
              [
                dictionary.fields.startDate,
                subscription.startDate || dictionary.placeholders.startDate,
              ],
              [
                dictionary.fields.expiryDate,
                subscription.expiryDate || dictionary.placeholders.expiryDate,
              ],
              [
                dictionary.fields.autoRenewal,
                subscription.autoRenewal
                  ? dictionary.wizard.enabled
                  : dictionary.wizard.disabled,
              ],
            ]}
          />
          <ReviewCard
            title={dictionary.groups.reviewDomain}
            items={[
              [
                dictionary.fields.customDomain,
                domain.customDomain || dictionary.placeholders.customDomain,
              ],
              [
                dictionary.fields.subdomain,
                domain.subdomain || dictionary.placeholders.subdomain,
              ],
              [dictionary.fields.dnsStatus, dictionary.dnsStatuses[domain.dnsStatus]],
            ]}
          />
          <ReviewCard
            title={dictionary.groups.reviewBranding}
            items={[
              [dictionary.fields.primaryColor, branding.primaryColor.toUpperCase()],
              [
                dictionary.fields.secondaryColor,
                branding.secondaryColor.toUpperCase(),
              ],
              [
                dictionary.fields.defaultLanguage,
                dictionary.languageNames[branding.defaultLanguage],
              ],
              [
                dictionary.fields.enabledLanguages,
                branding.enabledLanguages
                  .map((language) => dictionary.languageNames[language])
                  .join(", ") || dictionary.wizard.noLanguagesSelected,
              ],
            ]}
          >
            <div className="flex min-w-0 items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
                {logoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={dictionary.wizard.logoPreviewAlt}
                    className="h-full w-full object-contain"
                    src={logoPreviewUrl}
                  />
                ) : (
                  <span className="text-xs font-semibold text-[#0B2D5C]">
                    RC
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#66758a]">
                  {dictionary.fields.logoUpload}
                </p>
                <p className="break-words text-sm font-semibold text-[#24364f]">
                  {logoFileName || dictionary.wizard.noLogoSelected}
                </p>
              </div>
            </div>
          </ReviewCard>
          <ReviewCard
            title={dictionary.groups.reviewAdmin}
            items={[
              [
                dictionary.fields.adminName,
                adminAccount.adminFullName || dictionary.placeholders.adminName,
              ],
              [
                dictionary.fields.adminEmail,
                adminAccount.adminEmail || dictionary.placeholders.adminEmail,
              ],
              [
                dictionary.fields.mobileNumber,
                adminAccount.mobileNumber || dictionary.placeholders.mobileNumber,
              ],
              [
                dictionary.fields.permissionsPreset,
                dictionary.permissionPresets[adminAccount.permissionsPreset],
              ],
              [
                dictionary.fields.accountStatus,
                dictionary.accountStatuses[adminAccount.accountStatus],
              ],
              [
                dictionary.groups.notificationPreferences,
                [
                  `${dictionary.fields.allowWhatsappNotifications}: ${
                    adminAccount.allowWhatsappNotifications
                      ? dictionary.wizard.enabled
                      : dictionary.wizard.disabled
                  }`,
                  `${dictionary.fields.allowEmailNotifications}: ${
                    adminAccount.allowEmailNotifications
                      ? dictionary.wizard.enabled
                      : dictionary.wizard.disabled
                  }`,
                ].join(" / "),
              ],
              [
                dictionary.fields.twoFactorAuthentication,
                adminAccount.twoFactorAuthentication
                  ? dictionary.wizard.enabled
                  : dictionary.wizard.disabled,
              ],
            ]}
          />
        </div>
      );
  }
}

export function SuperAdminCenterWizard() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [centerProfile, setCenterProfile] = useState<CenterProfileState>({
    centerName: "",
    customServiceName: "",
    email: "",
    ownerName: "",
    phone: "",
    primaryCategory: "medicalCenter",
    servicesOffered: ["laser", "hijama"],
  });
  const [subscription, setSubscription] = useState<SubscriptionState>({
    autoRenewal: true,
    expiryDate: "2026-05-26",
    plan: "trial",
    startDate: "2026-04-26",
  });
  const [domain, setDomain] = useState<DomainState>({
    customDomain: "",
    dnsStatus: "pending",
    subdomain: "",
  });
  const [adminAccount, setAdminAccount] = useState<AdminAccountState>({
    accountStatus: "pendingActivation",
    adminEmail: "",
    adminFullName: "",
    allowEmailNotifications: true,
    allowWhatsappNotifications: false,
    confirmPassword: "",
    mobileNumber: "",
    password: "",
    permissionsPreset: "standardManagement",
    twoFactorAuthentication: false,
  });
  const [branding, setBranding] = useState<BrandingState>({
    defaultLanguage: "en",
    enabledLanguages: ["ar", "he", "en"],
    primaryColor: "#0b2d5c",
    secondaryColor: "#c8a45d",
  });
  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState<"error" | "idle" | "saving" | "success">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const dictionary = superAdminCenterWizardDictionaries[locale];
  const activeStep = stepKeys[activeStepIndex];

  const progressLabel = useMemo(
    () => `${dictionary.wizard.progress} ${activeStepIndex + 1} / ${stepKeys.length}`,
    [activeStepIndex, dictionary.wizard.progress],
  );

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setLogoFileName("");
      setLogoPreviewUrl("");
      return;
    }

    setLogoFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleBrandingChange(nextBranding: Partial<BrandingState>) {
    setBranding((current) => ({
      ...current,
      ...nextBranding,
    }));
  }

  function handleAdminAccountChange(
    nextAdminAccount: Partial<AdminAccountState>,
  ) {
    setAdminAccount((current) => ({
      ...current,
      ...nextAdminAccount,
    }));
  }

  function handleCenterProfileChange(
    nextCenterProfile: Partial<CenterProfileState>,
  ) {
    setCenterProfile((current) => ({
      ...current,
      ...nextCenterProfile,
    }));
  }

  function handleSubscriptionChange(
    nextSubscription: Partial<SubscriptionState>,
  ) {
    setSubscription((current) => ({
      ...current,
      ...nextSubscription,
    }));
  }

  function handleDomainChange(nextDomain: Partial<DomainState>) {
    setDomain((current) => ({
      ...current,
      ...nextDomain,
    }));
  }

  function handleServiceOfferedChange(
    service: ServiceKey,
    isEnabled: boolean,
  ) {
    setCenterProfile((current) => {
      const servicesOffered = isEnabled
        ? Array.from(new Set([...current.servicesOffered, service]))
        : current.servicesOffered.filter((item) => item !== service);

      return {
        ...current,
        customServiceName:
          service === "other" && !isEnabled ? "" : current.customServiceName,
        servicesOffered,
      };
    });
  }

  function handleEnabledLanguageChange(
    language: SupportedLocale,
    isEnabled: boolean,
  ) {
    setBranding((current) => {
      const enabledLanguages = isEnabled
        ? Array.from(new Set([...current.enabledLanguages, language]))
        : current.enabledLanguages.filter((item) => item !== language);

      return {
        ...current,
        enabledLanguages,
      };
    });
  }

  async function handlePrimaryAction() {
    if (activeStepIndex < stepKeys.length - 1) {
      setActiveStepIndex((current) => Math.min(stepKeys.length - 1, current + 1));
      return;
    }

    const validation = validateCreateCenterForm(
      adminAccount,
      branding,
      centerProfile,
      dictionary,
      subscription,
    );

    if (
      validation.missingFields.length > 0 ||
      validation.invalidFields.length > 0
    ) {
      const validationMessage = formatValidationMessage(validation, dictionary);

      setSaveStatus("error");
      setSaveMessage(validationMessage);

      // TODO(debug): Remove after Create Center submit flow is verified in browser Network tab.
      console.warn("[RoyalCare submit debug] validation blocked submit", {
        invalidFields: validation.invalidFields,
        missingFields: validation.missingFields,
      });

      return;
    }

    const payload = buildCreateCenterPayload(
      adminAccount,
      branding,
      centerProfile,
      dictionary,
      domain,
      subscription,
    );

    // TODO(debug): Remove after Create Center submit flow is verified in browser Network tab.
    console.log("[RoyalCare submit debug] payload before submit", payload);
    console.log("[RoyalCare submit debug] configured API base URL", API_BASE_URL);

    setSaveStatus("saving");
    setSaveMessage("");

    try {
      await createSuperAdminCenter(payload);
      setSaveStatus("success");
      setSaveMessage(dictionary.wizard.saveSuccess);
      router.push("/super-admin/centers");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : dictionary.wizard.saveError;

      setSaveStatus("error");
      setSaveMessage(message);
    }
  }

  return (
    <SuperAdminLayout
      activeNav="centers"
      dictionary={dictionary}
    >
      <div className="min-w-0 max-w-full space-y-5">
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                {dictionary.wizard.pageEyebrow}
              </p>
              <h2 className="mt-1 text-xl font-semibold leading-snug text-[#0B2D5C]">
                {dictionary.wizard.pageTitle}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">
                {dictionary.wizard.pageSubtitle}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/super-admin/centers"
              >
                {dictionary.wizard.backToCenters}
              </Link>
              <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#0B2D5C]">
                {progressLabel}
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-3">
          <ol className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
            {stepKeys.map((step, index) => {
              const isActive = index === activeStepIndex;
              const isDone = index < activeStepIndex;

              return (
                <li key={step}>
                  <button
                    className={`flex min-h-12 w-full min-w-0 items-center gap-3 rounded-md border px-3 py-2 text-start text-sm transition focus:outline-none focus:ring-3 ${
                      isActive
                        ? "border-[#C8A45D] bg-[#0B2D5C] font-semibold text-white focus:ring-[#0B2D5C]/20"
                        : isDone
                          ? "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 font-semibold text-[#0B2D5C] focus:ring-[#0B2D5C]/12"
                          : "border-[#E5E7EB] bg-[#F8FAFC] font-medium text-[#40516a] hover:border-[#C8A45D]/65 hover:bg-white focus:ring-[#C8A45D]/20"
                    }`}
                    onClick={() => setActiveStepIndex(index)}
                    type="button"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-[#C8A45D] text-[#0B2D5C]"
                          : "bg-white text-[#0B2D5C]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 break-words">
                      {dictionary.steps[step]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        {saveStatus === "idle" ? null : (
          <p
            className={`rounded-md border px-4 py-3 text-sm font-medium ${
              saveStatus === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : saveStatus === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-[#E5E7EB] bg-[#F8FAFC] text-[#66758a]"
            }`}
          >
            {saveStatus === "saving" ? dictionary.wizard.saving : saveMessage}
          </p>
        )}

        {renderStepContent(
          activeStep,
          adminAccount,
          centerProfile,
          dictionary,
          locale,
          branding,
          subscription,
          domain,
          logoFileName,
          logoPreviewUrl,
          handleAdminAccountChange,
          handleBrandingChange,
          handleCenterProfileChange,
          handleSubscriptionChange,
          handleDomainChange,
          handleEnabledLanguageChange,
          handleServiceOfferedChange,
          handleLogoChange,
        )}

        <div className="flex min-w-0 flex-col-reverse gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            className={buttonClassName("secondary", "md")}
            disabled={activeStepIndex === 0}
            onClick={() =>
              setActiveStepIndex((current) => Math.max(0, current - 1))
            }
            type="button"
          >
            {dictionary.wizard.previous}
          </button>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <button
              className={buttonClassName("warning", "md")}
              type="button"
            >
              {dictionary.wizard.saveDraft}
            </button>
            <button
              className={buttonClassName("primary", "md")}
              disabled={saveStatus === "saving"}
              onClick={handlePrimaryAction}
              type="button"
            >
              {saveStatus === "saving"
                ? dictionary.wizard.saving
                : activeStepIndex === stepKeys.length - 1
                  ? dictionary.wizard.createCenter
                  : dictionary.wizard.next}
            </button>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
