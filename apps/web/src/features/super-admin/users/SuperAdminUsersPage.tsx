"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  buttonClassName,
  primaryButtonClassName,
} from "@/components/ui/button-styles";
import { AdminState } from "@/components/ui/admin-surfaces";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import {
  RoleBadge,
  centerRoleKeys,
  getRoleLabel,
  platformRoleKeys,
  type CenterRoleKey,
} from "@/features/super-admin/users/role-display";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatNumber } from "@/i18n/formatters";
import { superAdminUsersDictionaries } from "@/i18n/dictionaries/super-admin-users";
import {
  createSuperAdminUser,
  listPlatformRoles,
  listSuperAdminUsers,
  resetSuperAdminUserPassword,
  updateSuperAdminUser,
  updateSuperAdminUserStatus,
  type CreateSuperAdminUserPayload,
  type PlatformRoleOption,
  type SuperAdminUser,
  type SuperAdminUserStatus,
} from "@/lib/api/super-admin-users";
import {
  listSuperAdminCenters,
  type ApiCenter,
} from "@/lib/api/super-admin-centers";

type Dictionary = (typeof superAdminUsersDictionaries)["en"];

type UserFormState = {
  centerId: string;
  centerRoleKey: "" | CenterRoleKey;
  email: string;
  fullName: string;
  phone: string;
  platformRoleKey: string;
  status: Exclude<SuperAdminUserStatus, "DELETED">;
  temporaryPassword: string;
};

type ResetPasswordModalState = {
  email?: string | null;
  fullName: string;
  temporaryPassword: string;
};

const initialFormState: UserFormState = {
  centerId: "",
  centerRoleKey: "",
  email: "",
  fullName: "",
  phone: "",
  platformRoleKey: "",
  status: "INVITED",
  temporaryPassword: "",
};

const defaultStats = {
  activeUsers: 0,
  pendingUsers: 0,
  suspendedUsers: 0,
  totalUsers: 0,
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

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "gold" | "neutral" | "success";
}) {
  const styles = {
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    gold: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function statusTone(status: SuperAdminUserStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "INVITED") return "gold";
  if (status === "INACTIVE") return "neutral";
  return "danger";
}

function statusLabel(status: SuperAdminUserStatus, dictionary: Dictionary) {
  if (status === "ACTIVE") return dictionary.statuses.active;
  if (status === "INVITED") return dictionary.statuses.pending;
  if (status === "INACTIVE") return dictionary.statuses.inactive;
  return dictionary.statuses.suspended;
}

function RoleSummary({
  locale,
  user,
}: {
  locale: Parameters<typeof getRoleLabel>[1];
  user: SuperAdminUser;
}) {
  const activeRoles = user.roles?.filter((assignment) => assignment.status === "ACTIVE") ?? [];

  if (activeRoles.length === 0) return "-";

  return (
    <span className="flex min-w-0 flex-wrap gap-2">
      {activeRoles.map((assignment) => (
        <span className="inline-flex min-w-0 max-w-full items-center gap-1.5" key={assignment.id}>
          <RoleBadge locale={locale} roleKey={assignment.role.key} />
          {assignment.center?.name ? (
            <span className="max-w-36 truncate text-xs font-medium text-[#66758a]">
              {assignment.center.name}
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

function DetailPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">
        {value}
      </div>
    </div>
  );
}

function getErrorText(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

function computeUserStats(users: SuperAdminUser[]) {
  return users.reduce(
    (accumulator, user) => {
      if (user.status === "ACTIVE") accumulator.activeUsers += 1;
      if (user.status === "INVITED") accumulator.pendingUsers += 1;
      if (user.status === "SUSPENDED") accumulator.suspendedUsers += 1;
      if (user.status !== "DELETED") accumulator.totalUsers += 1;
      return accumulator;
    },
    { ...defaultStats },
  );
}

function UserModal({
  centers,
  dictionary,
  form,
  isEdit,
  onClose,
  onSubmit,
  locale,
  platformRoleOptions,
  saveError,
  saveLoading,
  setForm,
}: {
  centers: ApiCenter[];
  dictionary: Dictionary;
  form: UserFormState;
  isEdit: boolean;
  onClose: () => void;
  onSubmit: () => void;
  locale: Parameters<typeof getRoleLabel>[1];
  platformRoleOptions: Array<{ key: string; label: string }>;
  saveError: string;
  saveLoading: boolean;
  setForm: (updater: (current: UserFormState) => UserFormState) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071B35]/45 p-4">
      <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(11,45,92,0.22)]">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h3 className="text-base font-bold text-[#0B2D5C]">
            {isEdit ? dictionary.form.editTitle : dictionary.form.addTitle}
          </h3>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label={dictionary.form.fullName}>
            <input
              className="field-input"
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
              value={form.fullName}
            />
          </Field>
          <Field label={dictionary.form.email}>
            <input
              className="field-input"
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              type="email"
              value={form.email}
            />
          </Field>
          <Field label={`${dictionary.form.phone} (${dictionary.form.optional})`}>
            <input
              className="field-input"
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              value={form.phone}
            />
          </Field>
          {!isEdit ? (
            <Field label={dictionary.form.temporaryPassword}>
              <input
                className="field-input"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    temporaryPassword: event.target.value,
                  }))
                }
                type="password"
                value={form.temporaryPassword}
              />
            </Field>
          ) : null}
          <Field label={dictionary.form.status}>
            <select
              className="field-input"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as UserFormState["status"],
                }))
              }
              value={form.status}
            >
              <option value="INVITED">{dictionary.statuses.pending}</option>
              <option value="ACTIVE">{dictionary.statuses.active}</option>
              <option value="INACTIVE">{dictionary.statuses.inactive}</option>
              <option value="SUSPENDED">{dictionary.statuses.suspended}</option>
            </select>
          </Field>
          {!isEdit ? (
            <Field label={`${dictionary.form.platformRole} (${dictionary.form.optional})`}>
              <select
                className="field-input"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    platformRoleKey: event.target.value,
                  }))
                }
                value={form.platformRoleKey}
              >
                <option value="">{dictionary.form.noPlatformRole}</option>
                {platformRoleOptions.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {!isEdit ? (
            <>
              <Field label={`${dictionary.form.center} (${dictionary.form.optional})`}>
                <select
                  className="field-input"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      centerId: event.target.value,
                      centerRoleKey: event.target.value ? current.centerRoleKey : "",
                    }))
                  }
                  value={form.centerId}
                >
                  <option value="">{dictionary.form.noCenter}</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`${dictionary.form.centerRole} (${dictionary.form.optional})`}>
                <select
                  className="field-input"
                  disabled={!form.centerId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      centerRoleKey: event.target.value as UserFormState["centerRoleKey"],
                    }))
                  }
                  value={form.centerRoleKey}
                >
                  <option value="">{dictionary.form.noCenterRole}</option>
                  {centerRoleKeys.map((roleKey) => (
                    <option key={roleKey} value={roleKey}>
                      {getRoleLabel(roleKey, locale)}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}
        </div>
        {saveError ? (
          <p className="mx-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {saveError}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
            onClick={onClose}
            type="button"
          >
            {dictionary.actions.cancel}
          </button>
          <button
            className={buttonClassName("primary", "md", "w-full sm:w-auto")}
            disabled={saveLoading}
            onClick={onSubmit}
            type="button"
          >
            {dictionary.actions.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block min-w-0 text-sm font-medium text-[#24364f]">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
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

export function SuperAdminUsersPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const dictionary = superAdminUsersDictionaries[locale];
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [stats, setStats] = useState(defaultStats);
  const [centers, setCenters] = useState<ApiCenter[]>([]);
  const [platformRoles, setPlatformRoles] = useState<PlatformRoleOption[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "ALL";
    const s = new URLSearchParams(window.location.search).get("status");
    if (s === "active") return "ACTIVE";
    if (s === "inactive") return "INACTIVE";
    return "ALL";
  });
  const [roleFilter, setRoleFilter] = useState(() => {
    if (typeof window === "undefined") return "ALL";
    return new URLSearchParams(window.location.search).get("role") ?? "ALL";
  });
  const [highlightedUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("userId");
  });
  const [urlBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    const p = new URLSearchParams(window.location.search);
    return Boolean(p.get("status") || p.get("role") || p.get("userId"));
  });
  const [loadStatus, setLoadStatus] = useState<"error" | "loading" | "ready">(
    "loading",
  );
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetPassword, setResetPassword] =
    useState<ResetPasswordModalState | null>(null);

  const platformRoleOptions = useMemo(() => {
    const roleMap = new Map(platformRoles.map((role) => [role.key.toUpperCase(), role.key]));

    return platformRoleKeys.map((roleKey) => ({
      key: roleMap.get(roleKey) ?? roleKey,
      label: getRoleLabel(roleKey, locale),
    }));
  }, [locale, platformRoles]);

  const centerRoleOptions = useMemo(
    () =>
      centerRoleKeys.map((roleKey) => ({
        key: roleKey,
        label: getRoleLabel(roleKey, locale),
      })),
    [locale],
  );

  function clearUrlFilter() {
    setStatusFilter("ALL");
    setRoleFilter("ALL");
    router.replace("/super-admin/users", { scroll: false });
  }

  async function loadUsers() {
    try {
      setLoadStatus("loading");
      const [usersResult, centersResult, rolesResult] = await Promise.all([
        listSuperAdminUsers({
          role: roleFilter,
          search,
          status: statusFilter,
        }),
        listSuperAdminCenters(),
        listPlatformRoles(),
      ]);
      const nextUsers = usersResult.data ?? [];
      setUsers(nextUsers);
      setStats(usersResult.stats ?? computeUserStats(nextUsers));
      setCenters(centersResult.data);
      setPlatformRoles(rolesResult.data);
      setLoadStatus("ready");
    } catch {
      setLoadStatus("error");
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadUsers();
    }, 250);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    if (loadStatus === "ready" && highlightedUserId) {
      window.setTimeout(() => {
        document
          .getElementById(`user-row-${highlightedUserId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [loadStatus, highlightedUserId]);

  function openCreateModal() {
    setEditingUserId(null);
    setForm(initialFormState);
    setSaveError("");
    setIsModalOpen(true);
  }

  function openEditModal(user: SuperAdminUser) {
    setEditingUserId(user.id);
    setForm({
      ...initialFormState,
      email: user.email ?? "",
      fullName: user.fullName,
      phone: user.phone ?? "",
      status: user.status === "DELETED" ? "INACTIVE" : user.status,
    });
    setSaveError("");
    setIsModalOpen(true);
  }

  async function saveUser() {
    try {
      setSaveLoading(true);
      setSaveError("");
      if (editingUserId) {
        await updateSuperAdminUser(editingUserId, {
          email: form.email,
          fullName: form.fullName,
          phone: form.phone,
          status: form.status,
        });
      } else {
        const payload: CreateSuperAdminUserPayload = {
          email: form.email,
          fullName: form.fullName,
          phone: form.phone,
          platformRoleKey: form.platformRoleKey || undefined,
          status: form.status,
          temporaryPassword: form.temporaryPassword,
          ...(form.centerId && form.centerRoleKey
            ? { centerId: form.centerId, centerRoleKey: form.centerRoleKey }
            : {}),
        };
        await createSuperAdminUser(payload);
      }
      setNotice(dictionary.values.saved);
      setIsModalOpen(false);
      await loadUsers();
    } catch (error) {
      setSaveError(getErrorText(error, dictionary.values.loadError));
    } finally {
      setSaveLoading(false);
    }
  }

  async function changeStatus(user: SuperAdminUser) {
    try {
      const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateSuperAdminUserStatus(user.id, nextStatus);
      setNotice(dictionary.values.statusUpdated);
      await loadUsers();
    } catch (error) {
      setNotice(getErrorText(error, dictionary.values.loadError));
    }
  }

  async function resetPasswordFor(user: SuperAdminUser) {
    try {
      const result = await resetSuperAdminUserPassword(user.id);
      setResetPassword({
        email: user.email,
        fullName: user.fullName,
        temporaryPassword: result.temporaryPassword,
      });
      setNotice(dictionary.values.passwordReset);
      await loadUsers();
    } catch (error) {
      setNotice(getErrorText(error, dictionary.values.loadError));
    }
  }

  const statCards = [
    ["totalUsers", stats.totalUsers],
    ["activeUsers", stats.activeUsers],
    ["pendingUsers", stats.pendingUsers],
    ["suspendedUsers", stats.suspendedUsers],
  ] as const;

  return (
    <SuperAdminLayout activeNav="users" dictionary={dictionary}>
      <style jsx global>{`
        .field-input {
          height: 2.75rem;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          background: white;
          padding: 0 0.75rem;
          color: #132238;
          outline: none;
        }
        .field-input:focus {
          border-color: #0b2d5c;
          box-shadow: 0 0 0 3px rgb(11 45 92 / 0.12);
        }
      `}</style>
      <div className="min-w-0 max-w-full space-y-6">
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
              {dictionary.header.eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#0B2D5C]">
              {dictionary.header.title}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">
              {dictionary.header.subtitle}
            </p>
          </div>
          <button
            className={primaryButtonClassName("w-full sm:w-auto")}
            onClick={openCreateModal}
            type="button"
          >
            {dictionary.actions.addNewUser}
          </button>
        </section>

        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {urlBanner ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#C8A45D]/30 bg-[#FFFBF0] px-4 py-2.5">
            <span className="text-xs font-semibold text-[#7A5C20]">
              {statusFilter !== "ALL"
                ? `${dictionary.filters.status}: ${dictionary.statuses[statusFilter.toLowerCase() as keyof typeof dictionary.statuses] ?? statusFilter}`
                : roleFilter !== "ALL"
                  ? `${dictionary.filters.role}: ${roleFilter}`
                  : dictionary.filters.status}
            </span>
            <button
              className="ms-auto shrink-0 rounded px-2.5 py-1 text-xs font-medium text-[#7A5C20] hover:bg-[#C8A45D]/15"
              onClick={clearUrlFilter}
              type="button"
            >
              {dictionary.filters.clearFilter}
            </button>
          </div>
        ) : null}

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(([key, value]) => (
            <article
              className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
              key={key}
            >
              <p className="text-sm font-medium text-[#66758a]">
                {dictionary.stats[key]}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">
                {formatNumber(value)}
              </p>
            </article>
          ))}
        </section>

        <Section title={dictionary.sections.searchFilters}>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px] lg:items-end">
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.filters.searchLabel}
              </span>
              <input
                className="field-input mt-2"
                onChange={(event) => setSearch(event.target.value)}
                placeholder={dictionary.filters.searchPlaceholder}
                type="search"
                value={search}
              />
            </label>
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.filters.status}
              </span>
              <select
                className="field-input mt-2"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="ALL">{dictionary.filters.all}</option>
                <option value="ACTIVE">{dictionary.statuses.active}</option>
                <option value="INVITED">{dictionary.statuses.pending}</option>
                <option value="INACTIVE">{dictionary.statuses.inactive}</option>
                <option value="SUSPENDED">{dictionary.statuses.suspended}</option>
              </select>
            </label>
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.filters.role}
              </span>
              <select
                className="field-input mt-2"
                onChange={(event) => setRoleFilter(event.target.value)}
                value={roleFilter}
              >
                <option value="ALL">{dictionary.filters.all}</option>
                <optgroup label={dictionary.form.platformRole}>
                  {platformRoleOptions.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={dictionary.form.centerRole}>
                  {centerRoleOptions.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
          </div>
        </Section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.35fr)]">
          <Section title={dictionary.sections.usersTable}>
            {loadStatus === "loading" ? (
              <AdminState
                className="min-h-0 border-0 bg-transparent p-0 shadow-none"
                loading
                title={dictionary.values.loading}
              />
            ) : null}
            {loadStatus === "error" ? (
              <AdminState
                className="min-h-0 border-0 bg-transparent p-0 shadow-none"
                title={dictionary.values.loadError}
                tone="error"
              />
            ) : null}
            {loadStatus === "ready" && users.length === 0 ? (
              <AdminState
                className="min-h-0 border-0 bg-transparent p-0 shadow-none"
                title={dictionary.values.empty}
              />
            ) : null}
            {loadStatus === "ready" && users.length > 0 ? (
              <div className="grid min-w-0 grid-cols-1 gap-4">
                {users.map((row) => (
                  <article
                    className={`grid min-w-0 gap-4 rounded-lg border bg-white p-4 shadow-[0_10px_24px_rgba(11,45,92,0.04)] transition lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] lg:items-center ${row.id === highlightedUserId ? "border-[#C8A45D]/60 ring-2 ring-[#C8A45D]/30" : "border-[#E5E7EB] hover:border-[#C8A45D]/55 hover:shadow-[0_14px_32px_rgba(11,45,92,0.08)]"}`}
                    id={`user-row-${row.id}`}
                    key={row.id}
                  >
                    <button
                      className="min-w-0 text-start"
                      onClick={() => router.push(`/super-admin/users/${row.id}`)}
                      type="button"
                    >
                      <h4 className="truncate text-base font-semibold text-[#0B2D5C]">
                        {row.fullName}
                      </h4>
                      <p className="mt-1 break-all text-sm text-[#66758a]">
                        {row.email ?? "-"}
                      </p>
                    </button>

                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <DetailPair
                        label={dictionary.table.role}
                        value={<RoleSummary locale={locale} user={row} />}
                      />
                      <Badge
                        label={statusLabel(row.status, dictionary)}
                        tone={statusTone(row.status)}
                      />
                    </div>

                    <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                      <button
                        className={buttonClassName("secondary", "sm")}
                        onClick={() => router.push(`/super-admin/users/${row.id}`)}
                        type="button"
                      >
                        {dictionary.actions.view}
                      </button>
                      <button
                        className={buttonClassName("secondary", "sm")}
                        onClick={() => openEditModal(row)}
                        type="button"
                      >
                        {dictionary.actions.edit}
                      </button>
                      <button
                        className={buttonClassName(
                          row.status === "ACTIVE" ? "warning" : "success",
                          "sm",
                        )}
                        onClick={() => void changeStatus(row)}
                        type="button"
                      >
                        {row.status === "ACTIVE"
                          ? dictionary.actions.deactivate
                          : dictionary.actions.activate}
                      </button>
                      <button
                        className={buttonClassName("secondary", "sm")}
                        onClick={() => void resetPasswordFor(row)}
                        type="button"
                      >
                        {dictionary.actions.resetPassword}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </Section>

          <Section title={dictionary.sections.rolesPreview}>
            <p className="mb-4 text-sm leading-6 text-[#66758a]">
              {dictionary.values.rolePreviewHint}
            </p>
            <div className="grid min-w-0 gap-3">
              <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#66758a]">
                  {dictionary.form.platformRole}
                </p>
                <div className="flex flex-wrap gap-2">
                  {platformRoleOptions.map((role) => (
                    <RoleBadge key={role.key} locale={locale} roleKey={role.key} />
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#66758a]">
                  {dictionary.form.centerRole}
                </p>
                <div className="flex flex-wrap gap-2">
                  {centerRoleOptions.map((role) => (
                    <RoleBadge key={role.key} locale={locale} roleKey={role.key} />
                  ))}
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {isModalOpen ? (
        <UserModal
          centers={centers}
          dictionary={dictionary}
          form={form}
          isEdit={Boolean(editingUserId)}
          locale={locale}
          onClose={() => setIsModalOpen(false)}
          onSubmit={() => void saveUser()}
          platformRoleOptions={platformRoleOptions}
          saveError={saveError}
          saveLoading={saveLoading}
          setForm={setForm}
        />
      ) : null}
      {resetPassword ? (
        <ResetPasswordModal
          dictionary={dictionary}
          onClose={() => setResetPassword(null)}
          reset={resetPassword}
        />
      ) : null}
    </SuperAdminLayout>
  );
}
