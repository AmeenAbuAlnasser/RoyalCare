import type { ReactNode } from "react";

type AdminStateTone = "neutral" | "error" | "success" | "warning";

const toneStyles: Record<AdminStateTone, string> = {
  neutral: "border-[#E5E7EB] bg-white text-[#0B2D5C]",
  error: "border-[#F3B8B8] bg-[#FFF7F7] text-[#B42318]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

const toneIcons: Record<AdminStateTone, string> = {
  neutral: "",
  error: "✕",
  success: "✓",
  warning: "⚠",
};

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 max-w-full rounded-xl border border-[#E5E7EB] bg-white shadow-[0_14px_34px_rgba(11,45,92,0.055)] transition-shadow duration-150 hover:shadow-[0_18px_42px_rgba(11,45,92,0.09)] ${className}`}
    >
      {children}
    </section>
  );
}

export function AdminState({
  action,
  body,
  className = "",
  loading = false,
  title,
  tone = "neutral",
}: {
  action?: ReactNode;
  body?: string;
  className?: string;
  loading?: boolean;
  title: string;
  tone?: AdminStateTone;
}) {
  const icon = !loading && tone !== "neutral" ? toneIcons[tone] : "";

  return (
    <div
      className={`flex min-h-36 min-w-0 flex-col items-center justify-center rounded-xl border px-5 py-8 text-center ${toneStyles[tone]} ${className}`}
    >
      {loading ? (
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-current border-t-transparent opacity-60" />
      ) : icon ? (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-current/25 bg-current/8 text-lg font-bold opacity-75">
          {icon}
        </span>
      ) : null}
      <p className="max-w-xl text-sm font-semibold leading-6">{title}</p>
      {body ? (
        <p className="mt-1 max-w-xl text-sm leading-6 opacity-70">{body}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function AdminSectionHeader({
  action,
  eyebrow,
  subtitle,
  title,
}: {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="break-words text-base font-semibold text-[#0B2D5C]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm leading-6 text-[#66758a]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
