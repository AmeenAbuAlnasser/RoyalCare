"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { useLanguage } from "@/i18n/LanguageProvider";
import { adminCentersDictionaries } from "@/i18n/dictionaries/admin-centers";
import { formatDate, formatNumber } from "@/i18n/formatters";
import {
  AdminCentersApiError,
  listAdminCenters,
  loginAsAdminCenter,
  updateAdminCenterStatus,
  type AdminCenterStatus,
  type AdminCenterSummary,
} from "@/lib/api/admin-centers";

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: AdminCenterStatus;
}) {
  const style =
    status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "SUSPENDED" || status === "CANCELLED"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]";

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

export function AdminCentersPage() {
  const { locale } = useLanguage();
  const dictionary = adminCentersDictionaries[locale];
  const [centers, setCenters] = useState<AdminCenterSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [managerWarningCenterId, setManagerWarningCenterId] = useState<
    string | null
  >(null);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loginAsCenterId, setLoginAsCenterId] = useState<string | null>(null);
  const [updatingCenterId, setUpdatingCenterId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    listAdminCenters()
      .then((response) => {
        if (isMounted) {
          setCenters(response.data);
          setErrorMessage("");
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error("[RoyalCare admin centers] load failed", error);
          setErrorMessage(
            error instanceof AdminCentersApiError
              ? `${dictionary.page.error} (${error.status})`
              : dictionary.page.error,
          );
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
  }, [dictionary.page.error]);

  async function handleStatusToggle(center: AdminCenterSummary) {
    const nextStatus = center.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUpdatingCenterId(center.id);
    setNoticeMessage("");

    try {
      const updatedCenter = await updateAdminCenterStatus(
        center.id,
        nextStatus,
      );
      setCenters((currentCenters) =>
        currentCenters.map((item) =>
          item.id === center.id
            ? {
                id: updatedCenter.id,
                name: updatedCenter.name,
                slug: updatedCenter.slug,
                status: updatedCenter.status,
                createdAt: updatedCenter.createdAt,
                usersCount: updatedCenter.usersCount,
              }
            : item,
        ),
      );
      setNoticeMessage(dictionary.page.updated);
    } catch (error) {
      console.error("[RoyalCare admin centers] status update failed", error);
      setErrorMessage(
        error instanceof AdminCentersApiError
          ? `${dictionary.page.error} (${error.status})`
          : dictionary.page.error,
      );
    } finally {
      setUpdatingCenterId(null);
    }
  }

  async function handleLoginAsCenterAdmin(centerId: string) {
    setLoginAsCenterId(centerId);
    setErrorMessage("");
    setManagerWarningCenterId(null);

    try {
      const response = await loginAsAdminCenter(centerId);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "royalcare.centerSessionToken",
          response.token,
        );
        window.location.assign(response.redirectUrl || "/tenant/dashboard");
      }
    } catch (error) {
      console.error("[RoyalCare admin centers] login-as failed", error);
      if (
        error instanceof AdminCentersApiError &&
        error.errorCode === "NO_ACTIVE_CENTER_MANAGER"
      ) {
        setManagerWarningCenterId(centerId);
        setLoginAsCenterId(null);
        return;
      }

      setErrorMessage(
        error instanceof AdminCentersApiError
          ? `${dictionary.page.loginAsError} (${error.status})`
          : dictionary.page.loginAsError,
      );
      setLoginAsCenterId(null);
    }
  }

  return (
    <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
      <section className="space-y-6">
        <div className="rounded-md border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#0B2D5C]">
                {dictionary.page.listTitle}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">
                {dictionary.page.listSubtitle}
              </p>
            </div>
            <Link
              className={buttonClassName("primary", "md", "w-full sm:w-auto")}
              href="/super-admin/centers/new"
            >
              {dictionary.actions.addCenter}
            </Link>
          </div>
        </div>

        {noticeMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {noticeMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white shadow-sm">
          {isLoading ? (
            <div className="p-6 text-sm font-medium text-[#66758a]">
              {dictionary.page.loading}
            </div>
          ) : centers.length === 0 ? (
            <div className="p-6 text-sm font-medium text-[#66758a]">
              {dictionary.page.empty}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-[#E5E7EB] text-sm">
                  <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#66758a]">
                    <tr>
                      <th className="px-5 py-3 text-start">
                        {dictionary.table.name}
                      </th>
                      <th className="px-5 py-3 text-start">
                        {dictionary.table.slug}
                      </th>
                      <th className="px-5 py-3 text-start">
                        {dictionary.table.status}
                      </th>
                      <th className="px-5 py-3 text-start">
                        {dictionary.table.usersCount}
                      </th>
                      <th className="px-5 py-3 text-start">
                        {dictionary.table.createdAt}
                      </th>
                      <th className="px-5 py-3 text-start">
                        {dictionary.table.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {centers.map((center) => (
                      <tr key={center.id}>
                        <td className="px-5 py-4 font-semibold text-[#132238]">
                          {center.name}
                        </td>
                        <td className="px-5 py-4 text-[#40516a]">
                          {center.slug}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge
                            label={
                              dictionary.statuses[center.status] ??
                              center.status
                            }
                            status={center.status}
                          />
                        </td>
                        <td className="px-5 py-4 text-[#40516a]">
                          {formatNumber(center.usersCount)}
                        </td>
                        <td className="px-5 py-4 text-[#40516a]">
                          {formatDate(center.createdAt, locale)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              className={buttonClassName("secondary", "sm")}
                              href={`/admin/centers/${center.id}`}
                            >
                              {dictionary.actions.view}
                            </Link>
                            <button
                              className={buttonClassName("primary", "sm")}
                              disabled={
                                loginAsCenterId === center.id ||
                                managerWarningCenterId === center.id
                              }
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void handleLoginAsCenterAdmin(center.id)
                              }}
                              type="button"
                            >
                              {managerWarningCenterId === center.id
                                ? dictionary.actions.loginAs
                                : loginAsCenterId === center.id
                                  ? dictionary.page.loginAsLoading
                                  : dictionary.actions.loginAs}
                            </button>
                            {managerWarningCenterId === center.id ? (
                              <Link
                                className={buttonClassName("warning", "sm")}
                                href={`/super-admin/centers/${center.id}`}
                              >
                                {dictionary.actions.addCenterManager}
                              </Link>
                            ) : null}
                            <button
                              className={buttonClassName(
                                center.status === "ACTIVE"
                                  ? "danger"
                                  : "success",
                                "sm",
                              )}
                              disabled={updatingCenterId === center.id}
                              onClick={() => void handleStatusToggle(center)}
                              type="button"
                            >
                              {center.status === "ACTIVE"
                                ? dictionary.actions.suspend
                                : dictionary.actions.activate}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#E5E7EB] lg:hidden">
                {centers.map((center) => (
                  <article key={center.id} className="space-y-4 p-4">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-[#0B2D5C]">
                          {center.name}
                        </h3>
                        <p className="mt-1 truncate text-sm text-[#66758a]">
                          {center.slug}
                        </p>
                      </div>
                      <StatusBadge
                        label={dictionary.statuses[center.status] ?? center.status}
                        status={center.status}
                      />
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs font-semibold text-[#66758a]">
                          {dictionary.table.usersCount}
                        </dt>
                        <dd className="mt-1 text-[#132238]">
                          {formatNumber(center.usersCount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-[#66758a]">
                          {dictionary.table.createdAt}
                        </dt>
                        <dd className="mt-1 text-[#132238]">
                          {formatDate(center.createdAt, locale)}
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className={buttonClassName("secondary", "sm")}
                        href={`/admin/centers/${center.id}`}
                      >
                        {dictionary.actions.view}
                      </Link>
                      <button
                        className={buttonClassName("primary", "sm")}
                        disabled={
                          loginAsCenterId === center.id ||
                          managerWarningCenterId === center.id
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void handleLoginAsCenterAdmin(center.id);
                        }}
                        type="button"
                      >
                        {managerWarningCenterId === center.id
                          ? dictionary.actions.loginAs
                          : loginAsCenterId === center.id
                            ? dictionary.page.loginAsLoading
                            : dictionary.actions.loginAs}
                      </button>
                      {managerWarningCenterId === center.id ? (
                        <Link
                          className={buttonClassName("warning", "sm")}
                          href={`/super-admin/centers/${center.id}`}
                        >
                          {dictionary.actions.addCenterManager}
                        </Link>
                      ) : null}
                      <button
                        className={buttonClassName(
                          center.status === "ACTIVE" ? "danger" : "success",
                          "sm",
                        )}
                        disabled={updatingCenterId === center.id}
                        onClick={() => void handleStatusToggle(center)}
                        type="button"
                      >
                        {center.status === "ACTIVE"
                          ? dictionary.actions.suspend
                          : dictionary.actions.activate}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
        {managerWarningCenterId ? (
          <div className="rounded-md border border-[#C8A45D]/45 bg-[#FFF8E6] px-4 py-3 text-sm font-medium text-[#7A5C20]">
            {dictionary.page.noActiveManager}
          </div>
        ) : null}
      </section>
    </SuperAdminLayout>
  );
}
