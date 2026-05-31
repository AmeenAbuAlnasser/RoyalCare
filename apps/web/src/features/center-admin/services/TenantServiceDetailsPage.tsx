"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  deleteTenantService,
  getTenantService,
  updateTenantServiceStatus,
  type TenantService,
} from "@/lib/api/tenant-services";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  formatServicePrice,
  getLocalizedServiceName,
} from "./service-display";
import { hasTenantServicePermission } from "./service-permissions";

export function TenantServiceDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { locale } = useLanguage();
  const serviceId = params.id;
  const [service, setService] = useState<TenantService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getTenantService(serviceId)
      .then((response) => {
        if (isMounted) {
          setService(response);
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
  }, [serviceId]);

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
      title={(dictionary) => dictionary.services.detailsTitle}
    >
      {({ dictionary, session }) => {
        const canUpdate = hasTenantServicePermission(
          session.permissions,
          "services:update",
        );
        const canArchive = hasTenantServicePermission(
          session.permissions,
          "services:archive",
        );
        const canActivate = hasTenantServicePermission(
          session.permissions,
          "services:status",
        );
        const canDelete = hasTenantServicePermission(
          session.permissions,
          "services:delete",
        );

        const handleDelete = async () => {
          if (!service) return;
          setIsDeleting(true);
          try {
            await deleteTenantService(service.id);
            router.push("/tenant/services");
          } finally {
            setIsDeleting(false);
          }
        };

        const changeStatus = async () => {
          if (!service) {
            return;
          }

          const isActivating = !service.isActive;

          if ((isActivating && !canActivate) || (!isActivating && !canArchive)) {
            return;
          }

          setIsSaving(true);
          setNotice("");

          try {
            const updated = await updateTenantServiceStatus(
              service.id,
              isActivating,
            );
            setService(updated);
            setNotice(
              isActivating
                ? dictionary.services.activated
                : dictionary.services.archived,
            );
          } finally {
            setIsSaving(false);
          }
        };

        return (
          <>
            <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/services"
              >
                {dictionary.nav.services}
              </Link>
              {service && canUpdate ? (
                <Link
                  className={buttonClassName("secondary", "md")}
                  href={`/tenant/services/${service.id}/edit`}
                >
                  {dictionary.common.edit}
                </Link>
              ) : null}
              {service &&
              ((service.isActive && canArchive) ||
                (!service.isActive && canActivate)) ? (
                <button
                  className={buttonClassName(
                    service.isActive ? "warning" : "success",
                    "md",
                  )}
                  disabled={isSaving}
                  onClick={changeStatus}
                  type="button"
                >
                  {service.isActive
                    ? dictionary.common.archive
                    : dictionary.common.activate}
                </button>
              ) : null}
              {service && canDelete ? (
                service.safeDeleteAllowed ? (
                  <button
                    className={buttonClassName("danger", "md")}
                    disabled={isSaving}
                    onClick={() => setShowDeleteModal(true)}
                    type="button"
                  >
                    {dictionary.services.deleteService}
                  </button>
                ) : (
                  <button
                    className={buttonClassName("danger", "md")}
                    disabled
                    title={dictionary.services.deleteServiceBlockedTooltip}
                    type="button"
                  >
                    {dictionary.services.deleteService}
                  </button>
                )
              ) : null}
            </div>

            {showDeleteModal ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
                  <h3 className="text-base font-semibold text-[#0B2D5C]">
                    {dictionary.services.deleteServiceConfirmTitle}
                  </h3>
                  <p className="mt-2 text-sm text-[#66758a]">
                    {dictionary.services.deleteServiceConfirmBody}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      className={buttonClassName("secondary", "md")}
                      disabled={isDeleting}
                      onClick={() => setShowDeleteModal(false)}
                      type="button"
                    >
                      {dictionary.common.cancel}
                    </button>
                    <button
                      className={buttonClassName("danger", "md")}
                      disabled={isDeleting}
                      onClick={handleDelete}
                      type="button"
                    >
                      {isDeleting
                        ? dictionary.common.saving
                        : dictionary.services.deleteServiceConfirmButton}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

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
              <section className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-6">
                <h2 className="text-base font-semibold text-[#B42318]">
                  {dictionary.services.notFound}
                </h2>
                <button
                  className={buttonClassName("secondary", "md", "mt-4")}
                  onClick={() => router.push("/tenant/services")}
                  type="button"
                >
                  {dictionary.nav.services}
                </button>
              </section>
            ) : null}

            {service && !isLoading ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold text-[#0B2D5C]">
                      {getLocalizedServiceName(service, locale)}
                    </h2>
                    <p className="mt-1 text-sm text-[#66758a]" dir="ltr">
                      {formatServicePrice(service) ||
                        dictionary.common.notAvailable}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-[#EAF1FA] px-3 py-1 text-xs font-semibold text-[#0B2D5C]">
                    {
                      dictionary.serviceStatuses[
                        service.isActive ? "ACTIVE" : "ARCHIVED"
                      ]
                    }
                  </span>
                </div>

                <dl className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Detail label={dictionary.services.nameEn} value={service.nameEn} />
                  <Detail label={dictionary.services.nameAr} value={service.nameAr} />
                  <Detail label={dictionary.services.nameHe} value={service.nameHe} />
                  <Detail
                    label={dictionary.services.durationMinutes}
                    value={
                      service.durationMinutes?.toString() ??
                      dictionary.common.notAvailable
                    }
                  />
                  <Detail
                    label={dictionary.services.price}
                    value={
                      formatServicePrice(service) ||
                      dictionary.common.notAvailable
                    }
                  />
                  <Detail
                    label={dictionary.services.createdAt}
                    value={formatDate(service.createdAt, locale)}
                  />
                  <Detail
                    label={dictionary.services.updatedAt}
                    value={formatDate(service.updatedAt, locale)}
                  />
                </dl>

                <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
                  <Description
                    label={dictionary.services.descriptionEn}
                    value={service.descriptionEn || dictionary.common.notAvailable}
                  />
                  <Description
                    dir="rtl"
                    label={dictionary.services.descriptionAr}
                    value={service.descriptionAr || dictionary.common.notAvailable}
                  />
                  <Description
                    dir="rtl"
                    label={dictionary.services.descriptionHe}
                    value={service.descriptionHe || dictionary.common.notAvailable}
                  />
                </div>
              </section>
            ) : null}
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

function Description({
  dir,
  label,
  value,
}: {
  dir?: "ltr" | "rtl";
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-4">
      <h3 className="text-sm font-semibold text-[#24364f]">{label}</h3>
      <p
        className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#66758a]"
        dir={dir}
      >
        {value}
      </p>
    </div>
  );
}
