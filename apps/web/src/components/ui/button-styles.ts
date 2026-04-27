type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "warning"
  | "success"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center rounded-md border font-semibold leading-5 transition focus:outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-[#0B2D5C] bg-[#0B2D5C] text-white hover:border-[#123B72] hover:bg-[#123B72] focus:ring-[#0B2D5C]/20",
  secondary:
    "border-[#E5E7EB] bg-white text-[#0B2D5C] hover:border-[#C8A45D]/65 hover:bg-[#F8FAFC] hover:text-[#0B2D5C] focus:ring-[#0B2D5C]/12",
  danger:
    "border-[#B42318] bg-[#B42318] text-white hover:border-[#912018] hover:bg-[#912018] focus:ring-[#B42318]/20",
  warning:
    "border-[#C8A45D] bg-[#C8A45D] text-[#0B2D5C] hover:border-[#B3914E] hover:bg-[#B3914E] focus:ring-[#C8A45D]/25",
  success:
    "border-emerald-700 bg-emerald-700 text-white hover:border-emerald-800 hover:bg-emerald-800 focus:ring-emerald-700/20",
  ghost:
    "border-transparent bg-transparent text-[#0B2D5C] hover:border-[#C8A45D]/45 hover:bg-[#C8A45D]/10 hover:text-[#0B2D5C] focus:ring-[#C8A45D]/20",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-5 py-2.5 text-sm",
  icon: "h-10 w-10 p-0 text-sm",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
) {
  return [base, variants[variant], sizes[size], className]
    .filter(Boolean)
    .join(" ");
}

export function primaryButtonClassName(className = "", size: ButtonSize = "md") {
  return buttonClassName("primary", size, className);
}
