"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  listTenantServices,
  updateTenantServiceStatus,
  type TenantService,
} from "@/lib/api/tenant-services";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  formatServicePrice,
  getLocalizedServiceDescription,
  getLocalizedServiceName,
} from "./service-display";
import { hasTenantServicePermission } from "./service-permissions";

type FilterMode = "all" | "active" | "archived";

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

function matchesSearch(service: TenantService, search: string) {
  const term = normalizeSearch(search);

  if (!term) {
    return true;
  }

  return [service.nameEn, service.nameAr, service.nameHe]
    .map(normalizeSearch)
    .some((value) => value.includes(term));
}

function matchesFilter(service: TenantService, filter: FilterMode) {
  if (filter === "active") {
    return service.isActive;
  }

  if (filter === "archived") {
    return !service.isActive;
  }

  return true;
}

export function TenantServicesPage() {
  const { locale } = useLanguage();
  const [services, setServices] = useState<TenantService[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [savingServiceId, setSavingServiceId] = useState("");

  useEffect(() => {
    let isMounted = true;

    listTenantServices()
      .then((response) => {
        if (isMounted) {
          setServices(response.items);
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
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(""), 4000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  return (
    <CenterAdminShell
      activeNav="services"
      subtitle={(dictionary) => dictionary.services.subtitle}
      title={(dictionary) => dictionary.services.title}
    >
      {({ dictionary, session }) => {
        const canCreate = hasTenantServicePermission(
          session.role.key,
          "services.create",
        );
        const canUpdate = hasTenantServicePermission(
          session.role.key,
          "services.update",
        );
        const canArchive = hasTenantServicePermission(
          session.role.key,
          "services.archive",
        );
        const canActivate = hasTenantServicePermission(
          session.role.key,
          "services.activate",
        );
        const filteredServices = services.filter(
          (service) =>
            matchesFilter(service, filter) && matchesSearch(service, search),
        );

        const changeStatus = async (service: TenantService) => {
          const isActivating = !service.isActive;

          if ((isActivating && !canActivate) || (!isActivating && !canArchive)) {
            return;
          }

          setSavingServiceId(service.id);
          setNotice("");

          try {
            const updated = await updateTenantServiceStatus(
              service.id,
              isActivating,
            );
            setServices((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            );
            setNotice(
              isActivating
                ? dictionary.services.activated
                : dictionary.services.archived,
            );
          } finally {
            setSavingServiceId("");
          }
        };

        return (
          <>
            <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row">
                  <input
                    className="min-h-11 min-w-0 flex-1 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={dictionary.services.searchPlaceholder}
                    value={search}
                  />
                  <div className="grid min-w-0 grid-cols-3 gap-2 rounded-md bg-[#F1F5F9] p-1">
                    {(["all", "active", "archived"] as const).map((key) => (
                      <button
                        className={`min-h-9 rounded px-3 text-sm font-semibold transition ${
                          filter === key
                            ? "bg-white text-[#0B2D5C] shadow-sm"
                            : "text-[#66758a]"
                        }`}
                        key={key}
                        onClick={() => setFilter(key)}
                        type="button"
                      >
                        {key === "all"
                          ? dictionary.services.filterAll
                          : key === "active"
                            ? dictionary.services.filterActive
                            : dictionary.services.filterArchived}
                      </button>
                    ))}
                  </div>
                </div>
                {canCreate ? (
                  <Link
                    className={buttonClassName("primary", "md")}
                    href="/tenant/services/new"
                  >
                    {dictionary.services.addService}
                  </Link>
                ) : null}
              </div>
            </section>

            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.services.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.services.loadError}
              </p>
            ) : null}

            {!isLoading && !loadError && services.length === 0 ? (
              <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
                <h2 className="text-base font-semibold text-[#0B2D5C]">
                  {dictionary.services.emptyTitle}
                </h2>
                <p className="mt-2 text-sm text-[#66758a]">
                  {dictionary.services.emptyBody}
                </p>
              </section>
            ) : null}

            {!isLoading &&
            !loadError &&
            services.length > 0 &&
            filteredServices.length === 0 ? (
              <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
                <h2 className="text-base font-semibold text-[#0B2D5C]">
                  {dictionary.services.noResultsTitle}
                </h2>
                <p className="mt-2 text-sm text-[#66758a]">
                  {dictionary.services.noResultsBody}
                </p>
              </section>
            ) : null}

            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredServices.map((service) => {
                const statusKey = service.isActive ? "ACTIVE" : "ARCHIVED";
                const canChangeStatus = service.isActive
                  ? canArchive
                  : canActivate;
                const description = getLocalizedServiceDescription(
                  service,
                  locale,
                );

                return (
                  <article
                    className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                    key={service.id}
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-semibold text-[#0B2D5C]">
                          {getLocalizedServiceName(service, locale)}
                        </h2>
                        <p className="mt-1 text-sm text-[#66758a]" dir="ltr">
                          {formatServicePrice(service) ||
                            dictionary.common.notAvailable}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-[#EAF1FA] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
                        {dictionary.serviceStatuses[statusKey]}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-[#66758a]">
                      {description || dictionary.common.notAvailable}
                    </p>
                    <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <Detail
                        label={dictionary.services.durationMinutes}
                        value={
                          service.durationMinutes?.toString() ??
                          dictionary.common.notAvailable
                        }
                      />
                      <Detail
                        label={dictionary.services.createdAt}
                        value={formatDate(service.createdAt, locale)}
                      />
                    </dl>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Link
                        className={buttonClassName("secondary", "sm")}
                        href={`/tenant/services/${service.id}`}
                      >
                        {dictionary.common.view}
                      </Link>
                      {canUpdate ? (
                        <Link
                          className={buttonClassName("secondary", "sm")}
                          href={`/tenant/services/${service.id}/edit`}
                        >
                          {dictionary.common.edit}
                        </Link>
                      ) : null}
                      {canChangeStatus ? (
                        <button
                          className={buttonClassName(
                            service.isActive ? "warning" : "success",
                            "sm",
                          )}
                          disabled={savingServiceId === service.id}
                          onClick={() => changeStatus(service)}
                          type="button"
                        >
                          {service.isActive
                            ? dictionary.common.archive
                            : dictionary.common.activate}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        );
      }}
    </CenterAdminShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-3">
      <dt className="text-xs font-semibold text-[#66758a]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[#24364f]">
        {value}
      </dd>
    </div>
  );
}
