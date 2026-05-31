"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import {
  RoleBadge,
  centerRoleKeys,
  getRoleLabel,
  type CenterRoleKey,
} from "@/features/super-admin/users/role-display";
import { useLanguage } from "@/i18n/LanguageProvider";
import { superAdminUsersDictionaries } from "@/i18n/dictionaries/super-admin-users";
import { formatDate } from "@/i18n/formatters";
import {
  assignSuperAdminUserCenterRole,
  getSuperAdminUser,
  resetSuperAdminUserPassword,
  updateSuperAdminUserStatus,
  type SuperAdminUser,
} from "@/lib/api/super-admin-users";
import {
  listSuperAdminCenters,
  type ApiCenter,
} from "@/lib/api/super-admin-centers";

type Dictionary = (typeof superAdminUsersDictionaries)["en"];

type ResetPasswordModalState = {
  email?: string | null;
  fullName: string;
  temporaryPassword: string;
};

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items: Array<[string, ReactNode]> }) {
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

function statusLabel(user: SuperAdminUser, dictionary: Dictionary) {
  if (user.status === "ACTIVE") return dictionary.statuses.active;
  if (user.status === "INVITED") return dictionary.statuses.pending;
  if (user.status === "INACTIVE") return dictionary.statuses.inactive;
  return dictionary.statuses.suspended;
}

function ResetPasswordModal({
  dictionary,
  onClose,
  reset,
}: {
  dictionary: Dictionary;
  onClose: () => void;
  reset: ResetPasswordModalState;
}) {
  const [copyStatus, setCopyStatus] = useState<"copied" | "error" | "idle">(
    "idle",
  );

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(reset.temporaryPassword);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071B35]/45 p-4">
      <div className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(11,45,92,0.22)]">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h3 className="text-base font-bold text-[#0B2D5C]">
            {dictionary.actions.resetPassword}
          </h3>
          <p className="mt-1 break-words text-sm text-[#66758a]">
            {reset.fullName}
            {reset.email ? ` - ${reset.email}` : ""}
          </p>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-[#7A5C20]">
            {dictionary.values.passwordResetWarning}
          </div>
          <label className="block text-sm font-medium text-[#24364f]">
            {dictionary.values.temporaryPassword}
            <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
              <code
                className="min-h-11 min-w-0 flex-1 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5 font-mono text-sm text-[#0B2D5C]"
                dir="ltr"
              >
                {reset.temporaryPassword}
              </code>
              <button
                className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
                onClick={() => void copyPassword()}
                type="button"
              >
                {copyStatus === "copied"
                  ? dictionary.values.copied
                  : dictionary.values.copy}
              </button>
            </div>
          </label>
          {copyStatus === "error" ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {dictionary.values.copyFailed}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end border-t border-[#E5E7EB] px-5 py-4">
          <button
            className={buttonClassName("primary", "md", "w-full sm:w-auto")}
            onClick={onClose}
            type="button"
          >
            {dictionary.values.close}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SuperAdminUserDetailsPage({ userId }: { userId: string }) {
  const { locale } = useLanguage();
  const dictionary = superAdminUsersDictionaries[locale];
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [centers, setCenters] = useState<ApiCenter[]>([]);
  const [centerId, setCenterId] = useState("");
  const [centerRoleKey, setCenterRoleKey] =
    useState<CenterRoleKey>("CENTER_MANAGER");
  const [status, setStatus] = useState<"error" | "loading" | "ready">(
    "loading",
  );
  const [notice, setNotice] = useState("");
  const [resetPasswordState, setResetPasswordState] =
    useState<ResetPasswordModalState | null>(null);

  async function load() {
    try {
      setStatus("loading");
      const [userResult, centersResult] = await Promise.all([
        getSuperAdminUser(userId),
        listSuperAdminCenters(),
      ]);
      setUser(userResult);
      setCenters(centersResult.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      setResetPasswordState(null);
      return load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function changeStatus() {
    if (!user) return;
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await updateSuperAdminUserStatus(user.id, nextStatus);
    setNotice(dictionary.values.statusUpdated);
    await load();
  }

  async function resetPassword() {
    if (!user) return;
    const result = await resetSuperAdminUserPassword(user.id);
    setResetPasswordState({
      email: user.email,
      fullName: user.fullName,
      temporaryPassword: result.temporaryPassword,
    });
    setNotice(dictionary.values.passwordReset);
  }

  async function assignCenterRole() {
    if (!user || !centerId) return;
    await assignSuperAdminUserCenterRole(user.id, { centerId, roleKey: centerRoleKey });
    setNotice(dictionary.values.saved);
    await load();
  }

  return (
    <SuperAdminLayout activeNav="users" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-5">
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
              {dictionary.header.eyebrow}
            </p>
            <h2 className="mt-1 break-words text-xl font-semibold leading-snug text-[#0B2D5C]">
              {user?.fullName ?? dictionary.header.title}
            </h2>
            <p className="mt-1 break-all text-sm leading-6 text-[#66758a]">
              {user?.email ?? dictionary.header.subtitle}
            </p>
          </div>
          <Link
            className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
            href="/super-admin/users"
          >
            {dictionary.nav.users}
          </Link>
        </section>

        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {status === "loading" ? (
          <Section title={dictionary.sections.usersTable}>
            <AdminState
              className="min-h-0 border-0 bg-transparent p-0 shadow-none"
              loading
              title={dictionary.values.loading}
            />
          </Section>
        ) : null}

        {status === "error" ? (
          <Section title={dictionary.sections.usersTable}>
            <AdminState
              className="min-h-0 border-0 bg-transparent p-0 shadow-none"
              title={dictionary.values.loadError}
              tone="error"
            />
          </Section>
        ) : null}

        {status === "ready" && user ? (
          <>
            <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
              <Section title={dictionary.sections.usersTable}>
                <DetailList
                  items={[
                    [dictionary.form.fullName, user.fullName],
                    [dictionary.form.email, user.email ?? "-"],
                    [dictionary.form.phone, user.phone ?? "-"],
                    [dictionary.form.status, statusLabel(user, dictionary)],
                    [
                      dictionary.table.lastLogin,
                      user.lastLoginAt
                        ? formatDate(user.lastLoginAt, locale)
                        : dictionary.values.neverLoggedIn,
                    ],
                    [dictionary.table.createdDate, formatDate(user.createdAt, locale)],
                  ]}
                />
              </Section>

              <Section title={dictionary.table.actions}>
                <div className="grid gap-3">
                  <button
                    className={buttonClassName("secondary", "md")}
                    onClick={() => void resetPassword()}
                    type="button"
                  >
                    {dictionary.actions.resetPassword}
                  </button>
                  <button
                    className={buttonClassName(
                      user.status === "ACTIVE" ? "warning" : "success",
                      "md",
                    )}
                    onClick={() => void changeStatus()}
                    type="button"
                  >
                    {user.status === "ACTIVE"
                      ? dictionary.actions.deactivate
                      : dictionary.actions.activate}
                  </button>
                </div>
              </Section>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Section title={dictionary.form.platformRole}>
                <div className="grid gap-3">
                  {(user.roles ?? [])
                    .filter((assignment) => !assignment.center)
                    .map((assignment) => (
                      <DetailList
                        key={assignment.id}
                        items={[
                          [
                            dictionary.table.role,
                            <RoleBadge
                              key={assignment.role.key}
                              locale={locale}
                              roleKey={assignment.role.key}
                            />,
                          ],
                          [dictionary.table.status, assignment.status],
                        ]}
                      />
                    ))}
                </div>
              </Section>

              <Section title={dictionary.form.centerRole}>
                <div className="grid gap-3">
                  {(user.roles ?? [])
                    .filter((assignment) => assignment.center)
                    .map((assignment) => (
                      <DetailList
                        key={assignment.id}
                        items={[
                          [dictionary.form.center, assignment.center?.name ?? "-"],
                          [
                            dictionary.table.role,
                            <RoleBadge
                              key={assignment.role.key}
                              locale={locale}
                              roleKey={assignment.role.key}
                            />,
                          ],
                          [dictionary.table.status, assignment.status],
                        ]}
                      />
                    ))}
                  <div className="grid gap-3 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <select
                      className="h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm"
                      onChange={(event) => setCenterId(event.target.value)}
                      value={centerId}
                    >
                      <option value="">{dictionary.form.noCenter}</option>
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm"
                      onChange={(event) =>
                        setCenterRoleKey(event.target.value as CenterRoleKey)
                      }
                      value={centerRoleKey}
                    >
                      {centerRoleKeys.map((roleKey) => (
                        <option key={roleKey} value={roleKey}>
                          {getRoleLabel(roleKey, locale)}
                        </option>
                      ))}
                    </select>
                    <button
                      className={buttonClassName("primary", "md", "w-full sm:w-auto")}
                      disabled={!centerId}
                      onClick={() => void assignCenterRole()}
                      type="button"
                    >
                      {dictionary.actions.save}
                    </button>
                  </div>
                </div>
              </Section>
            </div>
          </>
        ) : null}
        {resetPasswordState ? (
          <ResetPasswordModal
            dictionary={dictionary}
            onClose={() => setResetPasswordState(null)}
            reset={resetPasswordState}
          />
        ) : null}
      </div>
    </SuperAdminLayout>
  );
}
