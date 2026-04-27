"use client";

import { useState, type ReactNode } from "react";
import { buttonClassName, primaryButtonClassName } from "@/components/ui/button-styles";
import { SuperAdminActionMenu } from "@/features/super-admin/components/SuperAdminActionMenu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatNumber } from "@/i18n/formatters";
import { superAdminUsersDictionaries } from "@/i18n/dictionaries/super-admin-users";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { rolePreview, userFilters, userRows, userStats } from "./users-data";

type Dictionary = (typeof superAdminUsersDictionaries)["en"];
type UserRow = (typeof userRows)[number];

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

function Badge({ label, tone }: { label: string; tone: "danger" | "gold" | "neutral" | "success" }) {
  const styles = {
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    gold: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}>
      {label}
    </span>
  );
}

function statusTone(status: UserRow["status"]) {
  if (status === "active") return "success";
  if (status === "pending") return "gold";
  return "danger";
}

function ActionMenu({
  dictionary,
  isOpen,
  onClose,
  onToggle,
  userId,
}: {
  dictionary: Dictionary;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  userId: string;
}) {
  return (
    <SuperAdminActionMenu
      isOpen={isOpen}
      items={[
        { href: `/super-admin/users/${userId}`, icon: "view", label: dictionary.actions.view },
        { icon: "edit", label: dictionary.actions.edit },
        { icon: "key", label: dictionary.actions.resetPassword },
        { icon: "suspend", label: dictionary.actions.suspend, tone: "warning" },
        { icon: "delete", label: dictionary.actions.delete, tone: "danger" },
      ]}
      onClose={onClose}
      onToggle={onToggle}
      triggerLabel={dictionary.table.actions}
    />
  );
}

function DetailPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">{value}</div>
    </div>
  );
}

export function SuperAdminUsersPage() {
  const { locale } = useLanguage();
  const dictionary = superAdminUsersDictionaries[locale];
  const [openActions, setOpenActions] = useState<string | null>(null);

  return (
    <SuperAdminLayout activeNav="users" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
              {dictionary.header.eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#0B2D5C]">{dictionary.header.title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">{dictionary.header.subtitle}</p>
          </div>
          <button className={primaryButtonClassName("w-full sm:w-auto")} type="button">
            {dictionary.actions.addNewUser}
          </button>
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {userStats.map((stat) => (
            <article className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]" key={stat.key}>
              <p className="text-sm font-medium text-[#66758a]">{dictionary.stats[stat.key]}</p>
              <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">{formatNumber(stat.value)}</p>
            </article>
          ))}
        </section>

        <Section title={dictionary.sections.searchFilters}>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">{dictionary.filters.searchLabel}</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                placeholder={dictionary.filters.searchPlaceholder}
                type="search"
              />
            </label>
            <div className="flex min-w-0 flex-wrap gap-2">
              <button className={buttonClassName("primary", "sm")} type="button">{dictionary.filters.all}</button>
              {userFilters.map((filter) => (
                <button className={buttonClassName("secondary", "sm")} key={filter} type="button">
                  {dictionary.filters[filter]}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.35fr)]">
          <Section title={dictionary.sections.usersTable}>
            <div className="hidden max-w-full overflow-x-auto md:block">
              <table className="w-full min-w-[1080px] border-collapse text-sm">
                <thead className="bg-[#F8FAFC] text-[#66758a]">
                  <tr>
                    {["userName", "email", "role", "department", "status", "lastLogin", "createdDate", "actions"].map((column) => (
                      <th className="px-4 py-3 text-start font-medium" key={column}>
                        {dictionary.table[column as keyof typeof dictionary.table]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userRows.map((row) => (
                    <tr className="border-t border-[#E5E7EB]" key={row.id}>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#0B2D5C]">{dictionary.names[row.nameKey]}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{row.email}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{dictionary.roles[row.role]}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{dictionary.departments[row.department]}</td>
                      <td className="px-4 py-4">
                        <Badge label={dictionary.statuses[row.status]} tone={statusTone(row.status)} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                        {row.lastLogin ? formatDate(row.lastLogin, locale) : dictionary.values.neverLoggedIn}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-[#526176]">{formatDate(row.createdDate, locale)}</td>
                      <td className="px-4 py-4 align-top">
                        <ActionMenu
                          dictionary={dictionary}
                          isOpen={openActions === row.id}
                          onClose={() => setOpenActions(null)}
                          onToggle={() => setOpenActions((current) => (current === row.id ? null : row.id))}
                          userId={row.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 md:hidden">
              <p className="text-sm leading-6 text-[#66758a]">{dictionary.values.mobileHint}</p>
              {userRows.map((row) => (
                <article className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]" key={row.id}>
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h4 className="break-words text-base font-semibold text-[#0B2D5C]">{dictionary.names[row.nameKey]}</h4>
                      <p className="mt-1 break-all text-sm text-[#66758a]">{row.email}</p>
                    </div>
                    <Badge label={dictionary.statuses[row.status]} tone={statusTone(row.status)} />
                  </div>
                  <div className="mt-4 grid min-w-0 grid-cols-1 gap-3">
                    <DetailPair label={dictionary.table.role} value={dictionary.roles[row.role]} />
                    <DetailPair label={dictionary.table.department} value={dictionary.departments[row.department]} />
                    <DetailPair label={dictionary.table.lastLogin} value={row.lastLogin ? formatDate(row.lastLogin, locale) : dictionary.values.neverLoggedIn} />
                    <DetailPair label={dictionary.table.createdDate} value={formatDate(row.createdDate, locale)} />
                  </div>
                  <div className="mt-4">
                    <ActionMenu
                      dictionary={dictionary}
                      isOpen={openActions === row.id}
                      onClose={() => setOpenActions(null)}
                      onToggle={() => setOpenActions((current) => (current === row.id ? null : row.id))}
                      userId={row.id}
                    />
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section title={dictionary.sections.rolesPreview}>
            <p className="mb-4 text-sm leading-6 text-[#66758a]">{dictionary.values.rolePreviewHint}</p>
            <div className="grid min-w-0 gap-3">
              {rolePreview.map((role) => (
                <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3" key={role}>
                  <p className="text-sm font-semibold text-[#0B2D5C]">{dictionary.roles[role]}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
