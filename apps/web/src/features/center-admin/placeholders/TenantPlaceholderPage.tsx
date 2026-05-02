"use client";

import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import { CenterAdminShell } from "../layout/CenterAdminShell";

type PlaceholderKey = keyof CenterAdminDictionary["placeholders"];

export function TenantPlaceholderPage({ pageKey }: { pageKey: PlaceholderKey }) {
  return (
    <CenterAdminShell
      activeNav={pageKey}
      subtitle={(dictionary) => dictionary.placeholders[pageKey].description}
      title={(dictionary) => dictionary.placeholders[pageKey].title}
    >
      {({ dictionary }) => (
        <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white p-8 text-center shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
            {dictionary.comingSoon}
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[#0B2D5C]">
            {dictionary.placeholders[pageKey].title}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
            {dictionary.placeholders[pageKey].description}
          </p>
        </section>
      )}
    </CenterAdminShell>
  );
}
