"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { useLanguage } from "@/i18n/LanguageProvider";
import { superAdminUserDetailsDictionaries } from "@/i18n/dictionaries/super-admin-user-details";
import { formatDate } from "@/i18n/formatters";
import {
  activityTimelineById,
  userDetailsById,
  type UserDetails,
} from "./user-details-data";

type Dictionary = (typeof superAdminUserDetailsDictionaries)["en"];
type UserStatus = UserDetails["status"];

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
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}>
      {label}
    </span>
  );
}

function statusTone(status: UserStatus) {
  if (status === "active") return "success";
  if (status === "pending") return "gold";
  return "danger";
}

function Avatar({ user }: { user: UserDetails }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-[#C8A45D]/40 bg-[#0B2D5C] text-xl font-semibold text-[#C8A45D]">
      {user.avatarInitials}
    </div>
  );
}

function DetailList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3" key={label}>
          <dt className="text-xs font-medium text-[#66758a]">{label}</dt>
          <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ChipList({
  emptyLabel,
  items,
}: {
  emptyLabel: string;
  items: readonly string[];
}) {
  if (items.length === 0) {
    return <p className="text-sm font-semibold text-[#66758a]">{emptyLabel}</p>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {items.map((item) => (
        <span className="rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-semibold text-[#24364f]" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function QuickActions({ dictionary, user }: { dictionary: Dictionary; user: UserDetails }) {
  const canActivate = user.status !== "active";
  const canSuspend = user.status === "active" || user.status === "pending";

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <button className={buttonClassName("primary", "md")} type="button">
        {dictionary.detailActions.editUser}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.detailActions.resetPassword}
      </button>
      <button className={buttonClassName("warning", "md")} disabled={!canSuspend} type="button">
        {dictionary.detailActions.suspendUser}
      </button>
      <button className={buttonClassName("success", "md")} disabled={!canActivate} type="button">
        {dictionary.detailActions.activateUser}
      </button>
      <button className={buttonClassName("secondary", "md")} type="button">
        {dictionary.detailActions.forceLogout}
      </button>
      <button className={buttonClassName("danger", "md")} type="button">
        {dictionary.detailActions.deleteUser}
      </button>
      <p className="text-xs leading-5 text-[#66758a] sm:col-span-2 xl:col-span-1">
        {dictionary.detailValues.futureAction}
      </p>
    </div>
  );
}

export function SuperAdminUserDetailsPage({ userId }: { userId: string }) {
  const { locale } = useLanguage();
  const dictionary = superAdminUserDetailsDictionaries[locale];
  const user = userDetailsById[userId as keyof typeof userDetailsById];

  if (!user) {
    return (
      <SuperAdminLayout activeNav="users" dictionary={dictionary}>
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
            {dictionary.detailHeader.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#0B2D5C]">
            {dictionary.detailValues.notFoundTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
            {dictionary.detailValues.notFoundDescription}
          </p>
          <Link className={buttonClassName("secondary", "md", "mt-5 w-full sm:w-auto")} href="/super-admin/users">
            {dictionary.detailActions.backToUsers}
          </Link>
        </section>
      </SuperAdminLayout>
    );
  }

  const timeline = activityTimelineById[userId as keyof typeof activityTimelineById] ?? [];
  const directPermissions = user.directPermissions.map((permission) => dictionary.permissions[permission]);
  const restrictedAreas = user.restrictedAreas.map((area) => dictionary.restrictedAreas[area]);
  const responsibilities = user.responsibilities.map((responsibility) => dictionary.responsibilities[responsibility]);

  return (
    <SuperAdminLayout activeNav="users" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-5">
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                {dictionary.detailHeader.eyebrow}
              </p>
              <h2 className="mt-1 break-words text-xl font-semibold leading-snug text-[#0B2D5C]">
                {dictionary.names[user.nameKey]}
              </h2>
              <p className="mt-1 break-all text-sm leading-6 text-[#66758a]">
                {user.email}
              </p>
            </div>
          </div>
          <Link className={buttonClassName("secondary", "md", "w-full sm:w-auto")} href="/super-admin/users">
            {dictionary.detailActions.backToUsers}
          </Link>
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <Section title={dictionary.sections.overview}>
            <DetailList
              items={[
                [dictionary.fields.fullName, dictionary.names[user.nameKey]],
                [dictionary.fields.email, user.email],
                [dictionary.fields.mobile, user.mobile],
                [dictionary.fields.role, dictionary.roles[user.role]],
                [dictionary.fields.department, dictionary.departments[user.department]],
                [
                  dictionary.fields.status,
                  <Badge key="status" label={dictionary.statuses[user.status]} tone={statusTone(user.status)} />,
                ],
                [dictionary.fields.createdDate, formatDate(user.createdDate, locale)],
                [dictionary.fields.lastLogin, user.lastLogin ? formatDate(user.lastLogin, locale) : dictionary.values.neverLoggedIn],
                [dictionary.fields.lastActivity, formatDate(user.lastActivity, locale)],
                [dictionary.fields.twoFactor, user.twoFactorEnabled ? dictionary.detailValues.enabled : dictionary.detailValues.disabled],
              ]}
            />
          </Section>

          <Section title={dictionary.sections.quickActions}>
            <QuickActions dictionary={dictionary} user={user} />
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title={dictionary.sections.permissionsSummary}>
            <div className="grid min-w-0 gap-4">
              <DetailList
                items={[
                  [dictionary.fields.assignedRole, dictionary.roles[user.assignedRole]],
                  [dictionary.fields.accessLevel, dictionary.accessLevels[user.accessLevel]],
                ]}
              />
              <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
                <p className="text-xs font-medium text-[#66758a]">{dictionary.fields.directPermissions}</p>
                <div className="mt-2">
                  <ChipList emptyLabel={dictionary.detailValues.noDirectPermissions} items={directPermissions} />
                </div>
              </div>
              <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
                <p className="text-xs font-medium text-[#66758a]">{dictionary.fields.restrictedAreas}</p>
                <div className="mt-2">
                  <ChipList emptyLabel={dictionary.detailValues.noRestrictedAreas} items={restrictedAreas} />
                </div>
              </div>
            </div>
          </Section>

          <Section title={dictionary.sections.responsibilities}>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {responsibilities.map((responsibility) => (
                <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3" key={responsibility}>
                  <p className="break-words text-sm font-semibold text-[#24364f]">{responsibility}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title={dictionary.sections.activityTimeline}>
            <ol className="space-y-4">
              {timeline.map((item) => (
                <li className="flex min-w-0 gap-3" key={`${item.key}-${item.date}`}>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#C8A45D] bg-[#0B2D5C]" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#24364f]">
                      {dictionary.timeline[item.key]}
                    </p>
                    <p className="text-xs text-[#66758a]">{formatDate(item.date, locale)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={dictionary.sections.internalNotes}>
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">{dictionary.notes.label}</span>
              <textarea
                className="mt-2 min-h-36 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                defaultValue={user.notes}
                placeholder={dictionary.notes.placeholder}
              />
            </label>
            <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[#66758a]">{dictionary.notes.helper}</p>
              <button className={buttonClassName("secondary", "md", "w-full sm:w-auto")} type="button">
                {dictionary.detailActions.saveNotes}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
