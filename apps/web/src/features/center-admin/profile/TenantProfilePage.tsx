"use client";

import { useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  changeCenterPassword,
  logoutCenterUser,
} from "@/lib/api/center-auth";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import { useRouter } from "next/navigation";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  getPermissionGroups,
  permKeyToDictKey,
} from "./role-permissions";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
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

const sectionNavKeys: Record<string, keyof CenterAdminDictionary["nav"]> = {
  staff: "staff",
  services: "services",
  appointments: "appointments",
  billing: "billing",
  payments: "billing",
};

export function TenantProfilePage() {
  const router = useRouter();
  const { locale } = useLanguage();

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwNotice, setPwNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handlePwChange(field: keyof typeof pwForm, value: string) {
    setPwForm((prev) => ({ ...prev, [field]: value }));
    setPwErrors((prev) => ({ ...prev, [field]: "" }));
  }

  return (
    <CenterAdminShell
      activeNav="settings"
      requiredPermission={null}
      title={(d) => d.profile.title}
      subtitle={(d) => d.profile.subtitle}
    >
      {({ dictionary, session }) => {
        const d = dictionary;
        const groups = getPermissionGroups(session.permissions);

        const logout = async () => {
          setIsLoggingOut(true);
          await logoutCenterUser().catch(() => null);
          router.replace("/tenant/login");
        };

        const submitPasswordChange = async () => {
          const errors: Record<string, string> = {};

          if (!pwForm.currentPassword) {
            errors.currentPassword = d.staff.fieldRequired;
          }

          if (!pwForm.newPassword) {
            errors.newPassword = d.staff.fieldRequired;
          } else if (pwForm.newPassword.length < 8) {
            errors.newPassword = d.profile.passwordTooShort;
          }

          if (pwForm.newPassword && pwForm.newPassword !== pwForm.confirmPassword) {
            errors.confirmPassword = d.profile.passwordMismatch;
          }

          if (Object.keys(errors).length > 0) {
            setPwErrors(errors);
            return;
          }

          setIsSaving(true);
          setPwErrors({});
          setPwNotice("");

          try {
            await changeCenterPassword(
              pwForm.currentPassword,
              pwForm.newPassword,
            );
            setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPwNotice(d.profile.passwordUpdated);
          } catch (error) {
            if (error instanceof ApiRequestError) {
              const details = error.details as
                | { errors?: Record<string, string> }
                | null
                | undefined;
              if (details?.errors) {
                const mapped: Record<string, string> = {};
                if (details.errors.currentPassword) {
                  mapped.currentPassword = d.profile.wrongPassword;
                }
                if (details.errors.newPassword) {
                  mapped.newPassword = d.profile.passwordTooShort;
                }
                if (Object.keys(mapped).length > 0) {
                  setPwErrors(mapped);
                  return;
                }
              }
            }
            setPwErrors({ currentPassword: d.profile.wrongPassword });
          } finally {
            setIsSaving(false);
          }
        };

        const userLanguage = {
          en: d.languages.en,
          ar: d.languages.ar,
          he: d.languages.he,
        }[locale];

        return (
          <div className="mt-5 space-y-5">
            {/* ── Identity card ── */}
            <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                {/* Avatar */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0B2D5C] text-lg font-bold text-white">
                  {getInitials(session.user.fullName || session.user.email || "?") || "?"}
                </div>

                {/* Name / role block */}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="break-words text-xl font-semibold text-[#0B2D5C]">
                      {session.user.fullName || d.common.notAvailable}
                    </h2>
                    <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4338CA]">
                      {d.roles[session.role.key]}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        session.user.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-[#FFF7F7] text-[#B42318]"
                      }`}
                    >
                      {session.user.status === "ACTIVE"
                        ? d.staffStatuses.ACTIVE
                        : d.staffStatuses.INACTIVE}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#66758a]">
                    {session.user.email || d.common.notAvailable}
                  </p>
                </div>

                {/* Logout */}
                <button
                  className={buttonClassName("warning", "md", "shrink-0")}
                  disabled={isLoggingOut}
                  onClick={logout}
                  type="button"
                >
                  {isLoggingOut ? d.shell.loggingOut : d.shell.logout}
                </button>
              </div>

              {/* Detail grid */}
              <dl className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Detail label={d.patients.fullName} value={session.user.fullName || d.common.notAvailable} />
                <Detail label={d.patients.email} value={session.user.email ?? d.common.notAvailable} />
                <Detail label={d.patients.phone} value={session.user.phone ?? d.common.notAvailable} />
                <Detail label={d.profile.center} value={session.center.name} />
                <Detail label={d.staff.role} value={d.roles[session.role.key]} />
                <Detail label={d.shell.language} value={userLanguage ?? locale} />
                {session.user.createdAt ? (
                  <Detail label={d.profile.memberSince} value={formatDate(session.user.createdAt, locale)} />
                ) : null}
              </dl>
            </section>

            {/* ── Permissions ── */}
            <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <h3 className="mb-4 text-base font-semibold text-[#0B2D5C]">
                {d.profile.permissionsTitle}
              </h3>

              {groups.length === 0 ? (
                <p className="text-sm text-[#66758a]">{d.profile.noPermissions}</p>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => {
                    const navKey = sectionNavKeys[group.sectionKey];
                    const sectionLabel = navKey ? d.nav[navKey] : group.sectionKey;

                    return (
                      <div key={group.sectionKey} className="min-w-0">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#C8A45D]">
                          {sectionLabel}
                        </p>
                        <div className="flex min-w-0 flex-wrap gap-2">
                          {group.permissions.map((perm) => {
                            const dictKey = permKeyToDictKey[perm] as keyof typeof d.permissionLabels;
                            return (
                              <span
                                key={perm}
                                className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]"
                              >
                                {d.permissionLabels[dictKey]}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Change password ── */}
            <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <h3 className="mb-4 text-base font-semibold text-[#0B2D5C]">
                {d.profile.changePassword}
              </h3>

              {pwNotice ? (
                <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  {pwNotice}
                </p>
              ) : null}

              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <PasswordField
                  error={pwErrors.currentPassword}
                  label={d.profile.currentPassword}
                  value={pwForm.currentPassword}
                  onChange={(v) => handlePwChange("currentPassword", v)}
                />
                <PasswordField
                  error={pwErrors.newPassword}
                  label={d.profile.newPassword}
                  value={pwForm.newPassword}
                  onChange={(v) => handlePwChange("newPassword", v)}
                />
                <PasswordField
                  error={pwErrors.confirmPassword}
                  label={d.profile.confirmPassword}
                  value={pwForm.confirmPassword}
                  onChange={(v) => handlePwChange("confirmPassword", v)}
                />
              </div>

              <div className="mt-4">
                <button
                  className={buttonClassName("primary", "md")}
                  disabled={isSaving}
                  onClick={submitPasswordChange}
                  type="button"
                >
                  {isSaving ? d.profile.updating : d.profile.updatePassword}
                </button>
              </div>
            </section>
          </div>
        );
      }}
    </CenterAdminShell>
  );
}

function PasswordField({
  error,
  label,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-semibold text-[#24364f]">
        {label}
      </label>
      <input
        className={`w-full rounded-md border px-3 py-2 text-sm text-[#132238] outline-none transition focus:ring-2 focus:ring-[#0B2D5C]/20 ${
          error
            ? "border-[#F3B8B8] bg-[#FFF7F7]"
            : "border-[#E5E7EB] bg-white focus:border-[#0B2D5C]"
        }`}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p className="mt-1 text-xs font-semibold text-[#B42318]">{error}</p>
      ) : null}
    </div>
  );
}
