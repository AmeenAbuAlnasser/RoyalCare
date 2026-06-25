"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { formatTime12h } from "@/i18n/formatters";
import { localeDirections } from "@/i18n/locales";
import type { SupportedLocale } from "@/i18n/locales";
import type { AppointmentStatus, TenantAppointment } from "@/lib/api/tenant-appointments";
import {
  getAppointmentProviderName,
  getLocalizedAppointmentServiceName,
} from "./appointment-display";

const GRID_START_H = 7;
const GRID_END_H = 21;
const HOUR_PX = 72;
const TOTAL_PX = (GRID_END_H - GRID_START_H) * HOUR_PX;
const TOTAL_MINS = (GRID_END_H - GRID_START_H) * 60;

type CalendarMode = "day" | "week";

const STATUS_STYLES: Record<
  AppointmentStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  SCHEDULED:   { bg: "bg-slate-50",   border: "border-slate-300",   text: "text-slate-700",   dot: "bg-slate-400"   },
  CONFIRMED:   { bg: "bg-blue-50",    border: "border-blue-300",    text: "text-blue-800",    dot: "bg-blue-500"    },
  IN_PROGRESS: { bg: "bg-orange-50",  border: "border-orange-400",  text: "text-orange-800",  dot: "bg-orange-500"  },
  COMPLETED:   { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-800", dot: "bg-emerald-500" },
  CANCELLED:   { bg: "bg-gray-100",   border: "border-gray-300",    text: "text-gray-400",    dot: "bg-gray-400"    },
  NO_SHOW:     { bg: "bg-rose-50",    border: "border-rose-300",    text: "text-rose-700",    dot: "bg-rose-400"    },
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

type PlacedAppointment = TenantAppointment & { col: number; numCols: number };

function placeAppointments(items: TenantAppointment[]): PlacedAppointment[] {
  const sorted = [...items].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );
  const colEnds: number[] = [];
  const placed: PlacedAppointment[] = sorted.map((appt) => {
    const startMin = timeToMinutes(appt.startTime);
    const endMin = timeToMinutes(appt.endTime);
    let col = colEnds.findIndex((end) => end <= startMin);
    if (col === -1) col = colEnds.length;
    colEnds[col] = endMin;
    return { ...appt, col, numCols: 1 };
  });
  for (let i = 0; i < placed.length; i++) {
    const sI = timeToMinutes(placed[i].startTime);
    const eI = timeToMinutes(placed[i].endTime);
    let maxCol = placed[i].col;
    for (let j = 0; j < placed.length; j++) {
      if (i === j) continue;
      const sJ = timeToMinutes(placed[j].startTime);
      const eJ = timeToMinutes(placed[j].endTime);
      if (sJ < eI && eJ > sI) maxCol = Math.max(maxCol, placed[j].col);
    }
    placed[i].numCols = maxCol + 1;
  }
  return placed;
}

function getWeekDates(ref: Date): string[] {
  const d = new Date(ref);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

function getCurrentNowPct(): number | null {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes() - GRID_START_H * 60;
  if (mins < 0 || mins > TOTAL_MINS) return null;
  return (mins / TOTAL_MINS) * 100;
}

function DayColumn({
  dateStr,
  appointments,
  today,
  locale,
}: {
  dateStr: string;
  appointments: TenantAppointment[];
  today: string;
  locale: SupportedLocale;
}) {
  const placed = useMemo(() => placeAppointments(appointments), [appointments]);
  const nowPct = dateStr === today ? getCurrentNowPct() : null;

  return (
    <div className="relative" style={{ height: `${TOTAL_PX}px` }}>
      {Array.from({ length: GRID_END_H - GRID_START_H }, (_, i) => (
        <div
          key={i}
          className="pointer-events-none absolute inset-x-0 border-t border-[#E5E7EB]"
          style={{ top: `${(i / (GRID_END_H - GRID_START_H)) * 100}%` }}
        />
      ))}
      {Array.from({ length: GRID_END_H - GRID_START_H }, (_, i) => (
        <div
          key={`hh${i}`}
          className="pointer-events-none absolute inset-x-0 border-t border-[#F4F4F6]"
          style={{ top: `${((i + 0.5) / (GRID_END_H - GRID_START_H)) * 100}%` }}
        />
      ))}

      {nowPct !== null && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
          style={{ top: `${nowPct}%` }}
        >
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
          <div className="h-px flex-1 bg-red-500" />
        </div>
      )}

      {placed.map((appt) => {
        const st = STATUS_STYLES[appt.status] ?? STATUS_STYLES.SCHEDULED;
        const startMins = timeToMinutes(appt.startTime) - GRID_START_H * 60;
        const endMins = timeToMinutes(appt.endTime) - GRID_START_H * 60;
        const durationMins = Math.max(endMins - startMins, 30);
        const topPct = (startMins / TOTAL_MINS) * 100;
        const heightPct = (durationMins / TOTAL_MINS) * 100;
        const widthPct = 100 / appt.numCols;
        const offsetPct = appt.col * widthPct;
        const isCancelled = appt.status === "CANCELLED";
        const svcName = getLocalizedAppointmentServiceName(
          appt.service,
          locale,
          appt.offerTitle,
          appt.customServiceName,
        );
        const provName = getAppointmentProviderName(appt.staffUser);

        return (
          <Link
            key={appt.id}
            href={`/tenant/appointments/${appt.id}`}
            className={`absolute z-10 overflow-hidden rounded border px-1.5 py-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2D5C] ${st.bg} ${st.border} ${st.text}`}
            style={{
              top: `${topPct}%`,
              height: `calc(${heightPct}% - 2px)`,
              width: `calc(${widthPct}% - 3px)`,
              left: `calc(${offsetPct}% + 1px)`,
            }}
            title={`${appt.patient.fullName} · ${formatTime12h(appt.startTime)}–${formatTime12h(appt.endTime)}`}
          >
            <p
              className={`truncate text-[11px] font-bold leading-tight ${isCancelled ? "line-through opacity-60" : ""}`}
            >
              {appt.patient.fullName}
            </p>
            <p className="truncate text-[10px] leading-tight opacity-80">{svcName}</p>
            {provName ? (
              <p className="truncate text-[10px] leading-tight opacity-70">{provName}</p>
            ) : null}
            <p className="text-[10px] leading-tight opacity-60" dir="ltr">
              {formatTime12h(appt.startTime)}–{formatTime12h(appt.endTime)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

export function AppointmentCalendarView({
  appointments,
  dictionary,
  locale,
}: {
  appointments: TenantAppointment[];
  dictionary: CenterAdminDictionary;
  locale: SupportedLocale;
}) {
  const [mode, setMode] = useState<CalendarMode>("day");
  const [refDate, setRefDate] = useState(() => new Date());
  const isRtl = localeDirections[locale] === "rtl";
  const d = dictionary.appointments;

  const today = new Date().toISOString().slice(0, 10);
  const refDateStr = refDate.toISOString().slice(0, 10);
  const weekDates = useMemo(() => getWeekDates(refDate), [refDate]);
  const displayDates = mode === "day" ? [refDateStr] : weekDates;

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, TenantAppointment[]> = {};
    for (const appt of appointments) {
      const k = appt.appointmentDate.slice(0, 10);
      if (!map[k]) map[k] = [];
      map[k].push(appt);
    }
    return map;
  }, [appointments]);

  function goBy(days: number) {
    setRefDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  const step = mode === "day" ? 1 : 7;

  function formatDayHeader(dateStr: string): string {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString(
      locale === "ar" ? "ar-SA" : locale === "he" ? "he-IL" : "en-US",
      { weekday: "short", month: "short", day: "numeric" },
    );
  }

  const rangeLabel =
    mode === "day"
      ? formatDayHeader(refDateStr)
      : `${formatDayHeader(weekDates[0])} – ${formatDayHeader(weekDates[6])}`;

  return (
    <div className="mt-5">
      <div
        className="mb-4 flex flex-wrap items-center justify-between gap-3"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-[#D8DEE8] bg-white px-3 py-1.5 text-sm font-semibold text-[#24364f] hover:bg-[#F0F4FA]"
            onClick={() => setRefDate(new Date())}
            type="button"
          >
            {d.calendarToday}
          </button>
          <button
            aria-label={d.calendarPrev}
            className="rounded-md border border-[#D8DEE8] bg-white px-2.5 py-1.5 text-sm font-bold text-[#24364f] hover:bg-[#F0F4FA]"
            onClick={() => goBy(-step)}
            type="button"
          >
            ‹
          </button>
          <button
            aria-label={d.calendarNext}
            className="rounded-md border border-[#D8DEE8] bg-white px-2.5 py-1.5 text-sm font-bold text-[#24364f] hover:bg-[#F0F4FA]"
            onClick={() => goBy(step)}
            type="button"
          >
            ›
          </button>
          <span className="text-sm font-semibold text-[#24364f]">{rangeLabel}</span>
        </div>

        <div className="flex items-center rounded-md border border-[#D8DEE8] bg-white p-0.5">
          {(["day", "week"] as CalendarMode[]).map((m) => (
            <button
              key={m}
              className={`rounded px-3 py-1 text-sm font-semibold transition-colors ${
                mode === m
                  ? "bg-[#0B2D5C] text-white"
                  : "text-[#66758a] hover:bg-[#F0F4FA]"
              }`}
              onClick={() => setMode(m)}
              type="button"
            >
              {m === "day" ? d.dayView : d.weekView}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white">
        <div className={`flex ${mode === "week" ? "min-w-[640px]" : ""}`} dir="ltr">
          <div className="w-14 shrink-0 border-e border-[#E5E7EB]">
            <div className="h-10 border-b border-[#E5E7EB]" />
            <div className="relative" style={{ height: `${TOTAL_PX}px` }}>
              {Array.from({ length: GRID_END_H - GRID_START_H + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 text-center text-[10px] text-[#99A0AB]"
                  style={{
                    top: `${(i / (GRID_END_H - GRID_START_H)) * 100}%`,
                    transform: "translateY(-50%)",
                  }}
                >
                  {formatTime12h(`${GRID_START_H + i}:00`)}
                </div>
              ))}
            </div>
          </div>

          {displayDates.map((dateStr) => (
            <div
              key={dateStr}
              className="min-w-0 flex-1 border-e border-[#E5E7EB] last:border-e-0"
            >
              <div
                className={`flex h-10 items-center justify-center border-b border-[#E5E7EB] px-1 text-center text-xs font-semibold ${
                  dateStr === today ? "bg-[#0B2D5C] text-white" : "text-[#24364f]"
                }`}
              >
                {formatDayHeader(dateStr)}
              </div>
              <DayColumn
                appointments={appointmentsByDate[dateStr] ?? []}
                dateStr={dateStr}
                locale={locale}
                today={today}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3" dir={isRtl ? "rtl" : "ltr"}>
        {(
          Object.entries(STATUS_STYLES) as [
            AppointmentStatus,
            (typeof STATUS_STYLES)[AppointmentStatus],
          ][]
        ).map(([status, style]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${style.dot}`} />
            <span className="text-xs text-[#66758a]">
              {dictionary.appointmentStatuses[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
