"use client";

import { useState, type ReactNode } from "react";
import { RoyalCareLogo } from "@/components/brand/RoyalCareLogo";
import { buttonClassName, primaryButtonClassName } from "@/components/ui/button-styles";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminSettingsDictionaries } from "@/i18n/dictionaries/super-admin-settings";
import { formatDate } from "@/i18n/formatters";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  currencyOptions,
  dateFormatOptions,
  initialToggleSettings,
  languageOptions,
  platformSettings,
  timezoneOptions,
} from "./settings-data";

type Dictionary = (typeof superAdminSettingsDictionaries)["en"];
type ToggleKey = keyof typeof initialToggleSettings;

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 p-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function FieldShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-[#24364f]">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextField({
  label,
  suffix,
  type = "text",
  value,
}: {
  label: string;
  suffix?: string;
  type?: "number" | "text";
  value: string | number;
}) {
  return (
    <FieldShell label={label}>
      <div className="flex min-w-0 items-center rounded-md border border-[#E5E7EB] bg-white focus-within:border-[#0B2D5C] focus-within:ring-3 focus-within:ring-[#0B2D5C]/12">
        <input
          className="h-11 min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm text-[#132238] outline-none"
          defaultValue={value}
          type={type}
        />
        {suffix ? (
          <span className="shrink-0 px-3 text-xs font-semibold text-[#66758a]">{suffix}</span>
        ) : null}
      </div>
    </FieldShell>
  );
}

function SelectField({
  label,
  options,
  renderOption,
  value,
}: {
  label: string;
  options: readonly string[];
  renderOption?: (option: string) => string;
  value: string;
}) {
  return (
    <FieldShell label={label}>
      <select
        className="h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
        defaultValue={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {renderOption ? renderOption(option) : option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">{value}</div>
    </div>
  );
}

function ToggleField({
  dictionary,
  label,
  onChange,
  value,
}: {
  dictionary: Dictionary;
  label: string;
  onChange: (checked: boolean) => void;
  value: boolean;
}) {
  return (
    <ToggleSwitch
      checked={value}
      className="w-full"
      label={label}
      offLabel={dictionary.values.disabled}
      onChange={onChange}
      onLabel={dictionary.values.enabled}
    />
  );
}

function ColorField({ label, value }: { label: string; value: string }) {
  return (
    <FieldShell label={label}>
      <div className="flex min-w-0 items-center gap-3 rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
        <input
          aria-label={label}
          className="h-8 w-10 shrink-0 rounded border border-[#E5E7EB] bg-transparent"
          defaultValue={value}
          type="color"
        />
        <input
          className="h-8 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#24364f] outline-none"
          defaultValue={value}
        />
      </div>
    </FieldShell>
  );
}

function SupportedLanguages({
  dictionary,
}: {
  dictionary: Dictionary;
}) {
  return (
    <div className="min-w-0 md:col-span-2">
      <p className="text-sm font-medium text-[#24364f]">{dictionary.fields.supportedLanguages}</p>
      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
        {platformSettings.supportedLanguages.map((language) => (
          <span
            className="inline-flex min-h-9 items-center rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#0B2D5C]"
            key={language}
          >
            {dictionary.languages[language]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SuperAdminSettingsPage() {
  const { locale } = useLanguage();
  const dictionary = superAdminSettingsDictionaries[locale];
  const [toggles, setToggles] = useState(initialToggleSettings);

  function setToggle(key: ToggleKey, value: boolean) {
    setToggles((current) => ({ ...current, [key]: value }));
  }

  return (
    <SuperAdminLayout activeNav="settings" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] xl:flex-row xl:items-center xl:justify-between">
          <p className="max-w-3xl text-sm leading-6 text-[#66758a]">{dictionary.values.uiOnly}</p>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <button className={primaryButtonClassName("w-full sm:w-auto")} type="button">
              {dictionary.actions.saveSettings}
            </button>
            <button className={buttonClassName("secondary", "md", "w-full sm:w-auto")} type="button">
              {dictionary.actions.resetToDefault}
            </button>
            <button
              className={buttonClassName("warning", "md", "w-full sm:w-auto")}
              onClick={() => setToggle("backupNowRequested", true)}
              type="button"
            >
              {dictionary.actions.backupNow}
            </button>
          </div>
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title={dictionary.sections.general}>
            <TextField label={dictionary.fields.platformName} value={platformSettings.platformName} />
            <SelectField
              label={dictionary.fields.defaultLanguage}
              options={languageOptions}
              renderOption={(option) => dictionary.languages[option as keyof typeof dictionary.languages]}
              value={platformSettings.defaultLanguage}
            />
            <SupportedLanguages dictionary={dictionary} />
            <SelectField label={dictionary.fields.defaultCurrency} options={currencyOptions} value={platformSettings.defaultCurrency} />
            <SelectField label={dictionary.fields.timezone} options={timezoneOptions} value={platformSettings.timezone} />
            <SelectField label={dictionary.fields.dateFormat} options={dateFormatOptions} value={platformSettings.dateFormat} />
          </Section>

          <Section title={dictionary.sections.branding}>
            <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
              <p className="text-xs font-medium text-[#66758a]">{dictionary.fields.platformLogo}</p>
              <div className="mt-3 flex min-w-0 items-center gap-3">
                <RoyalCareLogo className="h-14 w-14 shrink-0 rounded-md border border-[#E5E7EB] bg-white" variant="mark" />
                <p className="min-w-0 break-words text-sm font-semibold text-[#24364f]">{dictionary.values.logoPreview}</p>
              </div>
            </div>
            <ColorField label={dictionary.fields.primaryColor} value={platformSettings.primaryColor} />
            <ColorField label={dictionary.fields.secondaryColor} value={platformSettings.secondaryColor} />
            <TextField label={dictionary.fields.emailBranding} value={platformSettings.emailBranding} />
            <ToggleField
              dictionary={dictionary}
              label={dictionary.fields.loginPageBranding}
              onChange={(value) => setToggle("loginPageBranding", value)}
              value={toggles.loginPageBranding}
            />
          </Section>

          <Section title={dictionary.sections.security}>
            <ToggleField
              dictionary={dictionary}
              label={dictionary.fields.twoFactorDefault}
              onChange={(value) => setToggle("twoFactorDefault", value)}
              value={toggles.twoFactorDefault}
            />
            <ReadOnlyField label={dictionary.fields.passwordPolicy} value={dictionary.values.strongPasswordPolicy} />
            <TextField label={dictionary.fields.sessionTimeout} suffix={dictionary.values.minutes} type="number" value={platformSettings.sessionTimeout} />
            <TextField label={dictionary.fields.loginAttemptLimit} type="number" value={platformSettings.loginAttemptLimit} />
            <ToggleField
              dictionary={dictionary}
              label={dictionary.fields.forcePasswordReset}
              onChange={(value) => setToggle("forcePasswordReset", value)}
              value={toggles.forcePasswordReset}
            />
          </Section>

          <Section title={dictionary.sections.notifications}>
            {([
              ["emailNotifications", dictionary.fields.emailNotifications],
              ["whatsappNotifications", dictionary.fields.whatsappNotifications],
              ["systemAlerts", dictionary.fields.systemAlerts],
              ["paymentAlerts", dictionary.fields.paymentAlerts],
              ["subscriptionAlerts", dictionary.fields.subscriptionAlerts],
            ] as const).map(([key, label]) => (
              <ToggleField
                dictionary={dictionary}
                key={key}
                label={label}
                onChange={(value) => setToggle(key, value)}
                value={toggles[key]}
              />
            ))}
          </Section>

          <Section title={dictionary.sections.subscriptionDefaults}>
            <TextField label={dictionary.fields.defaultTrialDuration} suffix={dictionary.values.days} type="number" value={platformSettings.defaultTrialDuration} />
            <TextField label={dictionary.fields.gracePeriod} suffix={dictionary.values.days} type="number" value={platformSettings.gracePeriod} />
            <ReadOnlyField label={dictionary.fields.autoSuspensionRules} value={dictionary.values.afterGracePeriod} />
          </Section>

          <Section title={dictionary.sections.domainDefaults}>
            <TextField label={dictionary.fields.defaultSubdomainPattern} value={platformSettings.defaultSubdomainPattern} />
            <ToggleField
              dictionary={dictionary}
              label={dictionary.fields.sslAutoRenewal}
              onChange={(value) => setToggle("sslAutoRenewal", value)}
              value={toggles.sslAutoRenewal}
            />
            <ReadOnlyField label={dictionary.fields.dnsVerificationRules} value={dictionary.values.aCnameTxt} />
          </Section>

          <Section title={dictionary.sections.backupHealth}>
            <ReadOnlyField label={dictionary.fields.lastBackup} value={formatDate(platformSettings.lastBackup, locale)} />
            <ReadOnlyField label={dictionary.fields.backupFrequency} value={dictionary.values.daily} />
            <ReadOnlyField label={dictionary.fields.systemStatus} value={dictionary.values.operational} />
            <ReadOnlyField label={dictionary.fields.databaseHealth} value={dictionary.values.healthy} />
            <ReadOnlyField
              label={dictionary.actions.backupNow}
              value={toggles.backupNowRequested ? dictionary.values.enabled : dictionary.values.disabled}
            />
          </Section>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
