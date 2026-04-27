"use client";

import { useState, type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { SuperAdminActionMenu } from "@/features/super-admin/components/SuperAdminActionMenu";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import { superAdminNotificationsDictionaries } from "@/i18n/dictionaries/super-admin-notifications";
import { formatDate, formatNumber } from "@/i18n/formatters";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  notificationFilters,
  notificationRows,
  notificationStats,
  notificationTemplates,
} from "./notifications-data";

type Dictionary = (typeof superAdminNotificationsDictionaries)["en"];
type NotificationRow = (typeof notificationRows)[number];
type Priority = NotificationRow["priority"];
type Status = NotificationRow["status"];

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
  tone: "danger" | "gold" | "navy" | "neutral" | "success";
}) {
  const styles = {
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    gold: "border-[#C8A45D]/35 bg-[#C8A45D]/12 text-[#7A5C20]",
    navy: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[tone]}`}>
      {label}
    </span>
  );
}

function priorityTone(priority: Priority) {
  if (priority === "critical") return "danger";
  if (priority === "high") return "gold";
  return "neutral";
}

function statusTone(status: Status) {
  return status === "unread" ? "navy" : "neutral";
}

function DetailPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
      <p className="text-xs font-medium text-[#66758a]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">{value}</div>
    </div>
  );
}

function NotificationActions({
  dictionary,
  isOpen,
  notificationId,
  onClose,
  onToggle,
}: {
  dictionary: Dictionary;
  isOpen: boolean;
  notificationId: string;
  onClose: () => void;
  onToggle: () => void;
}) {
  return (
    <SuperAdminActionMenu
      isOpen={isOpen}
      items={[
        { icon: "view", label: dictionary.actions.view },
        { icon: "read", label: dictionary.actions.markAsRead },
        { icon: "archive", label: dictionary.actions.archive },
        { icon: "delete", label: dictionary.actions.delete, tone: "danger" },
      ]}
      onClose={onClose}
      onToggle={onToggle}
      triggerLabel={`${dictionary.table.actions} ${notificationId}`}
    />
  );
}

function NotificationTitle({
  dictionary,
  row,
}: {
  dictionary: Dictionary;
  row: NotificationRow;
}) {
  return (
    <div className="min-w-0">
      <p className="break-words font-semibold text-[#0B2D5C]">
        {dictionary.notifications[row.titleKey]}
      </p>
      <p className="mt-1 max-w-2xl break-words text-sm leading-6 text-[#66758a]">
        {dictionary.notifications[row.messageKey]}
      </p>
    </div>
  );
}

export function SuperAdminNotificationsPage() {
  const { locale } = useLanguage();
  const dictionary = superAdminNotificationsDictionaries[locale];
  const [openActions, setOpenActions] = useState<string | null>(null);

  return (
    <SuperAdminLayout activeNav="notifications" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-6">
        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {notificationStats.map((stat) => (
            <article
              className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
              key={stat.key}
            >
              <p className="text-sm font-medium text-[#66758a]">
                {dictionary.stats[stat.key]}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[#0B2D5C]">
                {formatNumber(stat.value)}
              </p>
            </article>
          ))}
        </section>

        <Section title={dictionary.sections.searchFilters}>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block min-w-0">
              <span className="text-sm font-medium text-[#24364f]">
                {dictionary.filters.searchLabel}
              </span>
              <input
                className="mt-2 h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                placeholder={dictionary.filters.searchPlaceholder}
                type="search"
              />
            </label>
            <div className="flex min-w-0 flex-wrap gap-2">
              <button className={buttonClassName("primary", "sm")} type="button">
                {dictionary.filters.all}
              </button>
              {notificationFilters.map((filter) => (
                <button className={buttonClassName("secondary", "sm")} key={filter} type="button">
                  {dictionary.filters[filter]}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title={dictionary.sections.notificationsList}>
          <div className="hidden max-w-full overflow-x-auto md:block">
            <table className="w-full min-w-[1180px] border-collapse text-sm">
              <thead className="bg-[#F8FAFC] text-[#66758a]">
                <tr>
                  {[
                    "notification",
                    "type",
                    "priority",
                    "relatedCenter",
                    "createdDate",
                    "status",
                    "actions",
                  ].map((column) => (
                    <th className="px-4 py-3 text-start font-medium" key={column}>
                      {dictionary.table[column as keyof typeof dictionary.table]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notificationRows.map((row) => (
                  <tr className="border-t border-[#E5E7EB]" key={row.id}>
                    <td className="max-w-[420px] px-4 py-4">
                      <NotificationTitle dictionary={dictionary} row={row} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {dictionary.types[row.type]}
                    </td>
                    <td className="px-4 py-4">
                      <Badge label={dictionary.priorities[row.priority]} tone={priorityTone(row.priority)} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {dictionary.centers[row.centerKey]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#526176]">
                      {formatDate(row.createdDate, locale)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge label={dictionary.statuses[row.status]} tone={statusTone(row.status)} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <NotificationActions
                        dictionary={dictionary}
                        isOpen={openActions === row.id}
                        notificationId={row.id}
                        onClose={() => setOpenActions(null)}
                        onToggle={() => setOpenActions((current) => (current === row.id ? null : row.id))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 md:hidden">
            <p className="text-sm leading-6 text-[#66758a]">{dictionary.values.mobileHint}</p>
            {notificationRows.map((row) => (
              <article
                className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                key={row.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <NotificationTitle dictionary={dictionary} row={row} />
                  <NotificationActions
                    dictionary={dictionary}
                    isOpen={openActions === row.id}
                    notificationId={row.id}
                    onClose={() => setOpenActions(null)}
                    onToggle={() => setOpenActions((current) => (current === row.id ? null : row.id))}
                  />
                </div>
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-3">
                  <DetailPair label={dictionary.table.type} value={dictionary.types[row.type]} />
                  <DetailPair label={dictionary.table.priority} value={<Badge label={dictionary.priorities[row.priority]} tone={priorityTone(row.priority)} />} />
                  <DetailPair label={dictionary.table.relatedCenter} value={dictionary.centers[row.centerKey]} />
                  <DetailPair label={dictionary.table.createdDate} value={formatDate(row.createdDate, locale)} />
                  <DetailPair label={dictionary.table.status} value={<Badge label={dictionary.statuses[row.status]} tone={statusTone(row.status)} />} />
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section title={dictionary.sections.templatesPreview}>
          <p className="mb-4 text-sm leading-6 text-[#66758a]">{dictionary.values.templatesHint}</p>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {notificationTemplates.map((template) => (
              <article
                className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-4"
                key={template}
              >
                <p className="break-words text-sm font-semibold text-[#0B2D5C]">
                  {dictionary.templates[template]}
                </p>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </SuperAdminLayout>
  );
}
