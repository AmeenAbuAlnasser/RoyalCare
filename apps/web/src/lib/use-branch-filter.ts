"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Shared branch-filter state synced to the URL (`?branchId=xxx`) so the
 * selection survives navigation, refresh, and sharing. An empty string means
 * "All Branches". Pages pass `branchId` straight to their server queries —
 * never filter client-side after fetching everything.
 */
export function useBranchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const branchId = searchParams.get("branchId") ?? "";

  const setBranchId = useCallback(
    (next: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (next) {
        params.set("branchId", next);
      } else {
        params.delete("branchId");
      }
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return { branchId, setBranchId };
}
