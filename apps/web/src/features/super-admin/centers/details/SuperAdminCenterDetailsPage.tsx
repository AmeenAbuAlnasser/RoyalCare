"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import {
  getSuperAdminCenter,
  type ApiCenter,
  type ApiCenterStatus,
  type ApiLanguage,
} from "@/lib/api/super-admin-centers";
import { superAdminCenterDetailsDictionaries } from "@/i18n/dictionaries/super-admin-center-details";
import {
  activityTimeline,
  centerDetailsById,
  type CenterDetails,
} from "./center-details-data";

type Dictionary = (typeof superAdminCenterDetailsDictionaries)["en"];
type CenterStatus = keyof Dictionary["statuses"];

function mapApiStatus(status: ApiCenterStatus): CenterStatus {
  if (status === "ACTIVE") {
    return "active";
  }

  if (status === "SUSPENDED" || status === "CANCELLED" || status === "ARCHIVED") {
    return "suspended";
  }

  if (status === "PAST_DUE") {
    return "expired";
  }

  return "trial";
}

function mapApiLanguage(language: ApiLanguage) {
  return language.toLowerCase() as "ar" | "he" | "en";
}

function mapApiCenterType(type: ApiCenter["type"]): CenterDetails["centerTypeKey"] {
  if (type === "BEAUTY") {
    return "beautyCenter";
  }

  if (type === "WELLNESS") {
    return "wellnessCenter";
  }

  return "medicalCenter";
}

function mapApiPlan(planCode?: string): CenterDetails["planKey"] {
  if (planCode === "starter" || planCode === "professional" || planCode === "enterprise") {
    return planCode;
  }

  return "trial";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function mapApiCenter(center: ApiCenter): CenterDetails {
  const subscription = center.subscriptions?.[0];
  const domain = center.domains?.[0];
  const adminUser = center.userRoles?.[0]?.user ?? center.owner;
  const enabledLanguages = Array.isArray(center.branding?.enabledLanguages)
    ? center.branding.enabledLanguages.map(mapApiLanguage)
    : [mapApiLanguage(center.primaryLanguage)];

  return {
    accountStatus: adminUser ? "active" : "pendingActivation",
    adminEmail: adminUser?.email ?? "-",
    adminMobile: adminUser?.phone ?? "-",
    adminName: adminUser?.fullName ?? "-",
    autoRenewal: true,
    centerName: center.name,
    centerTypeKey: mapApiCenterType(center.type),
    createdDate: center.createdAt,
    customDomain: domain?.hostname ?? center.slug,
    defaultLanguage: mapApiLanguage(
      center.branding?.defaultLanguage ?? center.primaryLanguage,
    ),
    domainStatus:
      domain?.status === "VERIFIED" || domain?.status === "ACTIVE"
        ? "verified"
        : domain?.status === "FAILED"
          ? "failed"
          : "pending",
    enabledLanguages,
    expiryDate: subscription?.currentPeriodEnd ?? center.createdAt,
    lastLogin: center.createdAt,
    logoInitials: getInitials(center.name) || "RC",
    ownerName: center.owner?.fullName ?? center.owner?.email ?? "-",
    permissionsPreset: "standardManagement",
    planKey: mapApiPlan(subscription?.planCode),
    primaryColor: center.branding?.primaryColor ?? "#0B2D5C",
    secondaryColor: center.branding?.secondaryColor ?? "#C8A45D",
    servicesOffered: ["other"],
    startDate: subscription?.currentPeriodStart ?? center.createdAt,
    status: mapApiStatus(center.status),
    subdomain: center.slug,
  };
}

function getCenterName(center: CenterDetails, dictionary: Dictionary) {
  return center.centerName ?? dictionary.centers[center.centerNameKey ?? "novaLaser"];
}

function getOwnerName(center: CenterDetails, dictionary: Dictionary) {
  return center.ownerName ?? dictionary.owners[center.ownerNameKey ?? "mayaCohen"];
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: CenterStatus;
}) {
  const styles: Record<CenterStatus, string> = {
    active: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    trial: "border-[#C8A45D]/30 bg-[#C8A45D]/12 text-[#7A5C20]",
    expired: "border-rose-200 bg-rose-50 text-rose-700",
    suspended: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3"
          key={label}
        >
          <dt className="text-xs font-medium text-[#66758a]">{label}</dt>
          <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ColorValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
      <span
        aria-label={label}
        className="h-8 w-8 shrink-0 rounded-md border border-[#E5E7EB]"
        style={{ backgroundColor: value }}
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#66758a]">{label}</p>
        <p className="truncate text-sm font-semibold text-[#24364f]">
          {value.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

function LogoMark({
  center,
  dictionary,
  size = "lg",
}: {
  center: CenterDetails;
  dictionary: Dictionary;
  size?: "lg" | "sm";
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg border border-[#C8A45D]/40 bg-[#0B2D5C] font-semibold text-[#C8A45D] ${
        size === "lg" ? "h-20 w-20 text-xl" : "h-14 w-14 text-base"
      }`}
      title={dictionary.fields.logo}
    >
      {center.logoInitials || dictionary.values.noLogo}
    </div>
  );
}

export function SuperAdminCenterDetailsPage({ centerId }: { centerId: string }) {
  const { locale } = useLanguage();
  const dictionary = superAdminCenterDetailsDictionaries[locale];
  const [apiCenter, setApiCenter] = useState<CenterDetails | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const mockCenter = centerDetailsById[centerId as keyof typeof centerDetailsById];
  const center = apiCenter ?? mockCenter;

  useEffect(() => {
    let isMounted = true;

    getSuperAdminCenter(centerId)
      .then((response) => {
        if (isMounted) {
          setApiCenter(mapApiCenter(response));
          setApiLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [centerId]);

  if (!center && !apiLoaded) {
    return (
      <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-sm font-medium text-[#66758a]">
            {dictionary.header.title}
          </p>
        </section>
      </SuperAdminLayout>
    );
  }

  if (!center && apiLoaded) {
    return (
      <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
            {dictionary.header.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#0B2D5C]">
            {dictionary.values.notFoundTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
            {dictionary.values.notFoundDescription}
          </p>
          <Link
            className={buttonClassName("secondary", "md", "mt-5 w-full sm:w-auto")}
            href="/super-admin/centers"
          >
            {dictionary.actions.backToCenters}
          </Link>
        </section>
      </SuperAdminLayout>
    );
  }

  const serviceLabels = center.servicesOffered
    .map((service) => dictionary.services[service])
    .join(", ");
  const enabledLanguages = center.enabledLanguages
    .map((language) => dictionary.languages[language])
    .join(", ");

  return (
    <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-5">
        <section className="flex min-w-0 max-w-full flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <LogoMark center={center} dictionary={dictionary} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                {dictionary.header.eyebrow}
              </p>
              <h2 className="mt-1 break-words text-xl font-semibold leading-snug text-[#0B2D5C]">
                {getCenterName(center, dictionary)}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#66758a]">
                {dictionary.header.subtitle}
              </p>
            </div>
          </div>
          <Link
            className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
            href="/super-admin/centers"
          >
            {dictionary.actions.backToCenters}
          </Link>
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <Section title={dictionary.sections.overview}>
            <DetailList
              items={[
                [
                  dictionary.fields.centerName,
                  getCenterName(center, dictionary),
                ],
                [
                  dictionary.fields.ownerName,
                  getOwnerName(center, dictionary),
                ],
                [
                  dictionary.fields.centerType,
                  dictionary.centerTypes[center.centerTypeKey],
                ],
                [dictionary.fields.servicesOffered, serviceLabels],
                [
                  dictionary.fields.status,
                  <StatusBadge
                    key="status"
                    label={dictionary.statuses[center.status]}
                    status={center.status}
                  />,
                ],
                [
                  dictionary.fields.subscriptionPlan,
                  dictionary.plans[center.planKey],
                ],
                [
                  dictionary.fields.startDate,
                  formatDate(center.startDate, locale),
                ],
                [
                  dictionary.fields.expiryDate,
                  formatDate(center.expiryDate, locale),
                ],
                [
                  dictionary.fields.autoRenewal,
                  center.autoRenewal
                    ? dictionary.values.enabled
                    : dictionary.values.disabled,
                ],
                [dictionary.fields.domain, center.customDomain],
                [
                  dictionary.fields.dnsVerificationStatus,
                  dictionary.domainStatuses[center.domainStatus],
                ],
                [
                  dictionary.fields.createdDate,
                  formatDate(center.createdDate, locale),
                ],
              ]}
            />
          </Section>

          <Section title={dictionary.sections.quickActions}>
            <div className="grid min-w-0 grid-cols-1 gap-3">
              <button className={buttonClassName("primary", "md")} type="button">
                {dictionary.actions.editCenter}
              </button>
              <button className={buttonClassName("warning", "md")} type="button">
                {dictionary.actions.renewSubscription}
              </button>
              <button className={buttonClassName("warning", "md")} type="button">
                {dictionary.actions.suspendCenter}
              </button>
              <button className={buttonClassName("success", "md")} type="button">
                {dictionary.actions.activateCenter}
              </button>
              <button className={buttonClassName("danger", "md")} type="button">
                {dictionary.actions.deleteCenter}
              </button>
              <button className={buttonClassName("secondary", "md")} type="button">
                {dictionary.actions.loginAsCenterAdmin}
              </button>
              <p className="text-xs leading-5 text-[#66758a]">
                {dictionary.values.futureAction}
              </p>
            </div>
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title={dictionary.sections.adminInfo}>
            <DetailList
              items={[
                [dictionary.fields.adminName, center.adminName],
                [dictionary.fields.email, center.adminEmail],
                [dictionary.fields.mobile, center.adminMobile],
                [
                  dictionary.fields.permissionsPreset,
                  dictionary.permissionPresets[center.permissionsPreset],
                ],
                [
                  dictionary.fields.lastLogin,
                  formatDate(center.lastLogin, locale),
                ],
                [
                  dictionary.fields.accountStatus,
                  dictionary.accountStatuses[center.accountStatus],
                ],
              ]}
            />
          </Section>

          <Section title={dictionary.sections.brandingLanguages}>
            <div className="mb-4 flex min-w-0 items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <LogoMark center={center} dictionary={dictionary} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#66758a]">
                  {dictionary.fields.logo}
                </p>
                <p className="text-sm font-semibold text-[#24364f]">
                  {getCenterName(center, dictionary)}
                </p>
              </div>
            </div>
            <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <ColorValue
                label={dictionary.fields.primaryColor}
                value={center.primaryColor}
              />
              <ColorValue
                label={dictionary.fields.secondaryColor}
                value={center.secondaryColor}
              />
            </div>
            <DetailList
              items={[
                [
                  dictionary.fields.defaultLanguage,
                  dictionary.languages[center.defaultLanguage],
                ],
                [dictionary.fields.enabledLanguages, enabledLanguages],
              ]}
            />
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title={dictionary.sections.activityTimeline}>
            <ol className="space-y-4">
              {activityTimeline.map((item) => (
                <li className="flex min-w-0 gap-3" key={item.key}>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#C8A45D] bg-[#0B2D5C]" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#24364f]">
                      {dictionary.timeline[item.key]}
                    </p>
                    <p className="text-xs text-[#66758a]">
                      {formatDate(item.date, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={dictionary.sections.notes}>
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.notes.label}
              </span>
              <textarea
                className="mt-2 min-h-36 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                placeholder={dictionary.notes.placeholder}
              />
            </label>
            <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[#66758a]">
                {dictionary.notes.helper}
              </p>
              <button
                className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
                type="button"
              >
                {dictionary.actions.saveNotes}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
