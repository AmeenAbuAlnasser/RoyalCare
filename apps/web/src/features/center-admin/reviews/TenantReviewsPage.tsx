"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import {
  createTenantReview,
  deleteTenantReview,
  listTenantReviews,
  updateTenantReview,
  type TenantCenterReview,
  type TenantReviewPayload,
} from "@/lib/api/tenant-reviews";
import { CenterAdminShell } from "../layout/CenterAdminShell";

const copy = {
  en: {
    add: "Add review",
    cancel: "Cancel",
    commentAr: "Arabic comment",
    commentEn: "English comment",
    commentHe: "Hebrew comment",
    customerName: "Customer name",
    delete: "Delete",
    edit: "Edit",
    emptyBody: "Add testimonials to show social proof on your public center website.",
    emptyTitle: "No reviews yet",
    loadError: "Could not load reviews. Please try again.",
    published: "Published",
    rating: "Rating",
    save: "Save review",
    saving: "Saving...",
    sortOrder: "Sort order",
    subtitle: "Manage testimonials shown on your public center website.",
    title: "Reviews",
    unpublished: "Hidden",
  },
  ar: {
    add: "إضافة تقييم",
    cancel: "إلغاء",
    commentAr: "التعليق بالعربية",
    commentEn: "التعليق بالإنجليزية",
    commentHe: "التعليق بالعبرية",
    customerName: "اسم العميل",
    delete: "حذف",
    edit: "تعديل",
    emptyBody: "أضف تقييمات لعرضها في موقع المركز العام.",
    emptyTitle: "لا توجد تقييمات بعد",
    loadError: "تعذر تحميل التقييمات. يرجى المحاولة مرة أخرى.",
    published: "منشور",
    rating: "التقييم",
    save: "حفظ التقييم",
    saving: "جار الحفظ...",
    sortOrder: "ترتيب العرض",
    subtitle: "إدارة التقييمات المعروضة في موقع المركز العام.",
    title: "التقييمات",
    unpublished: "مخفي",
  },
  he: {
    add: "הוספת ביקורת",
    cancel: "ביטול",
    commentAr: "תגובה בערבית",
    commentEn: "תגובה באנגלית",
    commentHe: "תגובה בעברית",
    customerName: "שם הלקוח",
    delete: "מחיקה",
    edit: "עריכה",
    emptyBody: "הוסיפו המלצות שיוצגו באתר הציבורי של המרכז.",
    emptyTitle: "אין עדיין ביקורות",
    loadError: "לא ניתן לטעון ביקורות. נסו שוב.",
    published: "פורסם",
    rating: "דירוג",
    save: "שמירת ביקורת",
    saving: "שומר...",
    sortOrder: "סדר תצוגה",
    subtitle: "ניהול המלצות שמוצגות באתר הציבורי של המרכז.",
    title: "ביקורות",
    unpublished: "מוסתר",
  },
} as const;

const emptyForm: TenantReviewPayload = {
  commentAr: "",
  commentEn: "",
  commentHe: "",
  customerName: "",
  isPublished: true,
  rating: 5,
  sortOrder: 0,
};

function stars(rating: number) {
  return "★".repeat(Math.max(0, Math.min(5, rating))).padEnd(5, "☆");
}

export function TenantReviewsPage() {
  const { locale } = useLanguage();
  const t = copy[locale as SupportedLocale] ?? copy.en;
  const [items, setItems] = useState<TenantCenterReview[]>([]);
  const [status, setStatus] = useState<"error" | "loading" | "ready">("loading");
  const [form, setForm] = useState<TenantReviewPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listTenantReviews()
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
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function editItem(item: TenantCenterReview) {
    setEditingId(item.id);
    setForm({
      commentAr: item.commentAr ?? "",
      commentEn: item.commentEn ?? "",
      commentHe: item.commentHe ?? "",
      customerName: item.customerName,
      isPublished: item.isPublished,
      rating: item.rating,
      sortOrder: item.sortOrder,
    });
    setError(null);
  }

  async function saveReview() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        rating: Number(form.rating),
        sortOrder: Number(form.sortOrder),
      };
      const saved = editingId
        ? await updateTenantReview(editingId, payload)
        : await createTenantReview(payload);
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

  async function removeReview(id: string) {
    await deleteTenantReview(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <CenterAdminShell
      activeNav="reviews"
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
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-bold text-[#0B2D5C]">
                  {t.customerName}
                  <input
                    className="min-h-11 rounded-xl border border-[#D8DEE8] px-3 text-sm font-semibold outline-none focus:border-[#0B2D5C]"
                    value={form.customerName}
                    onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-bold text-[#0B2D5C]">
                    {t.rating}
                    <select
                      className="min-h-11 rounded-xl border border-[#D8DEE8] px-3 text-sm font-semibold outline-none focus:border-[#0B2D5C]"
                      value={form.rating}
                      onChange={(e) => setForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>{stars(value)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-[#0B2D5C]">
                    {t.sortOrder}
                    <input
                      className="min-h-11 rounded-xl border border-[#D8DEE8] px-3 text-sm font-semibold outline-none focus:border-[#0B2D5C]"
                      min={0}
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                    />
                  </label>
                </div>
                {(["commentAr", "commentEn", "commentHe"] as const).map((key) => (
                  <label className="grid gap-1.5 text-sm font-bold text-[#0B2D5C]" key={key}>
                    {t[key]}
                    <textarea
                      className="min-h-24 rounded-xl border border-[#D8DEE8] px-3 py-2 text-sm font-semibold outline-none focus:border-[#0B2D5C]"
                      value={form[key] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </label>
                ))}
                <label className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-[#0B2D5C]">
                  <input
                    checked={form.isPublished}
                    onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                    type="checkbox"
                  />
                  {t.published}
                </label>
                {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    className={buttonClassName("primary")}
                    disabled={saving}
                    onClick={() => void saveReview()}
                    type="button"
                  >
                    {saving ? t.saving : t.save}
                  </button>
                  {editingId ? (
                    <button
                      className={buttonClassName("secondary")}
                      onClick={resetForm}
                      type="button"
                    >
                      {t.cancel}
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              {sortedItems.length === 0 ? (
                <AdminState body={t.emptyBody} title={t.emptyTitle} />
              ) : (
                sortedItems.map((item) => (
                  <article
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
                    key={item.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-black text-[#0B2D5C]">{item.customerName}</h3>
                          <span className="text-sm text-[#C8A45D]">{stars(item.rating)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {item.isPublished ? t.published : t.unpublished}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#526176]">
                          {item.commentEn || item.commentAr || item.commentHe || "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button className={buttonClassName("secondary", "sm")} onClick={() => editItem(item)} type="button">
                          {t.edit}
                        </button>
                        <button className={buttonClassName("danger", "sm")} onClick={() => void removeReview(item.id)} type="button">
                          {t.delete}
                        </button>
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
