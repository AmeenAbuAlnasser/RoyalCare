"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  listTenantStaff,
  updateTenantStaffStatus,
  type TenantStaff,
  type TenantStaffStatus,
} from "@/lib/api/tenant-staff";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  getTenantSubscriptionRestrictionMessage,
  isTenantWriteBlocked,
} from "../subscription-access";
import { hasTenantStaffPermission } from "./staff-permissions";

const roles: CenterRoleKey[] = [
  "CENTER_OWNER",
  "CENTER_MANAGER",
  "DOCTOR",
  "RECEPTIONIST",
  "ACCOUNTANT",
  "STAFF",
];

function getStaffRoles(item: TenantStaff) {
  const mergedRoles = item.roles?.length ? item.roles : [item.role];
  return roles.filter((role) => mergedRoles.includes(role));
}

function getStaffDedupeKey(item: TenantStaff) {
  return item.email?.trim().toLowerCase() || item.userId || item.id || "";
}

function mergeStaffRows(rows: TenantStaff[]) {
  const byIdentity = new Map<string, TenantStaff>();

  for (const row of rows) {
    const key = getStaffDedupeKey(row);
    if (!key) continue;

    const current = byIdentity.get(key);
    if (!current) {
      byIdentity.set(key, {
        ...row,
        roles: getStaffRoles(row),
      });
      continue;
    }

    const mergedRoles = [...getStaffRoles(current)];
    for (const role of getStaffRoles(row)) {
      if (!mergedRoles.includes(role)) {
        mergedRoles.push(role);
      }
    }

    byIdentity.set(key, {
      ...current,
      ...row,
      id: current.id || row.id,
      userId: current.userId || row.userId || current.id || row.id,
      email: current.email || row.email,
      fullName: current.fullName || row.fullName,
      isCenterOwner: Boolean(current.isCenterOwner || row.isCenterOwner),
      roles: roles.filter((role) => mergedRoles.includes(role)),
      status:
        current.status === "ACTIVE" || row.status === "ACTIVE"
          ? "ACTIVE"
          : "INACTIVE",
      updatedAt:
        new Date(row.updatedAt).getTime() > new Date(current.updatedAt).getTime()
          ? row.updatedAt
          : current.updatedAt,
    });
  }

  return [...byIdentity.values()];
}

export function TenantStaffPage() {
  const { locale } = useLanguage();
  const [staff, setStaff] = useState<TenantStaff[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<CenterRoleKey | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<TenantStaffStatus | "ALL">(
    "ALL",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [savingStaffId, setSavingStaffId] = useState("");

  useEffect(() => {
    let isMounted = true;

    listTenantStaff({
      role: roleFilter,
      search,
      status: statusFilter,
    })
      .then((response) => {
        if (isMounted) {
          console.log("[staff-debug]", {
            rows: response.items.map((item) => ({
              email: item.email,
              id: item.id,
              role: item.role,
              roles: item.roles,
              userId: item.userId,
            })),
            total: response.total,
          });
          setLoadError(false);
          setStaff(mergeStaffRows(response.items));
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [roleFilter, search, statusFilter]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(""), 4000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  return (
    <CenterAdminShell
      activeNav="staff"
      subtitle={(dictionary) => dictionary.staff.subtitle}
      title={(dictionary) => dictionary.staff.title}
    >
      {({ dictionary, session }) => {
        const isWriteBlocked = isTenantWriteBlocked(session);
        const restrictionMessage =
          getTenantSubscriptionRestrictionMessage(session, dictionary);
        const canActivate =
          hasTenantStaffPermission(
            session.permissions,
            "staff:status",
          ) && !isWriteBlocked;

        const changeStatus = async (item: TenantStaff) => {
          if (!canActivate) {
            return;
          }

          const nextStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

          setSavingStaffId(item.id);
          setNotice("");

          try {
            const updated = await updateTenantStaffStatus(item.id, nextStatus);
            setStaff((current) =>
              mergeStaffRows(
                current.map((entry) =>
                  getStaffDedupeKey(entry) === getStaffDedupeKey(updated)
                    ? {
                        ...entry,
                        ...updated,
                        isCenterOwner:
                          entry.isCenterOwner ?? updated.isCenterOwner,
                        roles: entry.roles ?? updated.roles,
                      }
                    : entry,
                ),
              ),
            );
            setNotice(
              nextStatus === "ACTIVE"
                ? dictionary.staff.activated
                : dictionary.staff.deactivated,
            );
          } finally {
            setSavingStaffId("");
          }
        };

        return (
          <>
            <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
              <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(150px,0.38fr)_minmax(150px,0.38fr)]">
                  <input
                    className="min-h-11 min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm text-[#132238]"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={dictionary.staff.searchPlaceholder}
                    value={search}
                  />
                  <select
                    className="min-h-11 min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                    onChange={(event) =>
                      setRoleFilter(event.target.value as CenterRoleKey | "ALL")
                    }
                    value={roleFilter}
                  >
                    <option value="ALL">{dictionary.staff.filterAllRoles}</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {dictionary.roles[role]}
                      </option>
                    ))}
                  </select>
                  <select
                    className="min-h-11 min-w-0 rounded-md border border-[#D8DEE8] px-3 text-sm font-semibold text-[#132238]"
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as TenantStaffStatus | "ALL",
                      )
                    }
                    value={statusFilter}
                  >
                    <option value="ALL">
                      {dictionary.staff.filterAllStatuses}
                    </option>
                    <option value="ACTIVE">
                      {dictionary.staffStatuses.ACTIVE}
                    </option>
                    <option value="INACTIVE">
                      {dictionary.staffStatuses.INACTIVE}
                    </option>
                  </select>
                </div>
                {session.permissions.includes("staff:create") ? (
                  isWriteBlocked ? (
                    <button
                      className={buttonClassName("primary", "md")}
                      disabled
                      title={restrictionMessage || undefined}
                      type="button"
                    >
                      {dictionary.staff.addStaff}
                    </button>
                  ) : (
                    <Link
                      className={buttonClassName("primary", "md")}
                      href="/tenant/staff/new"
                    >
                      {dictionary.staff.addStaff}
                    </Link>
                  )
                ) : null}
              </div>
            </section>

            {notice ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </p>
            ) : null}

            {isLoading ? (
              <p className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {dictionary.staff.loading}
              </p>
            ) : null}

            {loadError ? (
              <p className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5 text-sm font-semibold text-[#B42318]">
                {dictionary.staff.loadError}
              </p>
            ) : null}

            {!isLoading && !loadError && staff.length === 0 ? (
              <section className="mt-5 rounded-lg border border-dashed border-[#C8A45D] bg-white px-4 py-8 text-center">
                <h2 className="text-base font-semibold text-[#0B2D5C]">
                  {dictionary.staff.emptyTitle}
                </h2>
                <p className="mt-2 text-sm text-[#66758a]">
                  {dictionary.staff.emptyBody}
                </p>
              </section>
            ) : null}

            <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              {staff.map((item, index) => {
                const itemRoles = getStaffRoles(item);
                const isProtectedOwner = Boolean(item.isCenterOwner);

                return (
                  <article
                    className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)]"
                    key={`${item.id ?? "staff"}-${item.email ?? ""}-${index}`}
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-semibold text-[#0B2D5C]">
                          {item.fullName ||
                            item.email ||
                            dictionary.common.notAvailable}
                        </h2>
                        <p className="mt-1 break-words text-sm text-[#66758a]">
                          {item.email || dictionary.common.notAvailable}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {itemRoles.map((role) => (
                          <span
                            className="w-fit rounded-full bg-[#EAF1FA] px-3 py-1 text-xs font-semibold text-[#0B2D5C]"
                            key={role}
                          >
                            {dictionary.roles[role]}
                          </span>
                        ))}
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-[#FFF7F7] text-[#B42318]"
                          }`}
                        >
                          {dictionary.staffStatuses[item.status]}
                        </span>
                      </div>
                    </div>
                  <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                    <Detail
                      label={dictionary.staff.createdAt}
                      value={formatDate(item.createdAt, locale)}
                    />
                    <Detail
                      label={dictionary.staff.updatedAt}
                      value={formatDate(item.updatedAt, locale)}
                    />
                  </dl>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link
                      className={buttonClassName("secondary", "sm")}
                      href={`/tenant/staff/${item.id}`}
                    >
                      {dictionary.common.view}
                    </Link>
                    {session.permissions.includes("staff:update") ? (
                      isWriteBlocked ? (
                        <button
                          className={buttonClassName("secondary", "sm")}
                          disabled
                          title={restrictionMessage || undefined}
                          type="button"
                        >
                          {dictionary.common.edit}
                        </button>
                      ) : (
                        <Link
                          className={buttonClassName("secondary", "sm")}
                          href={`/tenant/staff/${item.id}/edit`}
                        >
                          {dictionary.common.edit}
                        </Link>
                      )
                    ) : null}
                    {session.permissions.includes("staff:status") ? (
                      <button
                        className={buttonClassName(
                          item.status === "ACTIVE" ? "warning" : "success",
                          "sm",
                        )}
                        disabled={
                          savingStaffId === item.id ||
                          !canActivate ||
                          isProtectedOwner
                        }
                        onClick={() => changeStatus(item)}
                        title={
                          isProtectedOwner
                            ? dictionary.roles.CENTER_OWNER
                            : restrictionMessage || undefined
                        }
                        type="button"
                      >
                        {item.status === "ACTIVE"
                          ? dictionary.staffStatuses.INACTIVE
                          : dictionary.common.activate}
                      </button>
                    ) : null}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] p-3">
      <dt className="text-xs font-semibold text-[#66758a]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[#24364f]">
        {value}
      </dd>
    </div>
  );
}
