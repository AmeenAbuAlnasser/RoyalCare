"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { royalCareBrand } from "@/config/brand";

export type BrandLogoVariant = "public" | "admin" | "compact";

type BrandLogoProps = {
  imageUrl?: string | null;
  siteName?: string;
  className?: string;
  textClassName?: string;
  imageClassName?: string;
  dark?: boolean;
  showText?: boolean;
  variant?: BrandLogoVariant;
};

// Static brand asset used as the fallback — never shows text initials for the platform logo
const BRAND_MARK_SRC = royalCareBrand.logo.mark;

const VARIANT_SIZE: Record<BrandLogoVariant, string> = {
  public: "h-9 w-auto max-w-[150px]",
  admin: "h-9 w-9",
  compact: "h-8 w-8",
};

export function BrandLogo({
  imageUrl,
  siteName = "RoyalCare",
  className = "",
  textClassName = "",
  imageClassName = "",
  dark = false,
  showText = true,
  variant = "public",
}: BrandLogoProps) {
  const primarySrc = imageUrl?.trim() ?? "";

  // Track which URLs have errored so we can cascade: custom URL → brand mark → nothing
  const [errorSrcs, setErrorSrcs] = useState<ReadonlySet<string>>(new Set());
  const [loadedSrc, setLoadedSrc] = useState("");

  // If primary URL is absent or has failed, fall back to the brand mark asset
  const activeSrc =
    !primarySrc || errorSrcs.has(primarySrc) ? BRAND_MARK_SRC : primarySrc;

  // Stop rendering an image only when the brand mark itself also fails
  const showImage = !errorSrcs.has(BRAND_MARK_SRC);

  const isLoading = showImage && loadedSrc !== activeSrc;

  function handleError() {
    setErrorSrcs((prev) => new Set([...prev, activeSrc]));
  }

  function handleLoad() {
    setLoadedSrc(activeSrc);
  }

  return (
    <span
      className={`inline-flex min-w-0 max-w-full shrink-0 items-center gap-2.5 whitespace-nowrap ${className}`}
    >
      <span
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ${VARIANT_SIZE[variant]} ${imageClassName}`}
      >
        {showImage ? (
          <>
            {isLoading && (
              <span className="absolute inset-0 animate-pulse rounded-lg bg-[#E5E7EB]" />
            )}
            <img
              alt={siteName}
              className="relative h-full w-auto max-w-full object-contain"
              onError={handleError}
              onLoad={handleLoad}
              src={activeSrc}
            />
          </>
        ) : null}
      </span>
      {showText && (
        <span
          className={`min-w-0 truncate font-black leading-none ${
            dark ? "text-white" : "text-[#0B2D5C]"
          } ${textClassName}`}
        >
          {siteName}
        </span>
      )}
    </span>
  );
}
