"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  createTenantTeamMember,
  deleteTenantTeamMember,
  listTenantTeam,
  updateTenantTeamMember,
  uploadTenantTeamPhoto,
  type TenantTeamMember,
  type TenantTeamPayload,
} from "@/lib/api/tenant-team";
import { CenterAdminShell } from "../layout/CenterAdminShell";

// ─── Labels ───────────────────────────────────────────────────────────────────

const copy = {
  en: {
    add: "Add Member",
    bioEn: "Bio (EN)",
    bioAr: "Bio (AR)",
    bioHe: "Bio (HE)",
    cancel: "Cancel",
    confirmDelete: "Delete this team member? This cannot be undone.",
    delete: "Delete",
    deleting: "Deleting…",
    deleteSuccess: "Team member deleted.",
    editTitle: "Edit Team Member",
    emptyBody: "Add your first team member to display them on the center website.",
    emptyTitle: "No team members yet",
    imageHint: "Recommended: 800 × 800 px · Square · JPG / PNG / WebP · Clear face photo for best result",
    loading: "Loading team members…",
    loadError: "Could not load team members. Please try again.",
    nameEn: "Name (EN)",
    nameAr: "Name (AR)",
    nameHe: "Name (HE)",
    newTitle: "New Team Member",
    photo: "Photo",
    photoUpload: "Upload Photo",
    photoUploading: "Uploading…",
    publish: "Published",
    save: "Save",
    saving: "Saving…",
    saveError: "Could not save. Please try again.",
    sortOrder: "Sort Order",
    specialtyEn: "Specialty (EN)",
    specialtyAr: "Specialty (AR)",
    specialtyHe: "Specialty (HE)",
    subtitle: "Manage the team members displayed on the center website.",
    title: "Center Team",
    titleEn: "Title (EN)",
    titleAr: "Title (AR)",
    titleHe: "Title (HE)",
    years: "Years of Experience",
    viewOnWebsite: "View on Website",
    unpublishedBadge: "Draft",
    publishedBadge: "Published",
  },
  ar: {
    add: "إضافة عضو",
    bioEn: "السيرة (EN)",
    bioAr: "السيرة (AR)",
    bioHe: "السيرة (HE)",
    cancel: "إلغاء",
    confirmDelete: "هل تريد حذف هذا العضو؟ لا يمكن التراجع.",
    delete: "حذف",
    deleting: "جار الحذف…",
    deleteSuccess: "تم حذف العضو.",
    editTitle: "تعديل عضو الفريق",
    emptyBody: "أضف أول عضو في الفريق لعرضه على موقع المركز.",
    emptyTitle: "لا يوجد أعضاء في الفريق بعد",
    imageHint: "مقترح: ٨٠٠ × ٨٠٠ بكسل · مربع · JPG / PNG / WebP · صورة وجه واضحة لأفضل نتيجة",
    loading: "جار تحميل الفريق…",
    loadError: "تعذر تحميل الفريق. يرجى المحاولة مرة أخرى.",
    nameEn: "الاسم (EN)",
    nameAr: "الاسم (AR)",
    nameHe: "الاسم (HE)",
    newTitle: "عضو جديد",
    photo: "الصورة",
    photoUpload: "رفع صورة",
    photoUploading: "جار الرفع…",
    publish: "منشور",
    save: "حفظ",
    saving: "جار الحفظ…",
    saveError: "تعذر الحفظ. يرجى المحاولة مرة أخرى.",
    sortOrder: "الترتيب",
    specialtyEn: "التخصص (EN)",
    specialtyAr: "التخصص (AR)",
    specialtyHe: "التخصص (HE)",
    subtitle: "إدارة أعضاء الفريق المعروضين على موقع المركز.",
    title: "فريق المركز",
    titleEn: "اللقب (EN)",
    titleAr: "اللقب (AR)",
    titleHe: "اللقب (HE)",
    years: "سنوات الخبرة",
    viewOnWebsite: "عرض على الموقع",
    unpublishedBadge: "مسودة",
    publishedBadge: "منشور",
  },
  he: {
    add: "הוסף חבר",
    bioEn: "ביוגרפיה (EN)",
    bioAr: "ביוגרפיה (AR)",
    bioHe: "ביוגרפיה (HE)",
    cancel: "ביטול",
    confirmDelete: "למחוק את חבר הצוות הזה? לא ניתן לבטל.",
    delete: "מחק",
    deleting: "מוחק…",
    deleteSuccess: "חבר הצוות נמחק.",
    editTitle: "עריכת חבר צוות",
    emptyBody: "הוסיפו את חבר הצוות הראשון כדי להציגו באתר המרכז.",
    emptyTitle: "אין חברי צוות עדיין",
    imageHint: "מומלץ: 800 × 800 פיקסלים · ריבועי · JPG / PNG / WebP · תמונת פנים ברורה לתוצאה מיטבית",
    loading: "טוען חברי צוות…",
    loadError: "לא ניתן לטעון חברי צוות. נסה שוב.",
    nameEn: "שם (EN)",
    nameAr: "שם (AR)",
    nameHe: "שם (HE)",
    newTitle: "חבר צוות חדש",
    photo: "תמונה",
    photoUpload: "העלה תמונה",
    photoUploading: "מעלה…",
    publish: "פורסם",
    save: "שמור",
    saving: "שומר…",
    saveError: "לא ניתן לשמור. נסה שוב.",
    sortOrder: "סדר",
    specialtyEn: "התמחות (EN)",
    specialtyAr: "התמחות (AR)",
    specialtyHe: "התמחות (HE)",
    subtitle: "ניהול חברי הצוות המוצגים באתר המרכז.",
    title: "צוות המרכז",
    titleEn: "תואר (EN)",
    titleAr: "תואר (AR)",
    titleHe: "תואר (HE)",
    years: "שנות ניסיון",
    viewOnWebsite: "צפה באתר",
    unpublishedBadge: "טיוטה",
    publishedBadge: "פורסם",
  },
} as const;

type Locale = keyof typeof copy;

// ─── Empty payload ─────────────────────────────────────────────────────────────

function emptyPayload(): TenantTeamPayload {
  return {
    bioAr: null,
    bioEn: null,
    bioHe: null,
    isPublished: false,
    nameAr: null,
    nameEn: null,
    nameHe: null,
    photoUrl: null,
    sortOrder: 0,
    specialtyAr: null,
    specialtyEn: null,
    specialtyHe: null,
    titleAr: null,
    titleEn: null,
    titleHe: null,
    yearsExperience: null,
  };
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function TeamMemberForm({
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
  initial: TenantTeamPayload;
  isNew: boolean;
  locale: Locale;
  onCancel: () => void;
  onSaved: (item: TenantTeamMember) => void;
}) {
  const t = copy[locale];
  const [form, setForm] = useState<TenantTeamPayload>(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function field(key: keyof TenantTeamPayload, value: string | boolean | number | null) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const { url } = await uploadTenantTeamPhoto(file);
      field("photoUrl", url);
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
        ? await createTenantTeamMember(form)
        : await updateTenantTeamMember(editId ?? "", form);
      onSaved(saved);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.saveError);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "min-h-10 w-full rounded-md border border-[#D8DEE8] px-3 py-2 text-sm text-[#132238] focus:border-[#C8A45D] focus:outline-none";
  const textareaClass = `${inputClass} min-h-[80px] resize-y`;
  const labelClass = "block text-xs font-semibold text-[#66758a] mb-1";

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Photo */}
      <div>
        <p className={labelClass}>{t.photo}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {form.photoUrl ? (
            <img
              alt="preview"
              className="h-20 w-20 shrink-0 rounded-xl border border-[#E5E7EB] object-cover"
              src={form.photoUrl}
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[#D8DEE8] bg-[#F8FAFC] text-2xl text-[#C8A45D]">
              👤
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
          onChange={handlePhotoChange}
          ref={fileRef}
          type="file"
        />
      </div>

      {/* Names */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["nameEn", "nameAr", "nameHe"] as const).map((k) => (
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

      {/* Specialties */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["specialtyEn", "specialtyAr", "specialtyHe"] as const).map((k) => (
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

      {/* Bios */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["bioEn", "bioAr", "bioHe"] as const).map((k) => (
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

      {/* Years + Sort + Publish */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>{t.years}</label>
          <input
            className={inputClass}
            min={0}
            max={99}
            onChange={(e) => field("yearsExperience", e.target.value ? Number(e.target.value) : null)}
            type="number"
            value={form.yearsExperience ?? ""}
          />
        </div>
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
          href={`/c/${centerSlug}/team`}
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
  | { kind: "edit"; item: TenantTeamMember }
  | { kind: "closed" };

export function TenantTeamPage() {
  const { locale } = useLanguage();
  const safeLocale: Locale = locale === "ar" ? "ar" : locale === "he" ? "he" : "en";
  const t = copy[safeLocale];

  const [members, setMembers] = useState<TenantTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [panel, setPanel] = useState<Panel>({ kind: "closed" });
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    let mounted = true;
    listTenantTeam()
      .then((res) => {
        if (mounted) {
          setMembers(res.items);
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

  function onSaved(item: TenantTeamMember) {
    setMembers((curr) => {
      const idx = curr.findIndex((m) => m.id === item.id);
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
      await deleteTenantTeamMember(id);
      setMembers((curr) => curr.filter((m) => m.id !== id));
      setNotice(t.deleteSuccess);
      if (panel.kind === "edit" && panel.item.id === id) setPanel({ kind: "closed" });
    } finally {
      setDeletingId("");
    }
  }

  return (
    <CenterAdminShell
      activeNav="team"
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
                <TeamMemberForm
                  centerSlug={centerSlug}
                  editId={panel.kind === "edit" ? panel.item.id : undefined}
                  initial={
                    panel.kind === "edit"
                      ? {
                          bioAr: panel.item.bioAr,
                          bioEn: panel.item.bioEn,
                          bioHe: panel.item.bioHe,
                          isPublished: panel.item.isPublished,
                          nameAr: panel.item.nameAr,
                          nameEn: panel.item.nameEn,
                          nameHe: panel.item.nameHe,
                          photoUrl: panel.item.photoUrl,
                          sortOrder: panel.item.sortOrder,
                          specialtyAr: panel.item.specialtyAr,
                          specialtyEn: panel.item.specialtyEn,
                          specialtyHe: panel.item.specialtyHe,
                          titleAr: panel.item.titleAr,
                          titleEn: panel.item.titleEn,
                          titleHe: panel.item.titleHe,
                          yearsExperience: panel.item.yearsExperience,
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

            {/* Loading */}
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

            {!isLoading && !loadError && members.length === 0 ? (
              <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
                <h2 className="text-base font-semibold text-[#0B2D5C]">{t.emptyTitle}</h2>
                <p className="mt-2 text-sm text-[#66758a]">{t.emptyBody}</p>
              </section>
            ) : null}

            {/* Member cards */}
            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {members.map((item, index) => {
                const name = item.nameEn || item.nameAr || item.nameHe;
                const title =
                  safeLocale === "ar"
                    ? item.titleAr || item.titleEn || item.titleHe
                    : safeLocale === "he"
                    ? item.titleHe || item.titleEn || item.titleAr
                    : item.titleEn || item.titleAr || item.titleHe;

                return (
                  <article
                    className="flex min-w-0 flex-col rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                    key={`${item.id}-${index}`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {item.photoUrl ? (
                        <img
                          alt={name ?? ""}
                          className="h-14 w-14 shrink-0 rounded-xl border border-[#E5E7EB] object-cover"
                          src={item.photoUrl}
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FA] text-2xl">
                          👤
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-sm font-semibold text-[#0B2D5C]">
                          {name ?? "—"}
                        </h2>
                        {title ? (
                          <p className="mt-0.5 break-words text-xs text-[#66758a]">{title}</p>
                        ) : null}
                        <span
                          className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.isPublished
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-[#FFF7F7] text-[#B42318]"
                          }`}
                        >
                          {item.isPublished ? t.publishedBadge : t.unpublishedBadge}
                        </span>
                      </div>
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
