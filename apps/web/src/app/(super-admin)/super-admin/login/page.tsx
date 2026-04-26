import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin Login | RoyalCare",
  description: "RoyalCare Super Admin access.",
};

export default function SuperAdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#132238]">
      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-[#d8e0eb] bg-white shadow-[0_24px_70px_rgba(15,35,70,0.10)] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden bg-[#082b57] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/20 bg-white text-lg font-semibold text-[#082b57]">
                  RC
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-wide">
                    RoyalCare
                  </p>
                  <p className="text-sm text-white/70">Super Admin Console</p>
                </div>
              </div>

              <div className="mt-16 max-w-sm">
                <h1 className="text-3xl font-semibold leading-tight">
                  Manage centers with clarity and control.
                </h1>
                <p className="mt-4 text-sm leading-6 text-white/72">
                  Secure access for RoyalCare operators managing tenants,
                  subscriptions, domains, and platform permissions.
                </p>
              </div>
            </div>

            <div className="border-t border-white/12 pt-6 text-xs leading-5 text-white/60">
              Multi-tenant SaaS administration for healthcare, beauty, and
              wellness centers.
            </div>
          </aside>

          <div className="px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#082b57] text-base font-semibold text-white">
                RC
              </div>
              <div>
                <p className="text-lg font-semibold">RoyalCare</p>
                <p className="text-sm text-[#68758a]">Super Admin Console</p>
              </div>
            </div>

            <div className="max-w-md">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#315f9c]">
                Secure access
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[#0b1f3a]">
                Sign in to Super Admin
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#68758a]">
                Use your RoyalCare administrator account to continue.
              </p>

              <form className="mt-8 space-y-5" action="#">
                <div>
                  <label
                    className="block text-sm font-medium text-[#24364f]"
                    htmlFor="email"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@royalcare.com"
                    className="mt-2 block h-12 w-full rounded-md border border-[#cfd8e5] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0b4f9c] focus:ring-3 focus:ring-[#0b4f9c]/12"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4">
                    <label
                      className="block text-sm font-medium text-[#24364f]"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-sm font-medium text-[#0b4f9c] hover:text-[#083c77]"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="mt-2 block h-12 w-full rounded-md border border-[#cfd8e5] bg-white px-3 text-sm text-[#132238] outline-none transition focus:border-[#0b4f9c] focus:ring-3 focus:ring-[#0b4f9c]/12"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#40516a]">
                    <input
                      type="checkbox"
                      name="remember"
                      className="h-4 w-4 rounded border-[#b8c4d4] text-[#0b4f9c] focus:ring-[#0b4f9c]"
                    />
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center rounded-md bg-[#082b57] px-4 text-sm font-semibold text-white transition hover:bg-[#0b3f7d] focus:outline-none focus:ring-3 focus:ring-[#082b57]/20"
                >
                  Login
                </button>
              </form>

              <p className="mt-8 border-t border-[#e1e7f0] pt-5 text-xs leading-5 text-[#7a8798]">
                Access is restricted to authorized RoyalCare platform
                administrators. Authentication integration will be connected in
                a later backend phase.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
