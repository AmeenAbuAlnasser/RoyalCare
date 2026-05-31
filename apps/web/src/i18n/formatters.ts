import type { SupportedLocale } from "./locales";

type DateParts = {
  day: string;
  month: string;
  year: string;
  hour?: string;
  minute?: string;
};

function groupInteger(value: number) {
  const digits = Math.trunc(Math.abs(value)).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function trimDecimal(value: number, maximumFractionDigits = 1) {
  return value.toFixed(maximumFractionDigits).replace(/\.0+$/, "");
}

function parseIsoDate(value: string): DateParts | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(
      value,
    );

  if (!match) {
    return null;
  }

  return {
    year: match[1],
    month: match[2],
    day: match[3],
    hour: match[4],
    minute: match[5],
  };
}

export function formatNumber(value: number) {
  const sign = value < 0 ? "-" : "";
  const whole = groupInteger(value);
  const decimal = Math.abs(value) % 1;

  if (decimal === 0) {
    return `${sign}${whole}`;
  }

  return `${sign}${whole}.${trimDecimal(decimal).slice(2)}`;
}

export function formatSignedNumber(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}`;
}

export function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  const percentage = trimDecimal(Math.abs(value) * 100);

  return `${sign}${value < 0 ? "-" : ""}${percentage}%`;
}

export function formatCompactCurrency(value: number, locale: SupportedLocale) {
  const isCompact = Math.abs(value) >= 1000;
  const amount = isCompact ? Math.abs(value) / 1000 : Math.abs(value);
  const formattedAmount = trimDecimal(amount);
  const sign = value < 0 ? "-" : "";

  if (locale === "ar") {
    return isCompact
      ? `${sign}${formattedAmount} \u0623\u0644\u0641 US$`
      : `${sign}${formattedAmount} US$`;
  }

  if (locale === "he") {
    return isCompact
      ? `\u200EUS$ ${sign}${formattedAmount}K`
      : `\u200EUS$ ${sign}${formattedAmount}`;
  }

  return isCompact
    ? `US$ ${sign}${formattedAmount}K`
    : `US$ ${sign}${formattedAmount}`;
}

export function formatDate(
  value: Date | string | null | undefined,
  locale?: SupportedLocale,
) {
  void locale;

  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = String(value.getFullYear());
    const hour = String(value.getHours()).padStart(2, "0");
    const minute = String(value.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  const parts = parseIsoDate(value);

  if (!parts) {
    return value;
  }

  const date = `${parts.day}/${parts.month}/${parts.year}`;

  if (parts.hour && parts.minute) {
    return `${date} ${parts.hour}:${parts.minute}`;
  }

  return date;
}

export function formatDateTime(
  value: Date | string | null | undefined,
  locale?: SupportedLocale,
) {
  return formatDate(value, locale);
}

export function formatDateOnly(
  value: Date | string | null | undefined,
  locale?: SupportedLocale,
) {
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = String(value.getFullYear());

    return `${day}/${month}/${year}`;
  }

  if (typeof value === "string") {
    return formatDate(value.slice(0, 10), locale);
  }

  return formatDate(value, locale);
}
