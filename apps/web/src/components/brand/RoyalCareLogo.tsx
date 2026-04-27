import Image from "next/image";
import { royalCareBrand } from "@/config/brand";

type RoyalCareLogoProps = {
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
};

export function RoyalCareLogo({
  variant = "full",
  className = "",
  priority = false,
}: RoyalCareLogoProps) {
  const isFull = variant === "full";

  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      aria-label="RoyalCare"
    >
      <Image
        alt="RoyalCare"
        className={
          isFull
            ? "absolute left-1/2 top-1/2 h-auto w-[170%] max-w-none -translate-x-1/2 -translate-y-[45%]"
            : "absolute left-1/2 top-1/2 h-auto w-[165%] max-w-none -translate-x-1/2 -translate-y-[42%]"
        }
        height={2048}
        priority={priority}
        src={isFull ? royalCareBrand.logo.full : royalCareBrand.logo.mark}
        width={2048}
      />
    </span>
  );
}
