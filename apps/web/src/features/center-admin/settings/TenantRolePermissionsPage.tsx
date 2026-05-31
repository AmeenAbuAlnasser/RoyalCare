"use client";

import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";
import {
  getTenantRolePermissions,
  getTenantRoles,
  updateTenantRolePermissions,
  type TenantRole,
} from "@/lib/api/tenant-roles";
import { CenterAdminShell } from "../layout/CenterAdminShell";
import { permKeyToDictKey } from "../profile/role-permissions";

type SectionKey =
  | "patients"
  | "staff"
  | "services"
  | "appointments"
  | "billing"
  | "payments"
  | "reports"
  | "settings"
  | "permissions";

const SECTIONS: Array<{
  key: SectionKey;
  permissions: string[];
}> = [
  {
    key: "patients",
    permissions: ["patients:view", "patients:create", "patients:update", "patients:status"],
  },
  {
    key: "staff",
    permissions: ["staff:view", "staff:create", "staff:update", "staff:status"],
  },
  {
    key: "services",
    permissions: [
      "services:view",
      "services:create",
      "services:update",
      "services:archive",
      "services:status",
    ],
  },
  {
    key: "appointments",
    permissions: [
      "appointments:view",
      "appointments:create",
      "appointments:update",
      "appointments:cancel",
      "appointments:status",
    ],
  },
  {
    key: "billing",
    permissions: [
      "billing:view",
      "billing:create",
      "billing:update",
      "billing:cancel",
    ],
  },
  {
    key: "payments",
    permissions: ["payments:view", "payments:create"],
  },
  { key: "reports", permissions: ["reports:view"] },
  { key: "settings", permissions: ["settings:view"] },
  {
    key: "permissions",
    permissions: ["permissions:view", "permissions:update"],
  },
];

export function TenantRolePermissionsPage() {
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [rolesStatus, setRolesStatus] = useState<"loading" | "success" | "error">("loading");
  const [permsStatus, setPermsStatus] = useState<"loading" | "idle" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    getTenantRoles()
      .then((data) => {
        setRoles(data);
        setRolesStatus("success");
        const first = data.find((r) => r.key !== "CENTER_OWNER") ?? data[0];
        if (first) {
          setSelectedRoleId(first.id);
        }
      })
      .catch(() => setRolesStatus("error"));
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    let isCurrent = true;

    Promise.resolve()
      .then(() => {
        if (!isCurrent) return null;
        setPermsStatus("loading");
        setSaveStatus("idle");
        return getTenantRolePermissions(selectedRoleId);
      })
      .then((data) => {
        if (!data || !isCurrent) return;
        setPermissions(new Set(data.permissions));
        setPermsStatus("idle");
      })
      .catch(() => {
        if (isCurrent) setPermsStatus("error");
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedRoleId]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const id = window.setTimeout(() => setSaveStatus("idle"), 4000);
    return () => window.clearTimeout(id);
  }, [saveStatus]);

  function togglePermission(perm: string) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
      return next;
    });
    setSaveStatus("idle");
  }

  function toggleSection(perms: string[], checked: boolean) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (checked) {
        perms.forEach((p) => next.add(p));
      } else {
        perms.forEach((p) => next.delete(p));
      }
      return next;
    });
    setSaveStatus("idle");
  }

  return (
    <CenterAdminShell
      activeNav="permissions"
      title={(d) => d.rolePermissions.title}
      subtitle={(d) => d.rolePermissions.subtitle}
    >
      {({ dictionary: d, session }) => {
        const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
        const isOwner = selectedRole?.key === "CENTER_OWNER";
        const canEdit = session.permissions.includes("permissions:update");

        const sectionLabel = (key: SectionKey): string => {
          if (key === "payments") return d.rolePermissions.paymentsSection;
          const navMap: Partial<Record<SectionKey, keyof typeof d.nav>> = {
            patients: "patients",
            staff: "staff",
            services: "services",
            appointments: "appointments",
            billing: "billing",
            reports: "reports",
            settings: "settings",
            permissions: "permissions",
          };
          const navKey = navMap[key];
          return navKey ? d.nav[navKey] : key;
        };

        const save = async () => {
          if (!selectedRoleId || isOwner || !canEdit) return;
          setSaveStatus("saving");
          try {
            await updateTenantRolePermissions(selectedRoleId, [...permissions]);
            setSaveStatus("saved");
          } catch {
            setSaveStatus("error");
          }
        };

        return (
          <div className="mt-5 space-y-5">
            {rolesStatus === "error" ? (
              <section className="rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5">
                <p className="text-sm font-semibold text-[#B42318]">
                  {d.rolePermissions.loadError}
                </p>
              </section>
            ) : rolesStatus === "loading" ? (
              <p className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                {d.dashboard.loading}
              </p>
            ) : (
              <>
                {/* ── Role selector ── */}
                <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#C8A45D]">
                    {d.staff.role}
                  </p>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                          selectedRoleId === role.id
                            ? "bg-[#0B2D5C] text-white"
                            : "border border-[#E5E7EB] bg-white text-[#40516a] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {d.roles[role.key as CenterRoleKey] ?? role.name}
                      </button>
                    ))}
                  </div>
                </section>

                {/* ── Owner lock notice ── */}
                {isOwner ? (
                  <section className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-4">
                    <p className="text-sm font-semibold text-[#1D4ED8]">
                      {d.rolePermissions.ownerProtected}
                    </p>
                    <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                      {SECTIONS.flatMap((s) => s.permissions).map((perm) => {
                        const dictKey = permKeyToDictKey[perm as keyof typeof permKeyToDictKey] as keyof typeof d.permissionLabels;
                        return (
                          <span
                            key={perm}
                            className="rounded-full border border-[#DBEAFE] bg-white px-3 py-1 text-xs font-semibold text-[#1D4ED8]"
                          >
                            {d.permissionLabels[dictKey]}
                          </span>
                        );
                      })}
                    </div>
                  </section>
                ) : selectedRole ? (
                  <>
                    {/* ── Permission checkboxes ── */}
                    {permsStatus === "loading" ? (
                      <p className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-sm font-semibold text-[#0B2D5C]">
                        {d.dashboard.loading}
                      </p>
                    ) : permsStatus === "error" ? (
                      <section className="rounded-lg border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-5">
                        <p className="text-sm font-semibold text-[#B42318]">
                          {d.rolePermissions.loadError}
                        </p>
                      </section>
                    ) : (
                      <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
                        <h3 className="mb-5 text-base font-semibold text-[#0B2D5C]">
                          {d.roles[selectedRole.key as CenterRoleKey] ?? selectedRole.name}
                        </h3>

                        <div className="space-y-6">
                          {SECTIONS.map((section) => {
                            const allChecked = section.permissions.every((p) =>
                              permissions.has(p),
                            );
                            const someChecked = section.permissions.some((p) =>
                              permissions.has(p),
                            );

                            return (
                              <div key={section.key}>
                                {/* Section header with select-all checkbox */}
                                <div className="mb-3 flex min-w-0 items-center gap-3">
                                  <input
                                    id={`section-${section.key}`}
                                    type="checkbox"
                                    checked={allChecked}
                                    ref={(el) => {
                                      if (el) {
                                        el.indeterminate = someChecked && !allChecked;
                                      }
                                    }}
                                    disabled={!canEdit}
                                    onChange={(e) =>
                                      toggleSection(section.permissions, e.target.checked)
                                    }
                                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#C8A45D] text-[#C8A45D] accent-[#C8A45D]"
                                  />
                                  <label
                                    htmlFor={`section-${section.key}`}
                                    className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-[#C8A45D]"
                                  >
                                    {sectionLabel(section.key)}
                                  </label>
                                </div>

                                {/* Permission checkboxes */}
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                  {section.permissions.map((perm) => {
                                    const dictKey = permKeyToDictKey[perm as keyof typeof permKeyToDictKey] as keyof typeof d.permissionLabels;
                                    const label = d.permissionLabels[dictKey];
                                    const checked = permissions.has(perm);

                                    return (
                                      <label
                                        key={perm}
                                        className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition ${
                                          checked
                                            ? "border-[#DBEAFE] bg-[#EFF6FF]"
                                            : "border-[#E5E7EB] bg-[#F8FAFC] hover:border-[#BFDBFE]"
                                        } ${!canEdit ? "cursor-not-allowed opacity-60" : ""}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          disabled={!canEdit}
                                          onChange={() => togglePermission(perm)}
                                          className="h-4 w-4 shrink-0 cursor-pointer rounded accent-[#1D4ED8]"
                                        />
                                        <span
                                          className={`min-w-0 break-words font-semibold ${
                                            checked ? "text-[#1D4ED8]" : "text-[#40516a]"
                                          }`}
                                        >
                                          {label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Save area */}
                        <div className="mt-6 flex min-w-0 flex-wrap items-center gap-3 border-t border-[#E5E7EB] pt-5">
                          {canEdit ? (
                            <button
                              type="button"
                              disabled={saveStatus === "saving"}
                              onClick={save}
                              className={buttonClassName("primary", "md")}
                            >
                              {saveStatus === "saving"
                                ? d.rolePermissions.saving
                                : d.rolePermissions.savePermissions}
                            </button>
                          ) : null}

                          {saveStatus === "saved" ? (
                            <p className="text-sm font-semibold text-emerald-700">
                              {d.rolePermissions.saved}
                            </p>
                          ) : null}

                          {saveStatus === "error" ? (
                            <p className="text-sm font-semibold text-[#B42318]">
                              {d.rolePermissions.loadError}
                            </p>
                          ) : null}
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <section className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-5">
                    <p className="text-sm text-[#66758a]">
                      {d.rolePermissions.selectRole}
                    </p>
                  </section>
                )}
              </>
            )}
          </div>
        );
      }}
    </CenterAdminShell>
  );
}
