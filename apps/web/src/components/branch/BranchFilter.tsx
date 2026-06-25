"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  listTenantBranches,
  type TenantBranchOption,
} from "@/lib/api/tenant-branches";
import { formatBranchLabel } from "@/lib/branch-label";

const allBranchesLabel = {
  en: "All Branches",
  ar: "كل الفروع",
  he: "כל הסניפים",
} as const;

// Module-level cache so every BranchFilter instance across pages shares one
// fetch per session instead of refetching on each mount.
let branchesCache: TenantBranchOption[] | null = null;
let branchesPromise: Promise<TenantBranchOption[]> | null = null;

function loadBranches(): Promise<TenantBranchOption[]> {
  if (branchesCache) return Promise.resolve(branchesCache);
  if (!branchesPromise) {
    branchesPromise = listTenantBranches()
      .then((response) => {
        branchesCache = response.branches;
        return branchesCache;
      })
      .catch(() => {
        branchesPromise = null;
        return [];
      });
  }
  return branchesPromise;
}

/**
 * Standardized branch selector used across every tenant management page.
 * Renders nothing when the center has a single (or no) active branch — there is
 * nothing to isolate, so the branch is "auto-selected" silently. Otherwise it
 * shows "All Branches" + each branch labelled with name — address — city.
 */
export function BranchFilter({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (branchId: string) => void;
  className?: string;
}) {
  const { locale } = useLanguage();
  const [branches, setBranches] = useState<TenantBranchOption[] | null>(
    branchesCache,
  );

  useEffect(() => {
    let isMounted = true;
    void loadBranches().then((result) => {
      if (isMounted) setBranches(result);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!branches || branches.length <= 1) {
    return null;
  }

  const selectedLabel =
    branches.find((branch) => branch.id === value) ?? null;

  return (
    <select
      aria-label={allBranchesLabel[locale]}
      className={
        className ??
        "min-h-11 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
      }
      onChange={(event) => onChange(event.target.value)}
      title={
        selectedLabel
          ? formatBranchLabel(selectedLabel, locale)
          : allBranchesLabel[locale]
      }
      value={value}
    >
      <option value="">{allBranchesLabel[locale]}</option>
      {branches.map((branch) => (
        <option
          key={branch.id}
          title={formatBranchLabel(branch, locale)}
          value={branch.id}
        >
          {formatBranchLabel(branch, locale)}
        </option>
      ))}
    </select>
  );
}
