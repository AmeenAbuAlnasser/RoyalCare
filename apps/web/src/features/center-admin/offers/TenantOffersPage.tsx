"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  createTenantOffer,
  deleteTenantOffer,
  listTenantOffers,
  updateTenantOffer,
  uploadTenantOfferImage,
  type TenantOffer,
  type TenantOfferPayload,
} from "@/lib/api/tenant-offers";
import { CenterAdminShell } from "../layout/CenterAdminShell";

// ─── Labels ───────────────────────────────────────────────────────────────────

const copy = {
  en: {
    add: "Add Offer",
    badgeEn: "Badge (EN)",
    badgeAr: "Badge (AR)",
    badgeHe: "Badge (HE)",
    badgeHint: "Short label shown on the card, e.g. \"Limited Time\" or \"Hot Deal\"",
    cancel: "Cancel",
    confirmDelete: "Delete this offer? This cannot be undone.",
    currency: "Currency",
    delete: "Delete",
    deleting: "Deleting…",
    deleteSuccess: "Offer deleted.",
    descriptionEn: "Description (EN)",
    descriptionAr: "Description (AR)",
    descriptionHe: "Description (HE)",
    editTitle: "Edit Offer",
    emptyBody: "Add your first offer to display it on the center website.",
    emptyTitle: "No offers yet",
    endsAt: "Ends At",
    expired: "Expired",
    imageHint: "Recommended: 1200 × 628 px · Landscape · JPG / PNG / WebP",
    loading: "Loading offers…",
    loadError: "Could not load offers. Please try again.",
    newPrice: "New Price",
    newTitle: "New Offer",
    offerImage: "Offer Image",
    oldPrice: "Original Price",
    photoUpload: "Upload Image",
    photoUploading: "Uploading…",
    publish: "Published",
    save: "Save",
    saving: "Saving…",
    saveError: "Could not save. Please try again.",
    sortOrder: "Sort Order",
    startsAt: "Starts At",
    subtitle: "Manage offers and packages displayed on the center website.",
    title: "Offers & Packages",
    titleEn: "Title (EN)",
    titleAr: "Title (AR)",
    titleHe: "Title (HE)",
    unpublishedBadge: "Draft",
    publishedBadge: "Published",
    viewOnWebsite: "View on Website",
  },
  ar: {
    add: "إضافة عرض",
    badgeEn: "الشارة (EN)",
    badgeAr: "الشارة (AR)",
    badgeHe: "الشارة (HE)",
    badgeHint: "تسمية قصيرة تظهر على البطاقة، مثل \"عرض محدود\" أو \"أفضل صفقة\"",
    cancel: "إلغاء",
    confirmDelete: "هل تريد حذف هذا العرض؟ لا يمكن التراجع.",
    currency: "العملة",
    delete: "حذف",
    deleting: "جار الحذف…",
    deleteSuccess: "تم حذف العرض.",
    descriptionEn: "الوصف (EN)",
    descriptionAr: "الوصف (AR)",
    descriptionHe: "الوصف (HE)",
    editTitle: "تعديل العرض",
    emptyBody: "أضف أول عرض لعرضه على موقع المركز.",
    emptyTitle: "لا توجد عروض بعد",
    endsAt: "تاريخ الانتهاء",
    expired: "منتهي",
    imageHint: "مقترح: ١٢٠٠ × ٦٢٨ بكسل · أفقي · JPG / PNG / WebP",
    loading: "جار تحميل العروض…",
    loadError: "تعذر تحميل العروض. يرجى المحاولة مرة أخرى.",
    newPrice: "السعر الجديد",
    newTitle: "عرض جديد",
    offerImage: "صورة العرض",
    oldPrice: "السعر الأصلي",
    photoUpload: "رفع صورة",
    photoUploading: "جار الرفع…",
    publish: "منشور",
    save: "حفظ",
    saving: "جار الحفظ…",
    saveError: "تعذر الحفظ. يرجى المحاولة مرة أخرى.",
    sortOrder: "الترتيب",
    startsAt: "تاريخ البداية",
    subtitle: "إدارة العروض والباقات المعروضة على موقع المركز.",
    title: "العروض والباقات",
    titleEn: "العنوان (EN)",
    titleAr: "العنوان (AR)",
    titleHe: "العنوان (HE)",
    unpublishedBadge: "مسودة",
    publishedBadge: "منشور",
    viewOnWebsite: "عرض على الموقع",
  },
  he: {
    add: "הוסף מבצע",
    badgeEn: "תגית (EN)",
    badgeAr: "תגית (AR)",
    badgeHe: "תגית (HE)",
    badgeHint: "תווית קצרה שמוצגת בכרטיס, כגון \"הצעה מוגבלת\" או \"מבצע חם\"",
    cancel: "ביטול",
    confirmDelete: "למחוק את המבצע הזה? לא ניתן לבטל.",
    currency: "מטבע",
    delete: "מחק",
    deleting: "מוחק…",
    deleteSuccess: "המבצע נמחק.",
    descriptionEn: "תיאור (EN)",
    descriptionAr: "תיאור (AR)",
    descriptionHe: "תיאור (HE)",
    editTitle: "עריכת מבצע",
    emptyBody: "הוסיפו את המבצע הראשון כדי להציגו באתר המרכז.",
    emptyTitle: "אין מבצעים עדיין",
    endsAt: "תאריך סיום",
    expired: "פג תוקף",
    imageHint: "מומלץ: 1200 × 628 פיקסלים · לרוחב · JPG / PNG / WebP",
    loading: "טוען מבצעים…",
    loadError: "לא ניתן לטעון מבצעים. נסה שוב.",
    newPrice: "מחיר חדש",
    newTitle: "מבצע חדש",
    offerImage: "תמונת המבצע",
    oldPrice: "מחיר מקורי",
    photoUpload: "העלה תמונה",
    photoUploading: "מעלה…",
    publish: "פורסם",
    save: "שמור",
    saving: "שומר…",
    saveError: "לא ניתן לשמור. נסה שוב.",
    sortOrder: "סדר",
    startsAt: "תאריך התחלה",
    subtitle: "ניהול המבצעים והחבילות המוצגים באתר המרכז.",
    title: "מבצעים וחבילות",
    titleEn: "כותרת (EN)",
    titleAr: "כותרת (AR)",
    titleHe: "כותרת (HE)",
    unpublishedBadge: "טיוטה",
    publishedBadge: "פורסם",
    viewOnWebsite: "צפה באתר",
  },
} as const;

type Locale = keyof typeof copy;

function emptyPayload(): TenantOfferPayload {
  return {
    badgeAr: null,
    badgeEn: null,
    badgeHe: null,
    currency: "ILS",
    descriptionAr: null,
    descriptionEn: null,
    descriptionHe: null,
    endsAt: null,
    imageUrl: null,
    isPublished: false,
    newPrice: null,
    oldPrice: null,
    sortOrder: 0,
    startsAt: null,
    titleAr: null,
    titleEn: null,
    titleHe: null,
  };
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function fromDateInput(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function isExpired(endsAt: string | null): boolean {
  if (!endsAt) return false;
  return new Date(endsAt) < new Date();
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function OfferForm({
  centerSlug,
  editId,
  initial,
  isNew,
  locale,
  onCancel,
  onSaved,
}: {
  centerSlug: string;
  editId?: string;
  initial: TenantOfferPayload;
  isNew: boolean;
  locale: Locale;
  onCancel: () => void;
  onSaved: (item: TenantOffer) => void;
}) {
  const t = copy[locale];
  const [form, setForm] = useState<TenantOfferPayload>(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function field(key: keyof TenantOfferPayload, value: string | boolean | number | null) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const { url } = await uploadTenantOfferImage(file);
      field("imageUrl", url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t.saveError);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const saved = isNew
        ? await createTenantOffer(form)
        : await updateTenantOffer(editId ?? "", form);
      onSaved(saved);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.saveError);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238] focus:border-[#C8A45D] focus:outline-none";
  const textareaClass = `${inputClass} min-h-[72px] resize-y`;
  const labelClass = "block text-xs font-semibold text-[#66758a] mb-1";

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Image */}
      <div>
        <p className={labelClass}>{t.offerImage}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {form.imageUrl ? (
            <img
              alt="offer preview"
              className="h-24 w-40 shrink-0 rounded-xl border border-[#E5E7EB] object-cover"
              src={form.imageUrl}
            />
          ) : (
            <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[#D8DEE8] bg-[#F8FAFC] text-3xl text-[#C8A45D]">
              🎁
            </div>
          )}
          <div className="flex flex-col gap-1">
            <button
              className={buttonClassName("secondary", "sm")}
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              {uploading ? t.photoUploading : t.photoUpload}
            </button>
            <p className="text-[11px] leading-5 text-[#8A94A6]">{t.imageHint}</p>
            {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
          </div>
        </div>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageChange}
          ref={fileRef}
          type="file"
        />
      </div>

      {/* Titles */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["titleEn", "titleAr", "titleHe"] as const).map((k) => (
          <div key={k}>
            <label className={labelClass}>{t[k]}</label>
            <input
              className={inputClass}
              onChange={(e) => field(k, e.target.value || null)}
              type="text"
              value={form[k] ?? ""}
            />
          </div>
        ))}
      </div>

      {/* Descriptions */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["descriptionEn", "descriptionAr", "descriptionHe"] as const).map((k) => (
          <div key={k}>
            <label className={labelClass}>{t[k]}</label>
            <textarea
              className={textareaClass}
              onChange={(e) => field(k, e.target.value || null)}
              value={form[k] ?? ""}
            />
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["badgeEn", "badgeAr", "badgeHe"] as const).map((k) => (
          <div key={k}>
            <label className={labelClass}>{t[k]}</label>
            <input
              className={inputClass}
              maxLength={80}
              onChange={(e) => field(k, e.target.value || null)}
              type="text"
              value={form[k] ?? ""}
            />
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-5 text-[#8A94A6]">{t.badgeHint}</p>

      {/* Prices + Currency */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>{t.oldPrice}</label>
          <input
            className={inputClass}
            min={0}
            onChange={(e) => field("oldPrice", e.target.value || null)}
            placeholder="e.g. 350"
            step="0.01"
            type="number"
            value={form.oldPrice ?? ""}
          />
        </div>
        <div>
          <label className={labelClass}>{t.newPrice}</label>
          <input
            className={inputClass}
            min={0}
            onChange={(e) => field("newPrice", e.target.value || null)}
            placeholder="e.g. 250"
            step="0.01"
            type="number"
            value={form.newPrice ?? ""}
          />
        </div>
        <div>
          <label className={labelClass}>{t.currency}</label>
          <select
            className={inputClass}
            onChange={(e) => field("currency", e.target.value)}
            value={form.currency}
          >
            <option value="ILS">ILS ₪</option>
            <option value="USD">USD $</option>
            <option value="EUR">EUR €</option>
            <option value="JOD">JOD د.أ</option>
            <option value="SAR">SAR ر.س</option>
            <option value="AED">AED د.إ</option>
          </select>
        </div>
      </div>

      {/* Date range */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.startsAt}</label>
          <input
            className={inputClass}
            onChange={(e) => field("startsAt", fromDateInput(e.target.value))}
            type="date"
            value={toDateInputValue(form.startsAt)}
          />
        </div>
        <div>
          <label className={labelClass}>{t.endsAt}</label>
          <input
            className={inputClass}
            onChange={(e) => field("endsAt", fromDateInput(e.target.value))}
            type="date"
            value={toDateInputValue(form.endsAt)}
          />
        </div>
      </div>

      {/* Sort + Publish */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.sortOrder}</label>
          <input
            className={inputClass}
            min={0}
            onChange={(e) => field("sortOrder", Number(e.target.value) || 0)}
            type="number"
            value={form.sortOrder}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#132238]">
            <input
              checked={form.isPublished}
              className="h-4 w-4 accent-[#0B2D5C]"
              onChange={(e) => field("isPublished", e.target.checked)}
              type="checkbox"
            />
            {t.publish}
          </label>
        </div>
      </div>

      {saveError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          className={buttonClassName("primary", "md")}
          disabled={saving}
          type="submit"
        >
          {saving ? t.saving : t.save}
        </button>
        <button
          className={buttonClassName("secondary", "md")}
          onClick={onCancel}
          type="button"
        >
          {t.cancel}
        </button>
        <a
          className={buttonClassName("secondary", "md")}
          href={`/c/${centerSlug}/offers`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t.viewOnWebsite}
        </a>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Panel =
  | { kind: "new" }
  | { kind: "edit"; item: TenantOffer }
  | { kind: "closed" };

export function TenantOffersPage() {
  const { locale } = useLanguage();
  const safeLocale: Locale = locale === "ar" ? "ar" : locale === "he" ? "he" : "en";
  const t = copy[safeLocale];

  const [offers, setOffers] = useState<TenantOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [panel, setPanel] = useState<Panel>({ kind: "closed" });
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    let mounted = true;
    listTenantOffers()
      .then((res) => {
        if (mounted) {
          setOffers(res.items);
          setLoadError(false);
        }
      })
      .catch(() => { if (mounted) setLoadError(true); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  function onSaved(item: TenantOffer) {
    setOffers((curr) => {
      const idx = curr.findIndex((o) => o.id === item.id);
      if (idx >= 0) {
        const next = [...curr];
        next[idx] = item;
        return next;
      }
      return [...curr, item];
    });
    setPanel({ kind: "closed" });
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    setDeletingId(id);
    try {
      await deleteTenantOffer(id);
      setOffers((curr) => curr.filter((o) => o.id !== id));
      setNotice(t.deleteSuccess);
      if (panel.kind === "edit" && panel.item.id === id) setPanel({ kind: "closed" });
    } finally {
      setDeletingId("");
    }
  }

  return (
    <CenterAdminShell
      activeNav="offers"
      subtitle={() => t.subtitle}
      title={() => t.title}
    >
      {({ session }) => {
        const centerSlug = session.center.slug;

        return (
          <>
            {/* Top bar */}
            <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#66758a]">{t.subtitle}</p>
                {panel.kind === "closed" ? (
                  <button
                    className={buttonClassName("primary", "md")}
                    onClick={() => setPanel({ kind: "new" })}
                    type="button"
                  >
                    {t.add}
                  </button>
                ) : null}
              </div>
            </section>

            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {/* Form panel */}
            {panel.kind !== "closed" ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <h2 className="mb-4 text-base font-semibold text-[#0B2D5C]">
                  {panel.kind === "new" ? t.newTitle : t.editTitle}
                </h2>
                <OfferForm
                  centerSlug={centerSlug}
                  editId={panel.kind === "edit" ? panel.item.id : undefined}
                  initial={
                    panel.kind === "edit"
                      ? {
                          badgeAr: panel.item.badgeAr,
                          badgeEn: panel.item.badgeEn,
                          badgeHe: panel.item.badgeHe,
                          currency: panel.item.currency,
                          descriptionAr: panel.item.descriptionAr,
                          descriptionEn: panel.item.descriptionEn,
                          descriptionHe: panel.item.descriptionHe,
                          endsAt: panel.item.endsAt,
                          imageUrl: panel.item.imageUrl,
                          isPublished: panel.item.isPublished,
                          newPrice: panel.item.newPrice,
                          oldPrice: panel.item.oldPrice,
                          sortOrder: panel.item.sortOrder,
                          startsAt: panel.item.startsAt,
                          titleAr: panel.item.titleAr,
                          titleEn: panel.item.titleEn,
                          titleHe: panel.item.titleHe,
                        }
                      : emptyPayload()
                  }
                  isNew={panel.kind === "new"}
                  locale={safeLocale}
                  onCancel={() => setPanel({ kind: "closed" })}
                  onSaved={onSaved}
                />
              </section>
            ) : null}

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {t.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {t.loadError}
              </p>
            ) : null}

            {!isLoading && !loadError && offers.length === 0 ? (
              <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
                <h2 className="text-base font-semibold text-[#0B2D5C]">{t.emptyTitle}</h2>
                <p className="mt-2 text-sm text-[#66758a]">{t.emptyBody}</p>
              </section>
            ) : null}

            {/* Offer cards */}
            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {offers.map((item, index) => {
                const title =
                  safeLocale === "ar"
                    ? item.titleAr || item.titleEn || item.titleHe
                    : safeLocale === "he"
                    ? item.titleHe || item.titleEn || item.titleAr
                    : item.titleEn || item.titleAr || item.titleHe;
                const badge =
                  safeLocale === "ar"
                    ? item.badgeAr || item.badgeEn || item.badgeHe
                    : safeLocale === "he"
                    ? item.badgeHe || item.badgeEn || item.badgeAr
                    : item.badgeEn || item.badgeAr || item.badgeHe;
                const expired = isExpired(item.endsAt);

                return (
                  <article
                    className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                    key={`${item.id}-${index}`}
                  >
                    {item.imageUrl ? (
                      <img
                        alt={title ?? "offer"}
                        className="h-32 w-full object-cover"
                        src={item.imageUrl}
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-[#F8FAFC] text-4xl">
                        🎁
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-start gap-2">
                        <h2 className="min-w-0 flex-1 break-words text-sm font-semibold text-[#0B2D5C]">
                          {title ?? "—"}
                        </h2>
                        <div className="flex shrink-0 flex-wrap gap-1.5">
                          {badge ? (
                            <span className="rounded-full bg-[#C8A45D]/15 px-2.5 py-0.5 text-xs font-bold text-[#C8A45D]">
                              {badge}
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              expired
                                ? "bg-amber-50 text-amber-700"
                                : item.isPublished
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-[#FFF7F7] text-[#B42318]"
                            }`}
                          >
                            {expired ? t.expired : item.isPublished ? t.publishedBadge : t.unpublishedBadge}
                          </span>
                        </div>
                      </div>
                      {(item.newPrice || item.oldPrice) ? (
                        <div className="mt-2 flex items-baseline gap-2">
                          {item.newPrice ? (
                            <span className="text-base font-black text-[#0B2D5C]">
                              {item.newPrice} {item.currency}
                            </span>
                          ) : null}
                          {item.oldPrice ? (
                            <span className="text-sm text-[#8A94A6] line-through">
                              {item.oldPrice} {item.currency}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {item.endsAt ? (
                        <p className="mt-1.5 text-xs text-[#66758a]">
                          {t.endsAt}: {new Date(item.endsAt).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-[#F0F4F8] px-4 py-3">
                      <button
                        className={buttonClassName("secondary", "sm")}
                        onClick={() => setPanel({ kind: "edit", item })}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className={buttonClassName("warning", "sm")}
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                        type="button"
                      >
                        {deletingId === item.id ? t.deleting : t.delete}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        );
      }}
    </CenterAdminShell>
  );
}
