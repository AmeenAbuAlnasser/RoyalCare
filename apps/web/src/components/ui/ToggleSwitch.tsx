"use client";

type ToggleSwitchProps = {
  checked: boolean;
  className?: string;
  label: string;
  offLabel: string;
  onChange: (checked: boolean) => void;
  onLabel: string;
};

export function ToggleSwitch({
  checked,
  className = "",
  label,
  offLabel,
  onChange,
  onLabel,
}: ToggleSwitchProps) {
  const statusLabel = checked ? onLabel : offLabel;

  return (
    <label
      className={[
        "inline-flex min-w-0 cursor-pointer items-center gap-3 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#24364f] transition hover:border-[#C8A45D]/70 hover:bg-[#F8FAFC]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-[#0B2D5C]/20 ${
          checked ? "bg-[#0B2D5C]" : "bg-[#D1D5DB]"
        }`}
      >
        <span
          className={`absolute top-1/2 left-1 h-4 w-4 -translate-y-1/2 rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-5 bg-[#C8A45D]" : "bg-white"
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{label}</span>
        <span className="block text-xs font-medium text-[#66758a]">
          {statusLabel}
        </span>
      </span>
    </label>
  );
}
