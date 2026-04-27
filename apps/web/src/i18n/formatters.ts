import type { SupportedLocale } from "./locales";

type DateParts = {
  day: string;
  month: string;
  year: string;
};

const monthNames: Record<SupportedLocale, string[]> = {
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  ar: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
  he: [
    "ינו׳",
    "פבר׳",
    "מרץ",
    "אפר׳",
    "מאי",
    "יוני",
    "יולי",
    "אוג׳",
    "ספט׳",
    "אוק׳",
    "נוב׳",
    "דצמ׳",
  ],
};

function groupInteger(value: number) {
  const digits = Math.trunc(Math.abs(value)).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function trimDecimal(value: number, maximumFractionDigits = 1) {
  return value.toFixed(maximumFractionDigits).replace(/\.0+$/, "");
}

function parseIsoDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  return {
    day: match[3],
    month: match[2],
    year: match[1],
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
      ? `${sign}${formattedAmount} ألف US$`
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

export function formatDate(value: string, locale: SupportedLocale) {
  const parts = parseIsoDate(value);

  if (!parts) {
    return value;
  }

  const monthIndex = Number(parts.month) - 1;
  const month = monthNames[locale][monthIndex] ?? parts.month;
  const day = Number(parts.day).toString();

  if (locale === "en") {
    return `${month} ${day}, ${parts.year}`;
  }

  return `${day} ${month} ${parts.year}`;
}
