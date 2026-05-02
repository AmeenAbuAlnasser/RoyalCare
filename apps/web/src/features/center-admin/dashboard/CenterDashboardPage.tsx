"use client";

import { CenterAdminShell } from "../layout/CenterAdminShell";

export function CenterDashboardPage() {
  return (
    <CenterAdminShell
      activeNav="dashboard"
      subtitle={(dictionary) => dictionary.dashboard.subtitle}
      title={(dictionary) => dictionary.dashboard.title}
    >
      {({ dictionary, session }) => (
        <>
          <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs font-medium text-[#66758a]">
                {dictionary.dashboard.currentUser}
              </p>
              <p className="mt-2 break-words text-sm font-semibold text-[#24364f]">
                {session.user.fullName}
              </p>
            </article>
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs font-medium text-[#66758a]">
                {dictionary.dashboard.role}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#24364f]">
                {dictionary.roles[session.role.key]}
              </p>
            </article>
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs font-medium text-[#66758a]">
                {dictionary.dashboard.centerStatus}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#24364f]">
                {dictionary.statuses[session.center.status]}
              </p>
            </article>
          </section>

          <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(["patients", "appointments", "services", "staff"] as const).map(
              (key) => (
                <article
                  className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                  key={key}
                >
                  <p className="text-sm font-medium text-[#66758a]">
                    {dictionary.cards[key]}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[#0B2D5C]">
                    0
                  </p>
                </article>
              ),
            )}
          </section>
        </>
      )}
    </CenterAdminShell>
  );
}
