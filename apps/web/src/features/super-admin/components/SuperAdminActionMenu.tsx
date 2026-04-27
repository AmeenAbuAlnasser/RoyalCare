"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type SuperAdminActionIcon =
  | "activate"
  | "archive"
  | "delete"
  | "duplicate"
  | "edit"
  | "invoice"
  | "key"
  | "read"
  | "refresh"
  | "renew"
  | "suspend"
  | "upgrade"
  | "verify"
  | "view";

export type SuperAdminActionMenuItem = {
  href?: string;
  icon: SuperAdminActionIcon;
  label: string;
  tone?: "default" | "danger" | "warning" | "success";
};

function ActionIcon({ icon }: { icon: SuperAdminActionIcon }) {
  const common = {
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.9,
    viewBox: "0 0 24 24",
  };

  const paths: Record<SuperAdminActionIcon, ReactNode> = {
    activate: <path d="m5 12 4 4L19 6" />,
    archive: (
      <>
        <path d="M4 7h16" />
        <path d="M5 7l1 13h12l1-13" />
        <path d="M9 11h6" />
        <path d="M7 3h10l2 4H5Z" />
      </>
    ),
    delete: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </>
    ),
    duplicate: (
      <>
        <rect height="10" rx="2" width="10" x="8" y="8" />
        <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    invoice: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="m11 12 8-8" />
        <path d="m15 4 2 2" />
        <path d="m13 6 2 2" />
      </>
    ),
    read: (
      <>
        <path d="M4 5h16v14H4Z" />
        <path d="m4 7 8 6 8-6" />
        <path d="m8 13 2 2 5-5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.4-4.8L4 8" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14.4 4.8L20 16" />
        <path d="M16 16h4v4" />
      </>
    ),
    renew: (
      <>
        <path d="M17 2v5h-5" />
        <path d="M7 22v-5h5" />
        <path d="M19 12a7 7 0 0 0-12-5l-2 2" />
        <path d="M5 12a7 7 0 0 0 12 5l2-2" />
      </>
    ),
    suspend: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </>
    ),
    upgrade: (
      <>
        <path d="m12 5 6 6" />
        <path d="m12 5-6 6" />
        <path d="M12 5v14" />
      </>
    ),
    verify: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    view: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  };

  return <svg aria-hidden="true" {...common}>{paths[icon]}</svg>;
}

function MoreVerticalIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <circle cx="10" cy="4" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="10" cy="16" r="1.6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function itemClassName(
  tone: SuperAdminActionMenuItem["tone"] = "default",
  size: "desktop" | "mobile" = "desktop",
) {
  const tones = {
    danger: "text-[#B42318] hover:bg-rose-50 hover:text-[#912018]",
    default: "text-[#24364f] hover:bg-[#F8FAFC] hover:text-[#0B2D5C]",
    success: "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800",
    warning: "text-[#7A5C20] hover:bg-[#C8A45D]/12 hover:text-[#0B2D5C]",
  };

  return [
    "flex w-full items-center gap-3 rounded-md text-start font-semibold",
    size === "mobile" ? "min-h-12 px-3.5 py-3 text-base" : "min-h-9 px-3 py-2 text-sm",
    "outline-none transition focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#0B2D5C]/12",
    tones[tone],
  ].join(" ");
}

function MenuItem({
  item,
  onClose,
  size = "desktop",
}: {
  item: SuperAdminActionMenuItem;
  onClose?: () => void;
  size?: "desktop" | "mobile";
}) {
  const content = (
    <>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#F8FAFC] text-current">
        <ActionIcon icon={item.icon} />
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
    </>
  );
  const className = itemClassName(item.tone, size);

  if (item.href) {
    return (
      <Link
        className={className}
        href={item.href}
        onClick={onClose}
        role="menuitem"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={className}
      onClick={onClose}
      role="menuitem"
      type="button"
    >
      {content}
    </button>
  );
}

function MenuItems({
  items,
  onClose,
  size,
}: {
  items: SuperAdminActionMenuItem[];
  onClose?: () => void;
  size: "desktop" | "mobile";
}) {
  return (
    <>
      {items.map((item, index) => (
        <div
          className={item.tone === "danger" && index > 0 ? "mt-1 border-t border-rose-100 pt-1" : ""}
          key={`${item.label}-${item.href ?? item.icon}-${index}`}
        >
          <MenuItem item={item} onClose={onClose} size={size} />
        </div>
      ))}
    </>
  );
}

export function SuperAdminActionMenu({
  isOpen,
  items,
  onClose,
  onToggle,
  triggerLabel,
}: {
  isOpen: boolean;
  items: SuperAdminActionMenuItem[];
  onClose?: () => void;
  onToggle: () => void;
  triggerLabel: string;
}) {
  return (
    <div className="relative inline-flex justify-end">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={triggerLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#526176] shadow-sm transition hover:border-[#C8A45D]/65 hover:bg-[#F8FAFC] hover:text-[#0B2D5C] focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/12"
        onClick={onToggle}
        type="button"
      >
        <MoreVerticalIcon />
      </button>

      {isOpen ? (
        <>
          <div
            className="absolute end-0 top-10 z-30 hidden w-56 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-[0_18px_45px_rgba(11,45,92,0.16)] md:block"
            role="menu"
          >
            <MenuItems items={items} onClose={onClose} size="desktop" />
          </div>

          <div className="fixed inset-0 z-50 md:hidden" role="presentation">
            <button
              aria-label={triggerLabel}
              className="absolute inset-0 h-full w-full bg-[#071B35]/45"
              onClick={onClose}
              type="button"
            />
            <div
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border border-[#E5E7EB] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_50px_rgba(11,45,92,0.22)]"
              role="menu"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#CBD5E1]" />
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#0B2D5C]">{triggerLabel}</p>
              <button
                aria-label={triggerLabel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#F8FAFC] text-[#526176] transition hover:border-[#C8A45D]/65 hover:text-[#0B2D5C] focus:outline-none focus:ring-3 focus:ring-[#0B2D5C]/12"
                onClick={onClose}
                type="button"
              >
                <CloseIcon />
              </button>
              </div>
              <div className="grid gap-1.5">
                <MenuItems items={items} onClose={onClose} size="mobile" />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
