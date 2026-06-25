"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { BeforeAfterPair } from "@/components/ui/before-after-pair";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  createTenantBeforeAfter,
  deleteTenantBeforeAfter,
  listTenantBeforeAfter,
  updateTenantBeforeAfter,
  uploadTenantBeforeAfterImage,
  type TenantBeforeAfterItem,
  type TenantBeforeAfterPayload,
} from "@/lib/api/tenant-before-after";
import type { PublicBeforeAfterCategory } from "@/lib/api/public-centers";
import { CenterAdminShell } from "../layout/CenterAdminShell";

const categories: PublicBeforeAfterCategory[] = ["LASER", "SKIN", "DENTAL", "HAIR", "OTHER"];

const copy = {
  en: {
    add: "Add case",
    afterImage: "After image",
    beforeImage: "Before image",
    cancel: "Cancel",
    category: "Category",
    delete: "Delete",
    descriptionAr: "Arabic description",
    descriptionEn: "English description",
    descriptionHe: "Hebrew description",
    dragHint: "Drag cards to reorder, or edit sort order manually.",
    edit: "Edit",
    emptyBody: "Add transformation cases to show real results on your center website.",
    emptyTitle: "No before/after cases yet",
    imageHint: "Recommended: 1200 × 1600 px · Portrait · Same size for both images · JPG / PNG / WebP · Keep subject centered for best slider result",
    livePreview: "Live preview",
    loadError: "Could not load before/after gallery. Please try again.",
    published: "Published",
    save: "Save case",
    saving: "Saving...",
    sortOrder: "Sort order",
    subtitle: "Manage real result cases for the public center website.",
    title: "Before / After",
    titleAr: "Arabic title",
    titleEn: "English title",
    titleHe: "Hebrew title",
    unpublished: "Hidden",
    upload: "Upload",
    uploadError: "Could not upload image. Check the file type and size.",
    uploading: "Uploading...",
    categories: {
      DENTAL: "Dental",
      HAIR: "Hair",
      LASER: "Laser",
      OTHER: "Other",
      SKIN: "Skin",
    },
  },
  ar: {
    add: "إضافة حالة",
    afterImage: "صورة بعد",
    beforeImage: "صورة قبل",
    cancel: "إلغاء",
    category: "التصنيف",
    delete: "حذف",
    descriptionAr: "الوصف بالعربية",
    descriptionEn: "الوصف بالإنجليزية",
    descriptionHe: "الوصف بالعبرية",
    dragHint: "اسحب البطاقات لتغيير الترتيب، أو عدّل ترتيب العرض يدوياً.",
    edit: "تعديل",
    emptyBody: "أضف حالات نتائج حقيقية لعرضها في موقع المركز العام.",
    emptyTitle: "لا توجد حالات قبل وبعد بعد",
    imageHint: "مقترح: ١٢٠٠ × ١٦٠٠ بكسل · عمودي · نفس الحجم للصورتين · JPG / PNG / WebP · أبقِ الموضوع في المنتصف لأفضل نتيجة للمنزلق",
    livePreview: "معاينة مباشرة",
    loadError: "تعذر تحميل معرض قبل وبعد. يرجى المحاولة مرة أخرى.",
    published: "منشور",
    save: "حفظ الحالة",
    saving: "جار الحفظ...",
    sortOrder: "ترتيب العرض",
    subtitle: "إدارة حالات النتائج الحقيقية المعروضة في موقع المركز.",
    title: "قبل وبعد",
    titleAr: "العنوان بالعربية",
    titleEn: "العنوان بالإنجليزية",
    titleHe: "العنوان بالعبرية",
    unpublished: "مخفي",
    upload: "رفع",
    uploadError: "تعذر رفع الصورة. تحقق من نوع الملف وحجمه.",
    uploading: "جار الرفع...",
    categories: {
      DENTAL: "أسنان",
      HAIR: "شعر",
      LASER: "ليزر",
      OTHER: "أخرى",
      SKIN: "بشرة",
    },
  },
  he: {
    add: "הוספת מקרה",
    afterImage: "תמונת אחרי",
    beforeImage: "תמונת לפני",
    cancel: "ביטול",
    category: "קטגוריה",
    delete: "מחיקה",
    descriptionAr: "תיאור בערבית",
    descriptionEn: "תיאור באנגלית",
    descriptionHe: "תיאור בעברית",
    dragHint: "גררו כרטיסים כדי לשנות סדר, או ערכו את סדר התצוגה ידנית.",
    edit: "עריכה",
    emptyBody: "הוסיפו מקרי תוצאה אמיתיים להצגה באתר הציבורי של המרכז.",
    emptyTitle: "אין עדיין מקרי לפני ואחרי",
    imageHint: "מומלץ: 1200 × 1600 פיקסלים · לאורך · אותו גודל לשתי התמונות · JPG / PNG / WebP · שמרו על מרכוז הנושא לתוצאה מיטבית",
    livePreview: "תצוגה מקדימה",
    loadError: "לא ניתן לטעון גלריית לפני ואחרי. נסו שוב.",
    published: "פורסם",
    save: "שמירת מקרה",
    saving: "שומר...",
    sortOrder: "סדר תצוגה",
    subtitle: "ניהול מקרי תוצאות אמיתיות באתר הציבורי של המרכז.",
    title: "לפני / אחרי",
    titleAr: "כותרת בערבית",
    titleEn: "כותרת באנגלית",
    titleHe: "כותרת בעברית",
    unpublished: "מוסתר",
    upload: "העלאה",
    uploadError: "לא ניתן להעלות תמונה. בדקו את סוג וגודל הקובץ.",
    uploading: "מעלה...",
    categories: {
      DENTAL: "שיניים",
      HAIR: "שיער",
      LASER: "לייזר",
      OTHER: "אחר",
      SKIN: "עור",
    },
  },
} as const;

type BeforeAfterCopy = (typeof copy)[keyof typeof copy];

const emptyForm: TenantBeforeAfterPayload = {
  afterImageUrl: "",
  beforeImageUrl: "",
  category: "LASER",
  descriptionAr: "",
  descriptionEn: "",
  descriptionHe: "",
  isPublished: true,
  sortOrder: 0,
  titleAr: "",
  titleEn: "",
  titleHe: "",
};

function localizedTitle(item: Pick<TenantBeforeAfterPayload, "titleAr" | "titleEn" | "titleHe">, locale: SupportedLocale) {
  if (locale === "ar") return item.titleAr || item.titleEn || item.titleHe || "";
  if (locale === "he") return item.titleHe || item.titleEn || item.titleAr || "";
  return item.titleEn || item.titleAr || item.titleHe || "";
}

function ImageField({
  label,
  onChange,
  t,
  value,
}: {
  label: string;
  onChange: (url: string) => void;
  t: BeforeAfterCopy;
  value?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadTenantBeforeAfterImage(file);
      onChange(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.uploadError);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
      <p className="text-sm font-black text-[#0B2D5C]">{label}</p>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        {value ? (
          <img alt="" className="h-full w-full object-cover" decoding="async" src={value} />
        ) : (
          <span className="px-4 text-center text-sm font-bold text-[#8A94A6]">
            {label}
          </span>
        )}
      </div>
      <p className="text-[11px] leading-5 text-[#8A94A6]">{t.imageHint}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className={buttonClassName("secondary", "sm")}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploading ? t.uploading : t.upload}
        </button>
        {value ? (
          <button className={buttonClassName("ghost", "sm")} onClick={() => onChange("")} type="button">
            {t.delete}
          </button>
        ) : null}
      </div>
      <input
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      <input
        className="min-h-10 rounded-xl border border-[#D8DEE8] px-3 text-xs font-semibold outline-none focus:border-[#0B2D5C]"
        dir="ltr"
        onChange={(event) => onChange(event.target.value)}
        placeholder="/uploads/before-after/..."
        value={value ?? ""}
      />
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

export function TenantBeforeAfterPage() {
  const { locale } = useLanguage();
  const activeLocale = locale as SupportedLocale;
  const t = copy[activeLocale] ?? copy.en;
  const [items, setItems] = useState<TenantBeforeAfterItem[]>([]);
  const [status, setStatus] = useState<"error" | "loading" | "ready">("loading");
  const [form, setForm] = useState<TenantBeforeAfterPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listTenantBeforeAfter()
      .then((res) => {
        if (!active) return;
        setItems(res.items ?? []);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
    [items],
  );

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: sortedItems.length });
    setError(null);
  }

  function editItem(item: TenantBeforeAfterItem) {
    setEditingId(item.id);
    setForm({
      afterImageUrl: item.afterImageUrl,
      beforeImageUrl: item.beforeImageUrl,
      category: item.category,
      descriptionAr: item.descriptionAr ?? "",
      descriptionEn: item.descriptionEn ?? "",
      descriptionHe: item.descriptionHe ?? "",
      isPublished: item.isPublished,
      sortOrder: item.sortOrder,
      titleAr: item.titleAr ?? "",
      titleEn: item.titleEn ?? "",
      titleHe: item.titleHe ?? "",
    });
    setError(null);
  }

  async function saveItem() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder),
      };
      const saved = editingId
        ? await updateTenantBeforeAfter(editingId, payload)
        : await createTenantBeforeAfter(payload);
      setItems((prev) => {
        const without = prev.filter((item) => item.id !== saved.id);
        return [...without, saved];
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadError);
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    await deleteTenantBeforeAfter(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  }

  async function togglePublished(item: TenantBeforeAfterItem) {
    const nextItem = { ...item, isPublished: !item.isPublished };
    setItems((prev) =>
      prev.map((current) => (current.id === item.id ? nextItem : current)),
    );
    try {
      const saved = await updateTenantBeforeAfter(item.id, {
        afterImageUrl: item.afterImageUrl,
        beforeImageUrl: item.beforeImageUrl,
        category: item.category,
        descriptionAr: item.descriptionAr,
        descriptionEn: item.descriptionEn,
        descriptionHe: item.descriptionHe,
        isPublished: nextItem.isPublished,
        sortOrder: item.sortOrder,
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        titleHe: item.titleHe,
      });
      setItems((prev) =>
        prev.map((current) => (current.id === item.id ? saved : current)),
      );
    } catch {
      setItems((prev) =>
        prev.map((current) => (current.id === item.id ? item : current)),
      );
    }
  }

  async function reorder(droppedOnId: string) {
    if (!draggingId || draggingId === droppedOnId) return;
    const fromIndex = sortedItems.findIndex((item) => item.id === draggingId);
    const toIndex = sortedItems.findIndex((item) => item.id === droppedOnId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...sortedItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const updated = next.map((item, index) => ({ ...item, sortOrder: index }));
    setItems(updated);
    await Promise.all(
      updated.map((item) =>
        updateTenantBeforeAfter(item.id, {
          afterImageUrl: item.afterImageUrl,
          beforeImageUrl: item.beforeImageUrl,
          category: item.category,
          descriptionAr: item.descriptionAr,
          descriptionEn: item.descriptionEn,
          descriptionHe: item.descriptionHe,
          isPublished: item.isPublished,
          sortOrder: item.sortOrder,
          titleAr: item.titleAr,
          titleEn: item.titleEn,
          titleHe: item.titleHe,
        }),
      ),
    );
  }

  return (
    <CenterAdminShell
      activeNav="beforeAfter"
      requiredPermission="settings:view"
      subtitle={() => t.subtitle}
      title={() => t.title}
    >
      {() => {
        if (status === "loading") {
          return <div className="h-48 animate-pulse rounded-2xl bg-[#E5E7EB]" />;
        }
        if (status === "error") {
          return <AdminState title={t.loadError} tone="error" />;
        }

        return (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <ImageField
                  label={t.beforeImage}
                  onChange={(url) => setForm((prev) => ({ ...prev, beforeImageUrl: url }))}
                  t={t}
                  value={form.beforeImageUrl}
                />
                <ImageField
                  label={t.afterImage}
                  onChange={(url) => setForm((prev) => ({ ...prev, afterImageUrl: url }))}
                  t={t}
                  value={form.afterImageUrl}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(["titleAr", "titleEn", "titleHe"] as const).map((key) => (
                  <label className="grid gap-1.5 text-sm font-bold text-[#0B2D5C]" key={key}>
                    {t[key]}
                    <input
                      className="min-h-11 rounded-xl border border-[#D8DEE8] px-3 text-sm font-semibold outline-none focus:border-[#0B2D5C]"
                      value={form[key] ?? ""}
                      onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                    />
                  </label>
                ))}
                <label className="grid gap-1.5 text-sm font-bold text-[#0B2D5C]">
                  {t.category}
                  <select
                    className="min-h-11 rounded-xl border border-[#D8DEE8] px-3 text-sm font-semibold outline-none focus:border-[#0B2D5C]"
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, category: event.target.value as PublicBeforeAfterCategory }))
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {t.categories[category]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {(["descriptionAr", "descriptionEn", "descriptionHe"] as const).map((key) => (
                <label className="grid gap-1.5 text-sm font-bold text-[#0B2D5C]" key={key}>
                  {t[key]}
                  <textarea
                    className="min-h-20 rounded-xl border border-[#D8DEE8] px-3 py-2 text-sm font-semibold outline-none focus:border-[#0B2D5C]"
                    value={form[key] ?? ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  />
                </label>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold text-[#0B2D5C]">
                  {t.sortOrder}
                  <input
                    className="min-h-11 rounded-xl border border-[#D8DEE8] px-3 text-sm font-semibold outline-none focus:border-[#0B2D5C]"
                    min={0}
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-[#0B2D5C]">
                  <input
                    checked={form.isPublished}
                    onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                    type="checkbox"
                  />
                  {t.published}
                </label>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <p className="mb-3 text-sm font-black text-[#0B2D5C]">{t.livePreview}</p>
                <BeforeAfterPair
                  afterImageUrl={form.afterImageUrl}
                  afterLabel={t.afterImage}
                  beforeImageUrl={form.beforeImageUrl}
                  beforeLabel={t.beforeImage}
                  enableLightbox
                  missingLabel={t.upload}
                  title={localizedTitle(form, activeLocale) || t.livePreview}
                />
              </div>
              {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button className={buttonClassName("primary")} disabled={saving} onClick={() => void saveItem()} type="button">
                  {saving ? t.saving : t.save}
                </button>
                {editingId ? (
                  <button className={buttonClassName("secondary")} onClick={resetForm} type="button">
                    {t.cancel}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-sm font-bold text-[#526176]">{t.dragHint}</p>
              {sortedItems.length === 0 ? (
                <AdminState body={t.emptyBody} title={t.emptyTitle} />
              ) : (
                sortedItems.map((item) => (
                  <article
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#C8A45D]"
                    draggable
                    key={item.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => setDraggingId(item.id)}
                    onDrop={() => void reorder(item.id)}
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1fr)]">
                      <BeforeAfterPair
                        afterImageUrl={item.afterImageUrl}
                        afterLabel={t.afterImage}
                        beforeImageUrl={item.beforeImageUrl}
                        beforeLabel={t.beforeImage}
                        enableLightbox
                        missingLabel={t.upload}
                        title={localizedTitle(item, activeLocale) || t.title}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-black text-[#0B2D5C]">
                            {localizedTitle(item, activeLocale) || t.title}
                          </h3>
                          <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5 text-xs font-bold text-[#526176]">
                            {t.categories[item.category]}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {item.isPublished ? t.published : t.unpublished}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#526176]">
                          {item.descriptionEn || item.descriptionAr || item.descriptionHe || "—"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button className={buttonClassName("secondary", "sm")} onClick={() => editItem(item)} type="button">
                            {t.edit}
                          </button>
                          <button className={buttonClassName("secondary", "sm")} onClick={() => void togglePublished(item)} type="button">
                            {item.isPublished ? t.unpublished : t.published}
                          </button>
                          <button className={buttonClassName("danger", "sm")} onClick={() => void removeItem(item.id)} type="button">
                            {t.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        );
      }}
    </CenterAdminShell>
  );
}
