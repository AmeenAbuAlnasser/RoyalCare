"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { buttonClassName, primaryButtonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { uploadPublicImage, UploadFailedError } from "@/lib/api/system-settings";
import {
  createFeaturedService,
  deleteFeaturedService,
  getAdminFeaturedServices,
  updateFeaturedService,
  FeaturedServiceError,
  type FeaturedService,
  type FeaturedServiceInput,
} from "@/lib/api/featured-services";

type Locale = "en" | "ar" | "he";

const copy: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    confirmDelete: string;
    cancel: string;
    save: string;
    saving: string;
    titleArLabel: string;
    titleEnLabel: string;
    titleHeLabel: string;
    descArLabel: string;
    descEnLabel: string;
    descHeLabel: string;
    sortOrderLabel: string;
    activeLabel: string;
    imageLabel: string;
    uploadImage: string;
    uploading: string;
    clearImage: string;
    imageHelper: string;
    noImage: string;
    noServices: string;
    loading: string;
    saved: string;
    saveError: string;
    deleteError: string;
    active: string;
    inactive: string;
    descriptions: string;
    uploaded: string;
    imageHint: string;
  }
> = {
  en: {
    title: "Featured Services",
    subtitle: "Service categories shown on the public /centers page.",
    add: "Add Service",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this service?",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    titleArLabel: "Title (Arabic)",
    titleEnLabel: "Title (English)",
    titleHeLabel: "Title (Hebrew)",
    descArLabel: "Description (Arabic)",
    descEnLabel: "Description (English)",
    descHeLabel: "Description (Hebrew)",
    sortOrderLabel: "Sort order",
    activeLabel: "Active",
    imageLabel: "Image",
    uploadImage: "Upload image",
    uploading: "Uploading...",
    clearImage: "Clear",
    imageHelper: "You can upload up to 8MB. Images are optimized automatically.",
    noImage: "No image",
    noServices: "No featured services yet. Click “Add Service” to start.",
    loading: "Loading...",
    saved: "Saved.",
    saveError: "Could not save.",
    deleteError: "Could not delete.",
    active: "Active",
    inactive: "Inactive",
    descriptions: "Descriptions (optional)",
    uploaded: "Image uploaded.",
    imageHint: "Recommended: 900×500 px, clear landscape service image.",
  },
  ar: {
    title: "الخدمات المميزة",
    subtitle: "فئات الخدمات المعروضة في صفحة /centers العامة.",
    add: "إضافة خدمة",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "حذف هذه الخدمة؟",
    cancel: "إلغاء",
    save: "حفظ",
    saving: "جاري الحفظ...",
    titleArLabel: "العنوان (عربي)",
    titleEnLabel: "العنوان (إنجليزي)",
    titleHeLabel: "العنوان (عبري)",
    descArLabel: "الوصف (عربي)",
    descEnLabel: "الوصف (إنجليزي)",
    descHeLabel: "الوصف (عبري)",
    sortOrderLabel: "الترتيب",
    activeLabel: "نشط",
    imageLabel: "الصورة",
    uploadImage: "رفع صورة",
    uploading: "جاري الرفع...",
    clearImage: "مسح",
    imageHelper: "يمكنك رفع صورة حتى 8MB، وسيتم ضغطها تلقائيًا.",
    noImage: "لا توجد صورة",
    noServices: "لا توجد خدمات مميزة بعد. اضغط «إضافة خدمة» للبدء.",
    loading: "جاري التحميل...",
    saved: "تم الحفظ.",
    saveError: "تعذر الحفظ.",
    deleteError: "تعذر الحذف.",
    active: "نشط",
    inactive: "معطل",
    descriptions: "الأوصاف (اختياري)",
    uploaded: "تم رفع الصورة.",
    imageHint: "المقاس المفضل: 900×500 بكسل، صورة أفقية واضحة للخدمة.",
  },
  he: {
    title: "שירותים מומלצים",
    subtitle: "קטגוריות שירות המוצגות בדף /centers הציבורי.",
    add: "הוסף שירות",
    edit: "עריכה",
    delete: "מחיקה",
    confirmDelete: "למחוק שירות זה?",
    cancel: "ביטול",
    save: "שמור",
    saving: "שומר...",
    titleArLabel: "כותרת (ערבית)",
    titleEnLabel: "כותרת (אנגלית)",
    titleHeLabel: "כותרת (עברית)",
    descArLabel: "תיאור (ערבית)",
    descEnLabel: "תיאור (אנגלית)",
    descHeLabel: "תיאור (עברית)",
    sortOrderLabel: "סדר",
    activeLabel: "פעיל",
    imageLabel: "תמונה",
    uploadImage: "העלה תמונה",
    uploading: "מעלה...",
    clearImage: "נקה",
    imageHelper: "ניתן להעלות עד 8MB. התמונות יעובדו אוטומטית.",
    noImage: "אין תמונה",
    noServices: "אין שירותים מומלצים עדיין. לחצו «הוסף שירות» להתחיל.",
    loading: "טוען...",
    saved: "נשמר.",
    saveError: "לא ניתן לשמור.",
    deleteError: "לא ניתן למחוק.",
    active: "פעיל",
    inactive: "לא פעיל",
    descriptions: "תיאורים (אופציונלי)",
    uploaded: "התמונה הועלתה.",
    imageHint: "מומלץ: 900×500 פיקסל, תמונת שירות אופקית ברורה.",
  },
};

type FormState = {
  titleAr: string;
  titleEn: string;
  titleHe: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionHe: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  titleAr: "",
  titleEn: "",
  titleHe: "",
  descriptionAr: "",
  descriptionEn: "",
  descriptionHe: "",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
};

function serviceToForm(s: FeaturedService): FormState {
  return {
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    titleHe: s.titleHe,
    descriptionAr: s.descriptionAr,
    descriptionEn: s.descriptionEn,
    descriptionHe: s.descriptionHe,
    imageUrl: s.imageUrl ?? "",
    sortOrder: String(s.sortOrder),
    isActive: s.isActive,
  };
}

export function FeaturedServicesSection() {
  const { locale } = useLanguage();
  const c = copy[locale as Locale] ?? copy.en;

  const [services, setServices] = useState<FeaturedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showFeedback(ok: boolean, msg: string) {
    setFeedback({ ok, msg });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4000);
  }

  useEffect(() => {
    void getAdminFeaturedServices()
      .then(setServices)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function openAdd() {
    setEditingId("new");
    setForm(emptyForm);
    setFeedback(null);
    setFieldErrors({});
  }

  function openEdit(service: FeaturedService) {
    setEditingId(service.id);
    setForm(serviceToForm(service));
    setFeedback(null);
    setFieldErrors({});
  }

  function closeForm() {
    setEditingId(null);
    setConfirmDeleteId(null);
    setFieldErrors({});
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    const k = key as string;
    setFieldErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadPublicImage(file, "service");
      setField("imageUrl", result.url);
      showFeedback(true, c.uploaded);
    } catch (err) {
      const detail =
        err instanceof UploadFailedError && err.details
          ? `: ${err.details}`
          : "";
      showFeedback(false, c.saveError + detail);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    setFieldErrors({});
    setSaving(true);
    try {
      const input: FeaturedServiceInput = {
        titleAr: form.titleAr.trim(),
        titleEn: form.titleEn.trim(),
        titleHe: form.titleHe.trim(),
        descriptionAr: form.descriptionAr.trim(),
        descriptionEn: form.descriptionEn.trim(),
        descriptionHe: form.descriptionHe.trim(),
        imageUrl: form.imageUrl.trim() || null,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        isActive: form.isActive,
      };

      if (editingId === "new") {
        const created = await createFeaturedService(input);
        setServices((prev) =>
          [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder),
        );
      } else if (editingId) {
        const updated = await updateFeaturedService(editingId, input);
        setServices((prev) =>
          prev
            .map((s) => (s.id === editingId ? updated : s))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        );
      }
      showFeedback(true, c.saved);
      closeForm();
    } catch (err) {
      if (err instanceof FeaturedServiceError && err.errors) {
        setFieldErrors(err.errors);
      }
      showFeedback(false, c.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteFeaturedService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
      if (editingId === id) closeForm();
      showFeedback(true, c.saved);
    } catch {
      showFeedback(false, c.deleteError);
    }
  }

  async function toggleActive(service: FeaturedService) {
    try {
      const updated = await updateFeaturedService(service.id, {
        isActive: !service.isActive,
      });
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? updated : s)),
      );
    } catch {
      showFeedback(false, c.saveError);
    }
  }

  const isFormOpen = editingId !== null;

  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#0B2D5C]">{c.title}</h3>
          <p className="mt-0.5 text-xs text-[#66758a]">{c.subtitle}</p>
        </div>
        <button
          className={primaryButtonClassName("w-auto")}
          disabled={isFormOpen}
          onClick={openAdd}
          type="button"
        >
          {c.add}
        </button>
      </div>

      <div className="space-y-0 p-5">
        {feedback ? (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
              feedback.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.msg}
          </div>
        ) : null}

        {isFormOpen ? (
          <div className="mb-5 rounded-xl border border-[#C8A45D]/40 bg-[#FDFAF5] p-4">
            <p className="mb-4 text-sm font-bold text-[#0B2D5C]">
              {editingId === "new" ? c.add : c.edit}
            </p>

            <div className="mb-4 flex min-w-0 flex-wrap items-start gap-4">
              <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#C8A45D]/60 bg-white">
                {form.imageUrl ? (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={form.imageUrl}
                  />
                ) : (
                  <span className="px-2 text-center text-xs text-[#66758a]">
                    {c.noImage}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#24364f]">
                  {c.imageLabel}
                </p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-[#66758a]">
                  {c.imageHint}
                </p>
                <p className="text-xs leading-5 text-[#66758a]">{c.imageHelper}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    id="featured-service-image-input"
                    onChange={(e) => void handleImageUpload(e)}
                    ref={fileInputRef}
                    type="file"
                  />
                  <label
                    className={buttonClassName(
                      "secondary",
                      "sm",
                      uploadingImage
                        ? "pointer-events-none opacity-60 cursor-default"
                        : "cursor-pointer",
                    )}
                    htmlFor="featured-service-image-input"
                  >
                    {uploadingImage ? c.uploading : c.uploadImage}
                  </label>
                  {form.imageUrl ? (
                    <button
                      className={buttonClassName("secondary", "sm")}
                      onClick={() => setField("imageUrl", "")}
                      type="button"
                    >
                      {c.clearImage}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mb-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
              {(["titleAr", "titleEn", "titleHe"] as const).map((key) => (
                <div key={key} className="min-w-0">
                  <label className="block text-xs font-semibold text-[#24364f]">
                    {key === "titleAr"
                      ? c.titleArLabel
                      : key === "titleEn"
                        ? c.titleEnLabel
                        : c.titleHeLabel}
                  </label>
                  <input
                    className="mt-1 h-10 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/12"
                    dir={
                      key === "titleAr"
                        ? "rtl"
                        : key === "titleHe"
                          ? "rtl"
                          : "ltr"
                    }
                    onChange={(e) => setField(key, e.target.value)}
                    value={form[key]}
                  />
                </div>
              ))}
            </div>

            <details className="mb-3">
              <summary className="cursor-pointer text-xs font-bold text-[#0B2D5C]">
                {c.descriptions}
              </summary>
              <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                {(
                  [
                    "descriptionAr",
                    "descriptionEn",
                    "descriptionHe",
                  ] as const
                ).map((key) => (
                  <div key={key} className="min-w-0">
                    <label className="block text-xs font-semibold text-[#24364f]">
                      {key === "descriptionAr"
                        ? c.descArLabel
                        : key === "descriptionEn"
                          ? c.descEnLabel
                          : c.descHeLabel}
                    </label>
                    <textarea
                      className="mt-1 min-h-20 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/12"
                      dir={
                        key === "descriptionAr"
                          ? "rtl"
                          : key === "descriptionHe"
                            ? "rtl"
                            : "ltr"
                      }
                      onChange={(e) => setField(key, e.target.value)}
                      value={form[key]}
                    />
                  </div>
                ))}
              </div>
            </details>

            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-[#24364f]">
                  {c.sortOrderLabel}
                </label>
                <input
                  className="h-9 w-20 rounded-md border border-[#E5E7EB] bg-white px-2 text-center text-sm text-[#132238] outline-none focus:border-[#0B2D5C]"
                  min="0"
                  onChange={(e) => setField("sortOrder", e.target.value)}
                  type="number"
                  value={form.sortOrder}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  checked={form.isActive}
                  className="h-4 w-4 accent-[#0B2D5C]"
                  onChange={(e) => setField("isActive", e.target.checked)}
                  type="checkbox"
                />
                <span className="text-xs font-semibold text-[#24364f]">
                  {c.activeLabel}
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className={primaryButtonClassName("w-auto")}
                disabled={saving || uploadingImage}
                onClick={() => void handleSave()}
                type="button"
              >
                {saving ? c.saving : c.save}
              </button>
              <button
                className={buttonClassName("secondary", "md", "w-auto")}
                disabled={saving}
                onClick={closeForm}
                type="button"
              >
                {c.cancel}
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <p className="py-4 text-sm text-[#66758a]">{c.loading}</p>
        ) : services.length === 0 && !isFormOpen ? (
          <p className="py-4 text-sm text-[#66758a]">{c.noServices}</p>
        ) : (
          <div className="space-y-2">
            {services.map((service) => {
              const localTitle =
                locale === "ar"
                  ? service.titleAr || service.titleEn
                  : locale === "he"
                    ? service.titleHe || service.titleEn
                    : service.titleEn || service.titleAr;

              const isConfirmingDelete = confirmDeleteId === service.id;

              return (
                <div
                  className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3"
                  key={service.id}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
                    {service.imageUrl ? (
                      <img
                        alt={localTitle}
                        className="h-full w-full object-cover"
                        src={service.imageUrl}
                      />
                    ) : (
                      <span className="text-xs text-[#66758a]">&mdash;</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0B2D5C]">
                      {localTitle || "—"}
                    </p>
                    <p className="text-xs text-[#66758a]">#{service.sortOrder}</p>
                  </div>

                  <button
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                      service.isActive
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-[#E5E7EB] text-[#66758a] hover:bg-[#D0D5DD]"
                    }`}
                    onClick={() => void toggleActive(service)}
                    title={service.isActive ? c.active : c.inactive}
                    type="button"
                  >
                    {service.isActive ? c.active : c.inactive}
                  </button>

                  {!isConfirmingDelete ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        className={buttonClassName("secondary", "sm")}
                        disabled={isFormOpen && editingId !== service.id}
                        onClick={() => openEdit(service)}
                        type="button"
                      >
                        {c.edit}
                      </button>
                      <button
                        className={buttonClassName("warning", "sm")}
                        onClick={() => setConfirmDeleteId(service.id)}
                        type="button"
                      >
                        {c.delete}
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-bold text-rose-700">
                        {c.confirmDelete}
                      </span>
                      <button
                        className={buttonClassName("warning", "sm")}
                        onClick={() => void handleDelete(service.id)}
                        type="button"
                      >
                        {c.delete}
                      </button>
                      <button
                        className={buttonClassName("secondary", "sm")}
                        onClick={() => setConfirmDeleteId(null)}
                        type="button"
                      >
                        {c.cancel}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
