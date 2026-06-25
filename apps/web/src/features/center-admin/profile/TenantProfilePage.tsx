"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  changeCenterPassword,
  getCenterAccountProfile,
  logoutCenterUser,
  updateCenterAccountProfile,
  type CenterAccountProfile,
  type CenterAccountProfilePayload,
} from "@/lib/api/center-auth";
import { uploadTenantCenterPublicImage } from "@/lib/api/center-public-profile";
import { ApiRequestError } from "@/lib/api/super-admin-centers";
import { UploadFailedError } from "@/lib/api/system-settings";
import { useRouter } from "next/navigation";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  getPermissionGroups,
  permKeyToDictKey,
} from "./role-permissions";
import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";

type FormState = {
  avatarUrl: string;
  email: string;
  fullName: string;
  phone: string;
  preferredLanguage: "AR" | "EN" | "HE";
  whatsappPhone: string;
};

const emptyForm: FormState = {
  avatarUrl: "",
  email: "",
  fullName: "",
  phone: "",
  preferredLanguage: "AR",
  whatsappPhone: "",
};

const copy = {
  en: {
    account: "Center Account Profile",
    accountHint: "Operational identity for the center owner and admin account.",
    avatar: "Center avatar",
    avatarHint: "Used in the admin shell and operational identity. Website branding is managed separately.",
    contact: "Primary Center Contact",
    contactHint: "This information is used by the system for bookings, follow-ups, notifications, and website fallback communication.",
    duplicate: "Email or phone is already used by another account.",
    email: "Main email",
    fullName: "Full name",
    invalidEmail: "Enter a valid email.",
    invalidPhone: "Enter a valid phone number.",
    language: "Preferred language",
    loading: "Loading profile...",
    loadError: "Could not load profile. Please try again.",
    mainPhone: "Main phone",
    mainWhatsapp: "Main WhatsApp",
    noChanges: "No unsaved changes.",
    required: "This field is required.",
    save: "Save profile",
    saved: "Profile saved.",
    saving: "Saving...",
    saveError: "Could not save profile. Please check the fields.",
    upload: "Upload avatar",
    uploading: "Uploading...",
    uploadError: "Could not upload avatar.",
    unsaved: "You have unsaved changes.",
  },
  ar: {
    account: "ملف حساب المركز",
    accountHint: "هوية تشغيلية لصاحب المركز وحساب الإدارة.",
    avatar: "صورة حساب المركز",
    avatarHint: "تُستخدم داخل لوحة الإدارة وهوية التشغيل. هوية الموقع تُدار من إعدادات الموقع.",
    contact: "تواصل المركز الأساسي",
    contactHint: "تُستخدم هذه المعلومات للحجوزات، المتابعات، الإشعارات، والتواصل الاحتياطي في الموقع.",
    duplicate: "البريد أو الهاتف مستخدم في حساب آخر.",
    email: "البريد الأساسي",
    fullName: "الاسم الكامل",
    invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا.",
    invalidPhone: "أدخل رقم هاتف صالحًا.",
    language: "اللغة المفضلة",
    loading: "جار تحميل الملف...",
    loadError: "تعذر تحميل الملف. يرجى المحاولة مرة أخرى.",
    mainPhone: "الهاتف الأساسي",
    mainWhatsapp: "واتساب المركز الأساسي",
    noChanges: "لا توجد تغييرات غير محفوظة.",
    required: "هذا الحقل مطلوب.",
    save: "حفظ الملف",
    saved: "تم حفظ الملف.",
    saving: "جار الحفظ...",
    saveError: "تعذر حفظ الملف. تحقق من الحقول.",
    upload: "رفع الصورة",
    uploading: "جار الرفع...",
    uploadError: "تعذر رفع الصورة.",
    unsaved: "لديك تغييرات غير محفوظة.",
  },
  he: {
    account: "פרופיל חשבון המרכז",
    accountHint: "זהות תפעולית לבעל המרכז ולחשבון הניהול.",
    avatar: "תמונת חשבון המרכז",
    avatarHint: "משמשת בממשק הניהול ובזהות התפעולית. מיתוג האתר מנוהל בנפרד.",
    contact: "פרטי קשר מרכזיים",
    contactHint: "מידע זה משמש להזמנות, מעקבים, התראות ותקשורת גיבוי באתר.",
    duplicate: "האימייל או הטלפון כבר בשימוש בחשבון אחר.",
    email: "אימייל ראשי",
    fullName: "שם מלא",
    invalidEmail: "הזינו אימייל תקין.",
    invalidPhone: "הזינו מספר טלפון תקין.",
    language: "שפה מועדפת",
    loading: "טוען פרופיל...",
    loadError: "לא ניתן לטעון את הפרופיל. נסו שוב.",
    mainPhone: "טלפון ראשי",
    mainWhatsapp: "WhatsApp מרכזי",
    noChanges: "אין שינויים שלא נשמרו.",
    required: "שדה זה חובה.",
    save: "שמירת פרופיל",
    saved: "הפרופיל נשמר.",
    saving: "שומר...",
    saveError: "לא ניתן לשמור את הפרופיל. בדקו את השדות.",
    upload: "העלאת תמונה",
    uploading: "מעלה...",
    uploadError: "לא ניתן להעלות תמונה.",
    unsaved: "יש שינויים שלא נשמרו.",
  },
} as const;

const sectionNavKeys: Record<string, keyof CenterAdminDictionary["nav"]> = {
  appointments: "appointments",
  billing: "billing",
  payments: "billing",
  services: "services",
  staff: "staff",
};

function serialize(form: FormState) {
  return JSON.stringify({
    avatarUrl: form.avatarUrl.trim(),
    email: form.email.trim().toLowerCase(),
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
    preferredLanguage: form.preferredLanguage,
    whatsappPhone: form.whatsappPhone.trim(),
  });
}

function toForm(profile: CenterAccountProfile): FormState {
  return {
    avatarUrl: profile.avatarUrl ?? "",
    email: profile.email ?? "",
    fullName: profile.fullName ?? "",
    phone: profile.phone ?? "",
    preferredLanguage: profile.preferredLanguage,
    whatsappPhone: profile.whatsappPhone ?? "",
  };
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 20;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function TenantProfilePage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = copy[locale] ?? copy.en;
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [initialSnapshot, setInitialSnapshot] = useState(serialize(emptyForm));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadState, setLoadState] = useState<"error" | "loading" | "ready">("loading");
  const [notice, setNotice] = useState("");
  const [saveState, setSaveState] = useState<"error" | "idle" | "saving" | "saved">("idle");
  const [uploadState, setUploadState] = useState<"error" | "idle" | "uploading">("idle");
  const [pwForm, setPwForm] = useState({ confirmPassword: "", currentPassword: "", newPassword: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwNotice, setPwNotice] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isDirty = useMemo(() => serialize(form) !== initialSnapshot, [form, initialSnapshot]);

  useEffect(() => {
    getCenterAccountProfile()
      .then((profile) => {
        const next = toForm(profile);
        setForm(next);
        setInitialSnapshot(serialize(next));
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function setField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setNotice("");
    setSaveState("idle");
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = t.required;
    if (!form.phone.trim()) next.phone = t.required;
    else if (!isValidPhone(form.phone)) next.phone = t.invalidPhone;
    if (!form.whatsappPhone.trim()) next.whatsappPhone = t.required;
    else if (!isValidPhone(form.whatsappPhone)) next.whatsappPhone = t.invalidPhone;
    if (!form.email.trim()) next.email = t.required;
    else if (!isValidEmail(form.email.trim())) next.email = t.invalidEmail;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveProfile() {
    if (!validate()) return;
    setSaveState("saving");
    setNotice("");
    try {
      const payload: CenterAccountProfilePayload = {
        avatarUrl: form.avatarUrl.trim() || null,
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        preferredLanguage: form.preferredLanguage,
        whatsappPhone: form.whatsappPhone.trim(),
      };
      const saved = await updateCenterAccountProfile(payload);
      const next = toForm(saved);
      setForm(next);
      setInitialSnapshot(serialize(next));
      setSaveState("saved");
      setNotice(t.saved);
    } catch (error) {
      setSaveState("error");
      if (error instanceof ApiRequestError) {
        const details = error.details as { errors?: Record<string, string> } | null;
        if (details?.errors) {
          const mapped: Record<string, string> = {};
          for (const key of Object.keys(details.errors)) {
            mapped[key] = key === "email" || key === "phone" ? t.duplicate : details.errors[key];
          }
          setErrors(mapped);
        }
      }
    }
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadState("uploading");
    try {
      const result = await uploadTenantCenterPublicImage(file, "logo");
      setField("avatarUrl", result.url);
      setUploadState("idle");
    } catch (error) {
      setUploadState("error");
      setErrors((current) => ({
        ...current,
        avatarUrl: error instanceof UploadFailedError ? (error.details ?? error.message) : t.uploadError,
      }));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handlePwChange(field: keyof typeof pwForm, value: string) {
    setPwForm((current) => ({ ...current, [field]: value }));
    setPwErrors((current) => ({ ...current, [field]: "" }));
  }

  return (
    <CenterAdminShell
      activeNav="settings"
      requiredPermission="settings:view"
      title={(d) => d.profile.title}
      subtitle={(d) => d.profile.subtitle}
    >
      {({ dictionary, session }) => {
        const groups = getPermissionGroups(session.permissions);

        const logout = async () => {
          setIsLoggingOut(true);
          await logoutCenterUser().catch(() => null);
          router.replace("/tenant/login");
        };

        const submitPasswordChange = async () => {
          const next: Record<string, string> = {};
          if (!pwForm.currentPassword) next.currentPassword = dictionary.staff.fieldRequired;
          if (!pwForm.newPassword) next.newPassword = dictionary.staff.fieldRequired;
          else if (pwForm.newPassword.length < 8) next.newPassword = dictionary.profile.passwordTooShort;
          if (pwForm.newPassword && pwForm.newPassword !== pwForm.confirmPassword) {
            next.confirmPassword = dictionary.profile.passwordMismatch;
          }
          if (Object.keys(next).length > 0) {
            setPwErrors(next);
            return;
          }
          setIsSavingPassword(true);
          setPwNotice("");
          try {
            await changeCenterPassword(pwForm.currentPassword, pwForm.newPassword);
            setPwForm({ confirmPassword: "", currentPassword: "", newPassword: "" });
            setPwNotice(dictionary.profile.passwordUpdated);
          } catch {
            setPwErrors({ currentPassword: dictionary.profile.wrongPassword });
          } finally {
            setIsSavingPassword(false);
          }
        };

        if (loadState === "loading") {
          return <p className="mt-6 text-sm text-[#66758a]">{t.loading}</p>;
        }

        if (loadState === "error") {
          return (
            <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {t.loadError}
            </div>
          );
        }

        const languageLabels = {
          AR: dictionary.languages.ar,
          EN: dictionary.languages.en,
          HE: dictionary.languages.he,
        };

        return (
          <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-[#0B2D5C]">{t.account}</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#66758a]">{t.accountHint}</p>
                  </div>
                  <button
                    className={buttonClassName("warning", "sm")}
                    disabled={isLoggingOut}
                    onClick={logout}
                    type="button"
                  >
                    {isLoggingOut ? dictionary.shell.loggingOut : dictionary.shell.logout}
                  </button>
                </div>

                <div className="mt-5 flex min-w-0 flex-col gap-4 border-t border-[#EEF2F7] pt-5 md:flex-row md:items-start">
                  <div className="min-w-0 md:w-64">
                    <p className="text-sm font-bold text-[#24364f]">{t.avatar}</p>
                    <p className="mt-1 text-xs leading-5 text-[#66758a]">{t.avatarHint}</p>
                    <div className="mt-3 flex items-center gap-3">
                      {form.avatarUrl ? (
                        <img alt="" className="h-16 w-16 rounded-2xl border border-[#E5E7EB] bg-white object-contain" src={form.avatarUrl} />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B2D5C] text-lg font-black text-white">
                          {getInitials(form.fullName || session.center.name) || "RC"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={handleAvatarUpload} />
                        <button
                          className={buttonClassName("secondary", "sm")}
                          disabled={uploadState === "uploading"}
                          onClick={() => fileRef.current?.click()}
                          type="button"
                        >
                          {uploadState === "uploading" ? t.uploading : t.upload}
                        </button>
                        {errors.avatarUrl ? <p className="mt-1 text-xs font-semibold text-[#B42318]">{errors.avatarUrl}</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField error={errors.fullName} label={t.fullName} onChange={(value) => setField("fullName", value)} value={form.fullName} />
                    <label className="block min-w-0">
                      <span className="text-xs font-bold text-[#24364f]">{t.language}</span>
                      <select
                        className="mt-1.5 h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#132238] outline-none focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/15"
                        value={form.preferredLanguage}
                        onChange={(event) => setField("preferredLanguage", event.target.value)}
                      >
                        {(["AR", "EN", "HE"] as const).map((lang) => (
                          <option key={lang} value={lang}>{languageLabels[lang]}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
                <h2 className="text-lg font-black text-[#0B2D5C]">{t.contact}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#66758a]">{t.contactHint}</p>
                <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 border-t border-[#EEF2F7] pt-5 sm:grid-cols-3">
                  <TextField dir="ltr" error={errors.phone} label={t.mainPhone} onChange={(value) => setField("phone", value)} value={form.phone} />
                  <TextField dir="ltr" error={errors.whatsappPhone} label={t.mainWhatsapp} onChange={(value) => setField("whatsappPhone", value)} value={form.whatsappPhone} />
                  <TextField dir="ltr" error={errors.email} label={t.email} onChange={(value) => setField("email", value)} type="email" value={form.email} />
                </div>
              </section>

              <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
                <h2 className="text-base font-black text-[#0B2D5C]">{dictionary.profile.changePassword}</h2>
                {pwNotice ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{pwNotice}</p> : null}
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
                  <PasswordField error={pwErrors.currentPassword} label={dictionary.profile.currentPassword} onChange={(value) => handlePwChange("currentPassword", value)} value={pwForm.currentPassword} />
                  <PasswordField error={pwErrors.newPassword} label={dictionary.profile.newPassword} onChange={(value) => handlePwChange("newPassword", value)} value={pwForm.newPassword} />
                  <PasswordField error={pwErrors.confirmPassword} label={dictionary.profile.confirmPassword} onChange={(value) => handlePwChange("confirmPassword", value)} value={pwForm.confirmPassword} />
                </div>
                <button className={`${buttonClassName("secondary", "md")} mt-4`} disabled={isSavingPassword} onClick={submitPasswordChange} type="button">
                  {isSavingPassword ? dictionary.profile.updating : dictionary.profile.updatePassword}
                </button>
              </section>
            </div>

            <aside className="min-w-0 space-y-5">
              <div className="sticky top-20 rounded-xl border border-[#DDE6F2] bg-white p-4 shadow-sm">
                <p className={`text-sm font-bold ${isDirty ? "text-amber-700" : "text-emerald-700"}`}>
                  {isDirty ? t.unsaved : t.noChanges}
                </p>
                {notice ? <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{notice}</p> : null}
                {saveState === "error" ? <p className="mt-2 text-sm font-semibold text-[#B42318]">{t.saveError}</p> : null}
                <button
                  className={`${buttonClassName("primary", "md")} mt-4 w-full`}
                  disabled={saveState === "saving" || !isDirty}
                  onClick={saveProfile}
                  type="button"
                >
                  {saveState === "saving" ? t.saving : t.save}
                </button>
              </div>

              <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <h3 className="text-base font-black text-[#0B2D5C]">{dictionary.profile.permissionsTitle}</h3>
                {groups.length === 0 ? (
                  <p className="mt-3 text-sm text-[#66758a]">{dictionary.profile.noPermissions}</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {groups.map((group) => {
                      const navKey = sectionNavKeys[group.sectionKey];
                      const sectionLabel = navKey ? dictionary.nav[navKey] : group.sectionKey;
                      return (
                        <div key={group.sectionKey} className="min-w-0">
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#C8A45D]">{sectionLabel}</p>
                          <div className="flex min-w-0 flex-wrap gap-2">
                            {group.permissions.map((perm) => {
                              const dictKey = permKeyToDictKey[perm] as keyof typeof dictionary.permissionLabels;
                              return <span key={perm} className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">{dictionary.permissionLabels[dictKey]}</span>;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </aside>
          </div>
        );
      }}
    </CenterAdminShell>
  );
}

function TextField({
  dir,
  error,
  label,
  onChange,
  type = "text",
  value,
}: {
  dir?: "ltr" | "rtl";
  error?: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-bold text-[#24364f]">{label}</span>
      <input
        className={`mt-1.5 h-11 w-full min-w-0 rounded-xl border bg-[#F8FAFC] px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/15 ${error ? "border-[#F3B8B8]" : "border-[#E5E7EB]"}`}
        dir={dir}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {error ? <p className="mt-1 text-xs font-semibold text-[#B42318]">{error}</p> : null}
    </label>
  );
}

function PasswordField({
  error,
  label,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-bold text-[#24364f]">{label}</span>
      <input
        className={`mt-1.5 h-11 w-full rounded-xl border bg-[#F8FAFC] px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/15 ${error ? "border-[#F3B8B8]" : "border-[#E5E7EB]"}`}
        onChange={(event) => onChange(event.target.value)}
        type="password"
        value={value}
      />
      {error ? <p className="mt-1 text-xs font-semibold text-[#B42318]">{error}</p> : null}
    </label>
  );
}
