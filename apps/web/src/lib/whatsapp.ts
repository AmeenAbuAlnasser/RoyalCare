export const WHATSAPP_CODE_STORAGE_KEY = "royalcare.whatsappDefaultCode";
export const WHATSAPP_SUPPORT_PHONE_STORAGE_KEY = "royalcare.whatsappSupportPhone";

export function normalizeForWhatsApp(phone: string, defaultCode = "970"): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return digits;
  if (digits.startsWith("970") || digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return defaultCode + digits.slice(1);
  return defaultCode + digits;
}

/**
 * Strips country prefix (970 / 972) and any leading zero to return the
 * local part of the number. Used to build both +970 and +972 candidates.
 *
 * Examples:
 *   "0592319640"    → "592319640"
 *   "+970592319640" → "592319640"
 *   "972592319640"  → "592319640"
 */
export function extractLocalNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("970")) return digits.slice(3);
  if (digits.startsWith("972")) return digits.slice(3);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function readWhatsAppDefaultCode(): string {
  if (typeof window === "undefined") return "970";
  return window.localStorage.getItem(WHATSAPP_CODE_STORAGE_KEY) ?? "970";
}

export function writeWhatsAppDefaultCode(code: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WHATSAPP_CODE_STORAGE_KEY, code);
  }
}

export function readWhatsAppSupportPhone(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(WHATSAPP_SUPPORT_PHONE_STORAGE_KEY) ?? "";
}

export function writeWhatsAppSupportPhone(phone: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WHATSAPP_SUPPORT_PHONE_STORAGE_KEY, phone);
  }
}

export type ResolveWhatsAppPhoneInput = {
  notificationPhone?: string | null;
  centerPhone?: string | null;
  metadataPhone?: string | null;
};

/**
 * Resolves the best available WhatsApp phone number using a fixed priority chain:
 * 1. subscription notificationPhone
 * 2. center owner phone
 * 3. notification metadata phone
 * 4. system whatsapp_support_phone (localStorage fallback)
 *
 * Returns null if none of the candidates yields a valid local number (7–10 digits).
 */
export function resolveWhatsAppPhone(input: ResolveWhatsAppPhoneInput): string | null {
  const candidates: Array<string | null | undefined> = [
    input.notificationPhone,
    input.centerPhone,
    input.metadataPhone,
    readWhatsAppSupportPhone(),
  ];

  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const local = extractLocalNumber(trimmed);
    if (local.length >= 7 && local.length <= 10) return trimmed;
  }

  return null;
}

export function buildSupportWhatsAppUrl(message: string): string | null {
  const code = readWhatsAppDefaultCode();
  const phone = readWhatsAppSupportPhone();
  if (!phone) return null;
  const normalized = normalizeForWhatsApp(phone, code);
  if (!/^\d{7,15}$/.test(normalized)) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
