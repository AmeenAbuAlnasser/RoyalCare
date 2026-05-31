"use client";

import { useEffect, useState } from "react";
import { AdminCard, AdminSectionHeader, AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  addTenantClosedDay,
  addTenantProviderLeave,
  deleteTenantClosedDay,
  deleteTenantProviderLeave,
  getTenantSchedule,
  updateTenantCenterHours,
  updateTenantProviderHours,
  type CenterScheduleHour,
  type DayOfWeek,
  type ProviderScheduleHour,
  type TenantScheduleResponse,
} from "@/lib/api/tenant-schedule";
import { CenterAdminShell } from "../layout/CenterAdminShell";

const days: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const dayLabels: Record<string, Record<DayOfWeek, string>> = {
  en: {
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
    SUNDAY: "Sunday",
  },
  ar: {
    MONDAY: "الاثنين",
    TUESDAY: "الثلاثاء",
    WEDNESDAY: "الأربعاء",
    THURSDAY: "الخميس",
    FRIDAY: "الجمعة",
    SATURDAY: "السبت",
    SUNDAY: "الأحد",
  },
  he: {
    MONDAY: "יום שני",
    TUESDAY: "יום שלישי",
    WEDNESDAY: "יום רביעי",
    THURSDAY: "יום חמישי",
    FRIDAY: "יום שישי",
    SATURDAY: "שבת",
    SUNDAY: "יום ראשון",
  },
};

function defaultProviderHours(): ProviderScheduleHour[] {
  return days.map((dayOfWeek) => ({
    dayOfWeek,
    endTime: "17:30",
    id: null,
    isAvailable: true,
    startTime: "09:00",
  }));
}

function isInvalidRange(startTime: string, endTime: string) {
  return endTime <= startTime;
}

export function TenantSchedulePage() {
  const { locale } = useLanguage();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [schedule, setSchedule] = useState<TenantScheduleResponse | null>(null);
  const [centerHours, setCenterHours] = useState<CenterScheduleHour[]>([]);
  const [providerHours, setProviderHours] = useState<ProviderScheduleHour[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [closedDate, setClosedDate] = useState("");
  const [closedReason, setClosedReason] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [message, setMessage] = useState("");

  const refresh = () =>
    getTenantSchedule()
      .then((response) => {
        setSchedule(response);
        setCenterHours(response.centerHours);
        setSelectedProviderId((current) => current || response.providers[0]?.id || "");
        setState("ready");
      })
      .catch(() => setState("error"));

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!schedule || !selectedProviderId) {
      queueMicrotask(() => {
        if (isMounted) setProviderHours(defaultProviderHours());
      });
      return () => { isMounted = false; };
    }
    const existing = schedule.providerHours.filter(
      (hour) => hour.providerId === selectedProviderId,
    );
    queueMicrotask(() => {
      if (!isMounted) return;
      setProviderHours(
        days.map(
          (day) =>
            existing.find((hour) => hour.dayOfWeek === day) ?? {
              dayOfWeek: day,
              endTime: "17:30",
              id: null,
              isAvailable: true,
              providerId: selectedProviderId,
              startTime: "09:00",
            },
        ),
      );
    });
    return () => { isMounted = false; };
  }, [schedule, selectedProviderId]);

  return (
    <CenterAdminShell
      activeNav="schedule"
      requiredPermission="settings:view"
      subtitle={(d) => d.schedule.subtitle}
      title={(d) => d.schedule.title}
    >
      {({ dictionary }) => {
        const t = dictionary.schedule;
        const labels = dayLabels[locale] ?? dayLabels.en;
        const centerInvalid = centerHours.some((row) => !row.isClosed && isInvalidRange(row.startTime, row.endTime));
        const providerInvalid = providerHours.some((row) => row.isAvailable && isInvalidRange(row.startTime, row.endTime));
        const selectedProvider = schedule?.providers.find((provider) => provider.id === selectedProviderId);
        const providerLeaves = schedule?.providerLeave.filter((leave) => leave.providerId === selectedProviderId) ?? [];

        const showSaved = () => {
          setMessage(t.saved);
          window.setTimeout(() => setMessage(""), 2500);
        };

        if (state === "loading") {
          return <AdminState className="mt-5" loading title={dictionary.dashboard.loading} />;
        }

        if (state === "error" || !schedule) {
          return <AdminState className="mt-5" title={t.loadError} tone="error" />;
        }

        return (
          <div className="mt-5 space-y-5">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              {t.helper}
            </p>
            {message ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                {message}
              </p>
            ) : null}

            <AdminCard className="p-4 sm:p-5">
              <AdminSectionHeader title={t.centerHours} />
              <WeeklyRows
                hours={centerHours}
                labels={labels}
                offLabel={t.closed}
                onChange={setCenterHours}
                onLabel={t.open}
                showClosed
                t={t}
              />
              {centerInvalid ? <p className="mt-3 text-sm font-semibold text-[#B42318]">{t.invalidRange}</p> : null}
              <button
                className={buttonClassName("primary", "md", "mt-4")}
                disabled={centerInvalid}
                onClick={() => updateTenantCenterHours(centerHours).then(() => refresh()).then(showSaved)}
                type="button"
              >
                {t.save}
              </button>
            </AdminCard>

            <AdminCard className="p-4 sm:p-5">
              <AdminSectionHeader title={t.closedDays} />
              <div className="mt-4 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                <input className="min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm" onChange={(e) => setClosedDate(e.target.value)} type="date" value={closedDate} />
                <input className="min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm" onChange={(e) => setClosedReason(e.target.value)} placeholder={t.reason} value={closedReason} />
                <button className={buttonClassName("primary", "md")} disabled={!closedDate} onClick={() => addTenantClosedDay({ date: closedDate, reason: closedReason }).then(() => { setClosedDate(""); setClosedReason(""); refresh(); showSaved(); })} type="button">{t.addClosedDay}</button>
              </div>
              <ItemList
                empty={t.noClosedDays}
                items={schedule.closedDays.map((day) => ({ id: day.id, label: day.date, sub: day.reason }))}
                onDelete={(id) => deleteTenantClosedDay(id).then(() => { refresh(); showSaved(); })}
                t={t}
              />
            </AdminCard>

            <AdminCard className="p-4 sm:p-5">
              <AdminSectionHeader title={t.providerHours} />
              {schedule.providers.length === 0 ? (
                <p className="mt-4 text-sm text-[#66758a]">{t.noProviders}</p>
              ) : (
                <>
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-[#24364f]">{t.providerSelect}</span>
                    <select className="mt-2 min-h-11 w-full rounded-md border border-[#D8DEE8] px-3 text-sm sm:max-w-md" onChange={(e) => setSelectedProviderId(e.target.value)} value={selectedProviderId}>
                      {schedule.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
                    </select>
                  </label>
                  <WeeklyRows
                    hours={providerHours}
                    labels={labels}
                    offLabel={t.closed}
                    onChange={setProviderHours}
                    onLabel={t.open}
                    t={t}
                  />
                  {providerInvalid ? <p className="mt-3 text-sm font-semibold text-[#B42318]">{t.invalidRange}</p> : null}
                  <button className={buttonClassName("primary", "md", "mt-4")} disabled={!selectedProvider || providerInvalid} onClick={() => updateTenantProviderHours(selectedProviderId, providerHours).then(() => refresh()).then(showSaved)} type="button">{t.save}</button>
                </>
              )}
            </AdminCard>

            <AdminCard className="p-4 sm:p-5">
              <AdminSectionHeader title={t.providerLeave} />
              {selectedProvider ? (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                    <input className="min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm" onChange={(e) => setLeaveDate(e.target.value)} type="date" value={leaveDate} />
                    <input className="min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm" onChange={(e) => setLeaveReason(e.target.value)} placeholder={t.reason} value={leaveReason} />
                    <button className={buttonClassName("primary", "md")} disabled={!leaveDate} onClick={() => addTenantProviderLeave(selectedProviderId, { date: leaveDate, reason: leaveReason }).then(() => { setLeaveDate(""); setLeaveReason(""); refresh(); showSaved(); })} type="button">{t.addLeave}</button>
                  </div>
                  <ItemList
                    empty={t.noLeave}
                    items={providerLeaves.map((leave) => ({ id: leave.id, label: leave.date, sub: leave.reason }))}
                    onDelete={(id) => deleteTenantProviderLeave(id).then(() => { refresh(); showSaved(); })}
                    t={t}
                  />
                </>
              ) : (
                <p className="mt-4 text-sm text-[#66758a]">{t.noProviders}</p>
              )}
            </AdminCard>
          </div>
        );
      }}
    </CenterAdminShell>
  );
}

function WeeklyRows({
  hours,
  labels,
  offLabel,
  onChange,
  onLabel,
  showClosed = false,
  t,
}: {
  hours: Array<CenterScheduleHour | ProviderScheduleHour>;
  labels: Record<DayOfWeek, string>;
  offLabel: string;
  onChange: (hours: never[]) => void;
  onLabel: string;
  showClosed?: boolean;
  t: { endTime: string; startTime: string };
}) {
  const update = (index: number, patch: Record<string, string | boolean>) => {
    onChange(hours.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)) as never[]);
  };

  return (
    <div className="mt-4 space-y-3">
      {hours.map((row, index) => {
        const isOff = showClosed
          ? (row as CenterScheduleHour).isClosed
          : !(row as ProviderScheduleHour).isAvailable;
        return (
          <div className="grid gap-3 rounded-lg border border-[#E5E7EB] p-3 sm:grid-cols-[140px_120px_1fr_1fr]" key={row.dayOfWeek}>
            <p className="text-sm font-bold text-[#0B2D5C]">{labels[row.dayOfWeek]}</p>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#24364f]">
              <input checked={!isOff} onChange={(e) => update(index, showClosed ? { isClosed: !e.target.checked } : { isAvailable: e.target.checked })} type="checkbox" />
              {isOff ? offLabel : onLabel}
            </label>
            <input aria-label={t.startTime} className="min-h-10 rounded-md border border-[#D8DEE8] px-3 text-sm" disabled={isOff} onChange={(e) => update(index, { startTime: e.target.value })} type="time" value={row.startTime} />
            <input aria-label={t.endTime} className="min-h-10 rounded-md border border-[#D8DEE8] px-3 text-sm" disabled={isOff} onChange={(e) => update(index, { endTime: e.target.value })} type="time" value={row.endTime} />
          </div>
        );
      })}
    </div>
  );
}

function ItemList({
  empty,
  items,
  onDelete,
  t,
}: {
  empty: string;
  items: Array<{ id: string; label: string; sub?: string | null }>;
  onDelete: (id: string) => void;
  t: { delete: string };
}) {
  if (items.length === 0) return <p className="mt-4 text-sm text-[#66758a]">{empty}</p>;
  return (
    <div className="mt-4 divide-y divide-[#E5E7EB] rounded-lg border border-[#E5E7EB]">
      {items.map((item) => (
        <div className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#0B2D5C]">{item.label}</p>
            {item.sub ? <p className="mt-1 text-sm text-[#66758a]">{item.sub}</p> : null}
          </div>
          <button className={buttonClassName("danger", "sm")} onClick={() => onDelete(item.id)} type="button">{t.delete}</button>
        </div>
      ))}
    </div>
  );
}
