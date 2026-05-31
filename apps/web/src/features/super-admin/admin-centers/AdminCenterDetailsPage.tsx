"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { useLanguage } from "@/i18n/LanguageProvider";
import { adminCentersDictionaries } from "@/i18n/dictionaries/admin-centers";
import { formatDate, formatNumber } from "@/i18n/formatters";
import {
  AdminCentersApiError,
  createAdminCenterManager,
  getAdminCenter,
  loginAsAdminCenter,
  updateAdminCenterStatus,
  type AdminCenterDetails,
} from "@/lib/api/admin-centers";

type ManagerFormState = {
  email: string;
  fullName: string;
  phone: string;
  temporaryPassword: string;
};

type ManagerFieldErrors = Partial<Record<keyof ManagerFormState, string>>;

const emptyManagerForm: ManagerFormState = {
  email: "",
  fullName: "",
  phone: "",
  temporaryPassword: "",
};

function getManagerErrors(error: unknown): ManagerFieldErrors {
  if (!(error instanceof AdminCentersApiError)) {
    return {};
  }

  const details = error.details;
  const errors =
    details && typeof details === "object" && "errors" in details
      ? (details as { errors?: Record<string, unknown> }).errors
      : undefined;

  if (!errors) {
    return {};
  }

  return {
    email: typeof errors.email === "string" ? errors.email : undefined,
    fullName:
      typeof errors.fullName === "string" ? errors.fullName : undefined,
    phone: typeof errors.phone === "string" ? errors.phone : undefined,
    temporaryPassword:
      typeof errors.temporaryPassword === "string"
        ? errors.temporaryPassword
        : undefined,
  };
}

export function AdminCenterDetailsPage({ centerId }: { centerId: string }) {
  const { locale } = useLanguage();
  const dictionary = adminCentersDictionaries[locale];
  const [center, setCenter] = useState<AdminCenterDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isLoginAsLoading, setIsLoginAsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [showManagerWarning, setShowManagerWarning] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerForm, setManagerForm] =
    useState<ManagerFormState>(emptyManagerForm);
  const [managerErrors, setManagerErrors] = useState<ManagerFieldErrors>({});
  const [managerSaveStatus, setManagerSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const hasActiveCenterManager =
    center?.users.some(
      (user) =>
        user.status === "ACTIVE" &&
        (user.role === "CENTER_OWNER" || user.role === "CENTER_MANAGER"),
    ) ?? true;

  useEffect(() => {
    let isMounted = true;

    getAdminCenter(centerId)
      .then((response) => {
        if (isMounted) {
          setCenter(response);
          setErrorMessage("");
          setShowManagerWarning(false);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error("[RoyalCare admin center] load failed", error);
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
  }, [centerId, dictionary.page.error]);

  async function refreshCenterDetails() {
    const response = await getAdminCenter(centerId);
    setCenter(response);
    setShowManagerWarning(false);
    return response;
  }

  async function handleLoginAsCenterAdmin() {
    if (!hasActiveCenterManager) {
      setShowManagerWarning(true);
      return;
    }

    setIsLoginAsLoading(true);
    setErrorMessage("");
    setShowManagerWarning(false);

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
      console.error("[RoyalCare admin center] login-as failed", error);
      if (
        error instanceof AdminCentersApiError &&
        error.errorCode === "NO_ACTIVE_CENTER_MANAGER"
      ) {
        setShowManagerWarning(true);
        setIsLoginAsLoading(false);
        return;
      }

      setErrorMessage(
        error instanceof AdminCentersApiError
          ? `${dictionary.page.loginAsError} (${error.status})`
          : dictionary.page.loginAsError,
      );
      setIsLoginAsLoading(false);
    }
  }

  async function handleStatusToggle() {
    if (!center) {
      return;
    }

    const nextStatus = center.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setIsStatusLoading(true);
    setErrorMessage("");

    try {
      const updatedCenter = await updateAdminCenterStatus(center.id, nextStatus);
      setCenter(updatedCenter);
    } catch (error) {
      console.error("[RoyalCare admin center] status update failed", error);
      setErrorMessage(
        error instanceof AdminCentersApiError
          ? `${dictionary.page.error} (${error.status})`
          : dictionary.page.error,
      );
    } finally {
      setIsStatusLoading(false);
    }
  }

  function openManagerModal() {
    setManagerForm(emptyManagerForm);
    setManagerErrors({});
    setManagerSaveStatus("idle");
    setShowManagerWarning(false);
    setErrorMessage("");
    setIsManagerModalOpen(true);
  }

  function updateManagerField(field: keyof ManagerFormState, value: string) {
    setManagerForm((current) => ({ ...current, [field]: value }));
    setManagerErrors((current) => ({ ...current, [field]: undefined }));
    setManagerSaveStatus("idle");
  }

  async function handleManagerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManagerSaveStatus("saving");
    setManagerErrors({});
    setErrorMessage("");

    try {
      await createAdminCenterManager(centerId, {
        email: managerForm.email,
        fullName: managerForm.fullName,
        phone: managerForm.phone || undefined,
        temporaryPassword: managerForm.temporaryPassword,
      });
      await refreshCenterDetails();
      setManagerSaveStatus("saved");
      setIsManagerModalOpen(false);
      setNoticeMessage(dictionary.page.managerAdded);
    } catch (error) {
      console.error("[RoyalCare admin center] manager create failed", error);
      setManagerErrors(getManagerErrors(error));
      setManagerSaveStatus("error");
    }
  }

  return (
    <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
      <section className="space-y-6">
        <Link className={buttonClassName("secondary", "sm")} href="/admin/centers">
          {dictionary.page.back}
        </Link>

        {errorMessage ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {noticeMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {noticeMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-md border border-[#E5E7EB] bg-white p-6 text-sm font-medium text-[#66758a] shadow-sm">
            {dictionary.page.loading}
          </div>
        ) : center ? (
          <>
            <div className="rounded-md border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[#0B2D5C]">
                    {dictionary.page.detailsTitle}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">
                    {dictionary.page.detailsSubtitle}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                  <Link
                    className={buttonClassName(
                      "secondary",
                      "md",
                      "w-full sm:w-auto",
                    )}
                    href={`/super-admin/centers/${centerId}`}
                  >
                    {dictionary.actions.addUser}
                  </Link>
                  <button
                    className={buttonClassName(
                      center.status === "ACTIVE" ? "danger" : "success",
                      "md",
                      "w-full sm:w-auto",
                    )}
                    disabled={isStatusLoading}
                    onClick={() => void handleStatusToggle()}
                    type="button"
                  >
                    {center.status === "ACTIVE"
                      ? dictionary.actions.suspend
                      : dictionary.actions.activate}
                  </button>
                  <button
                    className={buttonClassName("primary", "md", "w-full sm:w-auto")}
                    disabled={isLoginAsLoading || !hasActiveCenterManager}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleLoginAsCenterAdmin();
                    }}
                    type="button"
                  >
                    {isLoginAsLoading
                      ? dictionary.page.loginAsLoading
                      : dictionary.actions.loginAs}
                  </button>
                  {!hasActiveCenterManager || showManagerWarning ? (
                    <button
                      className={buttonClassName(
                        "warning",
                        "md",
                        "w-full sm:w-auto",
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openManagerModal();
                      }}
                      type="button"
                    >
                      {dictionary.actions.addCenterManager}
                    </button>
                  ) : null}
                  <button
                    className={buttonClassName(
                      "secondary",
                      "md",
                      "w-full sm:w-auto",
                    )}
                    disabled
                    title={dictionary.page.comingSoon}
                    type="button"
                  >
                    {dictionary.actions.resetPassword}
                  </button>
                </div>
              </div>
              {!hasActiveCenterManager || showManagerWarning ? (
                <div className="mt-4 rounded-md border border-[#C8A45D]/45 bg-[#FFF8E6] px-4 py-3 text-sm font-medium text-[#7A5C20]">
                  {dictionary.page.noActiveManager}
                </div>
              ) : null}

              <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <dt className="text-xs font-semibold text-[#66758a]">
                    {dictionary.table.name}
                  </dt>
                  <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-[#132238]">
                    {center.name}
                  </dd>
                </div>
                <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <dt className="text-xs font-semibold text-[#66758a]">
                    {dictionary.table.slug}
                  </dt>
                  <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-[#132238]">
                    {center.slug}
                  </dd>
                </div>
                <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <dt className="text-xs font-semibold text-[#66758a]">
                    {dictionary.table.status}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-[#132238]">
                    {dictionary.statuses[center.status] ?? center.status}
                  </dd>
                </div>
                <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <dt className="text-xs font-semibold text-[#66758a]">
                    {dictionary.table.usersCount}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-[#132238]">
                    {formatNumber(center.usersCount)}
                  </dd>
                </div>
                <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <dt className="text-xs font-semibold text-[#66758a]">
                    {dictionary.table.createdAt}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-[#132238]">
                    {formatDate(center.createdAt, locale)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white shadow-sm">
              <div className="border-b border-[#E5E7EB] p-5">
                <h2 className="text-lg font-semibold text-[#0B2D5C]">
                  {dictionary.page.usersTitle}
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">
                  {dictionary.page.usersSubtitle}
                </p>
              </div>

              {center.users.length === 0 ? (
                <div className="p-6 text-sm font-medium text-[#66758a]">
                  {dictionary.page.emptyUsers}
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
                            {dictionary.table.email}
                          </th>
                          <th className="px-5 py-3 text-start">
                            {dictionary.table.role}
                          </th>
                          <th className="px-5 py-3 text-start">
                            {dictionary.table.status}
                          </th>
                          <th className="px-5 py-3 text-start">
                            {dictionary.table.createdAt}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {center.users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-5 py-4 font-semibold text-[#132238]">
                              {user.fullName || user.email}
                            </td>
                            <td className="px-5 py-4 text-[#40516a]">
                              {user.email}
                            </td>
                            <td className="px-5 py-4 text-[#40516a]">
                              {user.roleName ?? user.role}
                            </td>
                            <td className="px-5 py-4 text-[#40516a]">
                              {user.status}
                            </td>
                            <td className="px-5 py-4 text-[#40516a]">
                              {formatDate(user.createdAt, locale)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-[#E5E7EB] lg:hidden">
                    {center.users.map((user) => (
                      <article key={user.id} className="space-y-3 p-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-[#0B2D5C]">
                            {user.fullName || user.email}
                          </h3>
                          <p className="mt-1 truncate text-sm text-[#66758a]">
                            {user.email}
                          </p>
                        </div>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs font-semibold text-[#66758a]">
                              {dictionary.table.role}
                            </dt>
                            <dd className="mt-1 text-[#132238]">
                              {user.roleName ?? user.role}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-[#66758a]">
                              {dictionary.table.status}
                            </dt>
                            <dd className="mt-1 text-[#132238]">
                              {user.status}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}

        {isManagerModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              aria-label={dictionary.actions.cancel}
              className="absolute inset-0 bg-[#0B2D5C]/45"
              onClick={() => setIsManagerModalOpen(false)}
              type="button"
            />
            <form
              className="relative w-full max-w-xl rounded-md border border-[#E5E7EB] bg-white p-5 shadow-2xl"
              onSubmit={handleManagerSubmit}
            >
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#0B2D5C]">
                  {dictionary.page.managerModalTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#66758a]">
                  {dictionary.page.managerModalSubtitle}
                </p>
              </div>

              {managerSaveStatus === "error" ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {dictionary.page.managerCreateError}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className="text-sm font-medium text-[#24364f]">
                    {dictionary.table.fullName}
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                    onChange={(event) =>
                      updateManagerField("fullName", event.target.value)
                    }
                    value={managerForm.fullName}
                  />
                  {managerErrors.fullName ? (
                    <span className="mt-1 block text-xs font-medium text-rose-700">
                      {managerErrors.fullName}
                    </span>
                  ) : null}
                </label>

                <label className="block min-w-0">
                  <span className="text-sm font-medium text-[#24364f]">
                    {dictionary.table.email}
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                    onChange={(event) =>
                      updateManagerField("email", event.target.value)
                    }
                    type="email"
                    value={managerForm.email}
                  />
                  {managerErrors.email ? (
                    <span className="mt-1 block text-xs font-medium text-rose-700">
                      {managerErrors.email}
                    </span>
                  ) : null}
                </label>

                <label className="block min-w-0">
                  <span className="text-sm font-medium text-[#24364f]">
                    {dictionary.table.phone}
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                    onChange={(event) =>
                      updateManagerField("phone", event.target.value)
                    }
                    value={managerForm.phone}
                  />
                  {managerErrors.phone ? (
                    <span className="mt-1 block text-xs font-medium text-rose-700">
                      {managerErrors.phone}
                    </span>
                  ) : null}
                </label>

                <label className="block min-w-0">
                  <span className="text-sm font-medium text-[#24364f]">
                    {dictionary.table.temporaryPassword}
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                    onChange={(event) =>
                      updateManagerField(
                        "temporaryPassword",
                        event.target.value,
                      )
                    }
                    type="password"
                    value={managerForm.temporaryPassword}
                  />
                  {managerErrors.temporaryPassword ? (
                    <span className="mt-1 block text-xs font-medium text-rose-700">
                      {managerErrors.temporaryPassword}
                    </span>
                  ) : null}
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className={buttonClassName("secondary", "md")}
                  onClick={() => setIsManagerModalOpen(false)}
                  type="button"
                >
                  {dictionary.actions.cancel}
                </button>
                <button
                  className={buttonClassName("primary", "md")}
                  disabled={managerSaveStatus === "saving"}
                  type="submit"
                >
                  {dictionary.actions.saveManager}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </SuperAdminLayout>
  );
}
