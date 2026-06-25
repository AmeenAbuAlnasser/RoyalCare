"use client";

import { useEffect, useState } from "react";

type SelectedImage = {
  label: string;
  src: string;
  title: string;
};

export function BeforeAfterPair({
  afterImageUrl,
  afterLabel,
  beforeImageUrl,
  beforeLabel,
  className = "",
  enableLightbox = false,
  missingLabel = "No image",
  title,
}: {
  afterImageUrl?: string | null;
  afterLabel: string;
  beforeImageUrl?: string | null;
  beforeLabel: string;
  className?: string;
  enableLightbox?: boolean;
  missingLabel?: string;
  title: string;
}) {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedImage(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const renderImage = (
    imageUrl: string | null | undefined,
    label: string,
    tone: "before" | "after",
  ) => {
    const badgeClassName =
      tone === "after"
        ? "bg-emerald-600 text-white"
        : "bg-black/62 text-white";
    const canPreview = Boolean(enableLightbox && imageUrl);

    return (
      <figure className="min-w-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F8FAFC]">
        <button
          aria-label={`${title} - ${label}`}
          className={`group relative block aspect-[4/3] w-full overflow-hidden text-start ${
            canPreview ? "cursor-pointer" : "cursor-default"
          }`}
          disabled={!canPreview}
          onClick={() => {
            if (!canPreview || !imageUrl) return;
            setSelectedImage({ label, src: imageUrl, title });
          }}
          type="button"
        >
          {imageUrl ? (
            <img
              alt={`${title} - ${label}`}
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:opacity-95"
              decoding="async"
              loading="lazy"
              src={imageUrl}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-bold text-[#8A94A6]">
              {missingLabel}
            </span>
          )}
          <span className={`absolute top-3 rounded-full px-3 py-1 text-xs font-black shadow-sm ltr:left-3 rtl:right-3 ${badgeClassName}`}>
            {label}
          </span>
        </button>
      </figure>
    );
  };

  return (
    <>
      <div className={`grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}>
        {renderImage(beforeImageUrl, beforeLabel, "before")}
        {renderImage(afterImageUrl, afterLabel, "after")}
      </div>

      {selectedImage ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/82 p-3 sm:p-6"
          onClick={() => setSelectedImage(null)}
          role="dialog"
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Close"
              className="absolute end-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-black text-[#0B2D5C] shadow-lg transition hover:bg-white"
              onClick={() => setSelectedImage(null)}
              type="button"
            >
              x
            </button>
            <div className="relative max-h-[78vh] w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
              <img
                alt={`${selectedImage.title} - ${selectedImage.label}`}
                className="max-h-[78vh] w-full object-contain"
                decoding="async"
                src={selectedImage.src}
              />
              <span className="absolute top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-[#0B2D5C] shadow-sm ltr:left-3 rtl:right-3">
                {selectedImage.label}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-center text-sm font-bold leading-6 text-white">
              {selectedImage.title}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
