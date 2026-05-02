"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import {
  getTenantStaff,
  updateTenantStaffStatus,
  type TenantStaff,
} from "@/lib/api/tenant-staff";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import { hasTenantStaffPermission } from "./staff-permissions";

export function TenantStaffDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { locale } = useLanguage();
  const staffId = params.id;
  const [staff, setStaff] = useState<TenantStaff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getTenantStaff(staffId)
      .then((response) => {
        if (isMounted) {
          setStaff(response);
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
  }, [staffId]);

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
      title={(dictionary) => dictionary.staff.detailsTitle}
    >
      {({ dictionary, session }) => {
        const canUpdate = hasTenantStaffPermission(
          session.role.key,
          "staff.update",
        );
        const canActivate = hasTenantStaffPermission(
          session.role.key,
          "staff.activate",
        );

        const changeStatus = async () => {
          if (!staff || !canActivate) {
            return;
          }

          const nextStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
          setIsSaving(true);
          setNotice("");

          try {
            const updated = await updateTenantStaffStatus(staff.id, nextStatus);
            setStaff(updated);
            setNotice(
              nextStatus === "ACTIVE"
                ? dictionary.staff.activated
                : dictionary.staff.deactivated,
            );
          } finally {
            setIsSaving(false);
          }
        };

        return (
          <>
            <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                className={buttonClassName("secondary", "md")}
                href="/tenant/staff"
              >
                {dictionary.nav.staff}
              </Link>
              {staff && canUpdate ? (
                <Link
                  className={buttonClassName("secondary", "md")}
                  href={`/tenant/staff/${staff.id}/edit`}
                >
                  {dictionary.common.edit}
                </Link>
              ) : null}
              {staff && canActivate ? (
                <button
                  className={buttonClassName(
                    staff.status === "ACTIVE" ? "warning" : "success",
                    "md",
                  )}
                  disabled={isSaving}
                  onClick={changeStatus}
                  type="button"
                >
                  {staff.status === "ACTIVE"
                    ? dictionary.staffStatuses.INACTIVE
                    : dictionary.common.activate}
                </button>
              ) : null}
            </div>

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
              <section className="mt-5 rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-6">
                <h2 className="text-base font-semibold text-[#B42318]">
                  {dictionary.staff.notFound}
                </h2>
                <button
                  className={buttonClassName("secondary", "md", "mt-4")}
                  onClick={() => router.push("/tenant/staff")}
                  type="button"
                >
                  {dictionary.nav.staff}
                </button>
              </section>
            ) : null}

            {staff && !isLoading ? (
              <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold text-[#0B2D5C]">
                      {staff.fullName || staff.email || dictionary.common.notAvailable}
                    </h2>
                    <p className="mt-1 break-words text-sm text-[#66758a]">
                      {staff.email || dictionary.common.notAvailable}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      staff.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-[#FFF7F7] text-[#B42318]"
                    }`}
                  >
                    {dictionary.staffStatuses[staff.status]}
                  </span>
                </div>

                <dl className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Detail
                    label={dictionary.staff.fullName}
                    value={staff.fullName || dictionary.common.notAvailable}
                  />
                  <Detail
                    label={dictionary.staff.email}
                    value={staff.email || dictionary.common.notAvailable}
                  />
                  <Detail
                    label={dictionary.staff.role}
                    value={dictionary.roles[staff.role]}
                  />
                  <Detail
                    label={dictionary.staff.status}
                    value={dictionary.staffStatuses[staff.status]}
                  />
                  <Detail
                    label={dictionary.staff.createdAt}
                    value={formatDate(staff.createdAt, locale)}
                  />
                  <Detail
                    label={dictionary.staff.updatedAt}
                    value={formatDate(staff.updatedAt, locale)}
                  />
                </dl>
              </section>
            ) : null}
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
