"use client";

import { useMemo, useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";

type DateFieldLabels = {
  day: string;
  month: string;
  year: string;
};

function parseDateValue(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");

  return { day, month, year };
}

function formatDateValue(value: string, locale: SupportedLocale) {
  if (!value) {
    return "";
  }

  const { day, month, year } = parseDateValue(value);

  if (!day || !month || !year) {
    return value;
  }

  if (locale === "en") {
    return `${year}-${month}-${day}`;
  }

  return `${day}/${month}/${year}`;
}

function padDatePart(value: string) {
  return value.padStart(2, "0");
}

export function DateField({
  defaultValue = "",
  helperText,
  label,
  labels,
  locale,
  onChange,
  placeholder,
  value: controlledValue,
}: {
  defaultValue?: string;
  helperText: string;
  label: string;
  labels: DateFieldLabels;
  locale: SupportedLocale;
  onChange?: (value: string) => void;
  placeholder: string;
  value?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;
  const parsedValue = parseDateValue(value);
  const [draftDay, setDraftDay] = useState(parsedValue.day);
  const [draftMonth, setDraftMonth] = useState(parsedValue.month);
  const [draftYear, setDraftYear] = useState(parsedValue.year);
  const isRtl = locale === "ar" || locale === "he";

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, index) => String(currentYear + index));
  }, []);

  const days = useMemo(
    () => Array.from({ length: 31 }, (_, index) => padDatePart(String(index + 1))),
    [],
  );

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, index) => padDatePart(String(index + 1))),
    [],
  );

  function updateDate(day: string, month: string, year: string) {
    setDraftDay(day);
    setDraftMonth(month);
    setDraftYear(year);

    if (day && month && year) {
      const nextValue = `${year}-${month}-${day}`;
      setUncontrolledValue(nextValue);
      onChange?.(nextValue);
    }
  }

  return (
    <div className="relative block min-w-0">
      <span className="text-sm font-medium text-[#24364f]">{label}</span>
      <button
        className={`mt-2 flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12 ${
          isRtl ? "text-right" : "text-left"
        }`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={value ? "font-medium" : "text-[#66758a]"}>
          {value ? formatDateValue(value, locale) : placeholder}
        </span>
        <span aria-hidden="true" className="text-[#0B2D5C]">
          ▾
        </span>
      </button>
      <input name={label} type="hidden" value={value} />
      <span className="mt-1 block text-xs leading-5 text-[#66758a]">
        {helperText}
      </span>

      {isOpen ? (
        <div className="absolute z-20 mt-2 w-full min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_18px_45px_rgba(11,45,92,0.14)]">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="min-w-0">
              <span className="text-xs font-semibold text-[#66758a]">
                {labels.day}
              </span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#132238] outline-none focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                onChange={(event) =>
                  updateDate(event.target.value, draftMonth, draftYear)
                }
                value={draftDay}
              >
                <option value="">{labels.day}</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <span className="text-xs font-semibold text-[#66758a]">
                {labels.month}
              </span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#132238] outline-none focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                onChange={(event) =>
                  updateDate(draftDay, event.target.value, draftYear)
                }
                value={draftMonth}
              >
                <option value="">{labels.month}</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <span className="text-xs font-semibold text-[#66758a]">
                {labels.year}
              </span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#132238] outline-none focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                onChange={(event) =>
                  updateDate(draftDay, draftMonth, event.target.value)
                }
                value={draftYear}
              >
                <option value="">{labels.year}</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
