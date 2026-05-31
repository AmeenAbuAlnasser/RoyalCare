"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoyalCareLogo } from "@/components/brand/RoyalCareLogo";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SupportedLocale } from "@/i18n/locales";
import { loginSuperAdmin } from "@/lib/api/super-admin-auth";

const loginDictionaries: Record<
  SupportedLocale,
  {
    brand: string;
    console: string;
    heroTitle: string;
    heroText: string;
    heroFooter: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    login: string;
    invalidCredentials: string;
    unexpectedError: string;
    accessNote: string;
  }
> = {
  en: {
    brand: "RoyalCare",
    console: "Super Admin Console",
    heroTitle: "Manage centers with clarity and control.",
    heroText:
      "Secure access for RoyalCare operators managing tenants, subscriptions, domains, and platform permissions.",
    heroFooter:
      "Multi-tenant SaaS administration for healthcare, beauty, and wellness centers.",
    eyebrow: "Secure access",
    title: "Sign in to Super Admin",
    subtitle: "Use your RoyalCare administrator account to continue.",
    email: "Email address",
    emailPlaceholder: "admin@royalcare.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPassword: "Forgot password?",
    login: "Sign in",
    invalidCredentials: "Email or password is incorrect.",
    unexpectedError: "An error occurred. Please try again.",
    accessNote:
      "Access is restricted to authorized RoyalCare platform administrators.",
  },
  ar: {
    brand: "رويال كير",
    console: "لوحة مدير المنصة",
    heroTitle: "إدارة المراكز بوضوح وتحكم.",
    heroText:
      "دخول آمن لفريق رويال كير لإدارة المستأجرين والاشتراكات والنطاقات وصلاحيات المنصة.",
    heroFooter:
      "إدارة منصة متعددة المستأجرين لمراكز الصحة والجمال والعافية.",
    eyebrow: "دخول آمن",
    title: "تسجيل الدخول إلى إدارة المنصة",
    subtitle: "استخدم حساب مدير رويال كير للمتابعة.",
    email: "البريد الإلكتروني",
    emailPlaceholder: "admin@royalcare.com",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    login: "تسجيل الدخول",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    unexpectedError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    accessNote:
      "الدخول مخصص فقط لمديري منصة رويال كير المصرح لهم.",
  },
  he: {
    brand: "RoyalCare",
    console: "מסוף מנהל מערכת",
    heroTitle: "ניהול מרכזים בצורה ברורה ומבוקרת.",
    heroText:
      "גישה מאובטחת לצוות RoyalCare לניהול דיירים, מינויים, דומיינים והרשאות מערכת.",
    heroFooter:
      "ניהול SaaS מרובה דיירים למרכזי בריאות, יופי ורווחה.",
    eyebrow: "גישה מאובטחת",
    title: "כניסה לניהול המערכת",
    subtitle: "השתמשו בחשבון מנהל RoyalCare כדי להמשיך.",
    email: "כתובת אימייל",
    emailPlaceholder: "admin@royalcare.com",
    password: "סיסמה",
    passwordPlaceholder: "הזינו סיסמה",
    forgotPassword: "שכחת סיסמה?",
    login: "כניסה",
    invalidCredentials: "כתובת האימייל או הסיסמה שגויים.",
    unexpectedError: "אירעה שגיאה. נסו שוב.",
    accessNote:
      "הגישה מוגבלת למנהלי מערכת מורשים של RoyalCare.",
  },
};

export function SuperAdminLogin() {
  const { direction, locale } = useLanguage();
  const dictionary = loginDictionaries[locale];
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await loginSuperAdmin(email.trim(), password);
      router.replace("/super-admin/dashboard");
    } catch (err: unknown) {
      console.error("[super-admin-login:error]", err);
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 401 || status === 403) {
        setError(dictionary.invalidCredentials);
      } else {
        setError(dictionary.unexpectedError);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen w-full max-w-full bg-[#F8FAFC] text-[#132238]"
      dir={direction}
      lang={locale}
    >
      <section className="flex min-h-screen w-full max-w-full items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full min-w-0 max-w-5xl overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_24px_70px_rgba(11,45,92,0.10)] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden bg-[#0B2D5C] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <RoyalCareLogo
                  className="h-12 w-12 rounded-md border border-white/20 bg-white"
                  priority
                  variant="mark"
                />
                <div>
                  <p className="text-lg font-semibold tracking-wide">
                    {dictionary.brand}
                  </p>
                  <p className="text-sm text-white/70">{dictionary.console}</p>
                </div>
              </div>

              <div className="mt-16 max-w-sm">
                <h1 className="text-3xl font-semibold leading-tight">
                  {dictionary.heroTitle}
                </h1>
                <p className="mt-4 text-sm leading-6 text-white/72">
                  {dictionary.heroText}
                </p>
              </div>
            </div>

            <div className="border-t border-[#C8A45D]/35 pt-6 text-xs leading-5 text-white/65">
              {dictionary.heroFooter}
            </div>
          </aside>

          <div className="min-w-0 px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
            <div className="mb-10 flex min-w-0 items-center gap-3 lg:hidden">
              <RoyalCareLogo
                className="h-11 w-11 rounded-md border border-[#E5E7EB] bg-white"
                priority
                variant="mark"
              />
              <div className="min-w-0">
                <p className="text-lg font-semibold">{dictionary.brand}</p>
                <p className="text-sm text-[#68758a]">{dictionary.console}</p>
              </div>
            </div>

            <div className="min-w-0 max-w-md">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#C8A45D]">
                {dictionary.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[#0B2D5C]">
                {dictionary.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#68758a]">
                {dictionary.subtitle}
              </p>

              <form className="mt-8 space-y-5" onSubmit={(e) => { void handleSubmit(e); }}>
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    className="block text-sm font-medium text-[#24364f]"
                    htmlFor="email"
                  >
                    {dictionary.email}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={dictionary.emailPlaceholder}
                    className="mt-2 block h-12 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <label
                      className="block text-sm font-medium text-[#24364f]"
                      htmlFor="password"
                    >
                      {dictionary.password}
                    </label>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={dictionary.passwordPlaceholder}
                    className="mt-2 block h-12 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={buttonClassName("primary", "lg", "w-full")}
                >
                  {isLoading ? "…" : dictionary.login}
                </button>
              </form>

              <p className="mt-8 border-t border-[#E5E7EB] pt-5 text-xs leading-5 text-[#7a8798]">
                {dictionary.accessNote}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
