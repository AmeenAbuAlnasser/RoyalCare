"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { useLanguage } from "@/i18n/LanguageProvider";
import { centerAdminDictionaries } from "@/i18n/dictionaries/center-admin";
import type { SupportedLocale } from "@/i18n/locales";
import {
  deleteTenantGalleryImage,
  listTenantGallery,
  reorderTenantGalleryImages,
  TenantGalleryRequestError,
  uploadTenantGalleryImage,
  type TenantGalleryImage,
} from "@/lib/api/tenant-gallery";
import { CenterAdminShell } from "../layout/CenterAdminShell";

const galleryErrorCopy: Record<
  SupportedLocale,
  {
    permission: string;
    retry: string;
    session: string;
  }
> = {
  en: {
    permission: "You do not have permission to view the gallery.",
    retry: "Retry",
    session: "Your session has expired. Please log in again.",
  },
  ar: {
    permission: "ليست لديك صلاحية لعرض المعرض.",
    retry: "إعادة المحاولة",
    session: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  },
  he: {
    permission: "אין לך הרשאה לצפות בגלריה.",
    retry: "נסה שוב",
    session: "פג תוקף ההתחברות. התחברו שוב.",
  },
};

export function TenantGalleryPage() {
  const { locale } = useLanguage();
  const d = centerAdminDictionaries[locale as SupportedLocale];
  const g = d.gallery;

  const [images, setImages] = useState<TenantGalleryImage[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadGallery = useCallback((showLoading = true) => {
    if (showLoading) setLoadStatus("loading");
    setLoadError(null);
    return listTenantGallery()
      .then((res) => {
        setImages(res.items ?? []);
        setLoadStatus("ready");
      })
      .catch((err: unknown) => {
        console.error("[tenant-gallery] load error:", err);
        const extra = galleryErrorCopy[locale as SupportedLocale] ?? galleryErrorCopy.en;
        if (err instanceof TenantGalleryRequestError && err.status === 401) {
          setLoadError(extra.session);
        } else if (err instanceof TenantGalleryRequestError && err.status === 403) {
          setLoadError(extra.permission);
        } else {
          setLoadError(g.loadError);
        }
        setLoadStatus("error");
      });
  }, [g.loadError, locale]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadGallery(false);
    });
    return () => {
      active = false;
    };
  }, [loadGallery]);

  async function handleUpload(file: File) {
    if (images.length >= 20) {
      setUploadError(g.maxImages);
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const img = await uploadTenantGalleryImage(file);
      setImages((prev) => [...prev, img]);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : g.uploadError,
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteTenantGalleryImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newImages = [...images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);
    try {
      const res = await reorderTenantGalleryImages(newImages.map((img) => img.id));
      setImages(res.items);
    } catch {
      setImages(images);
    }
  }

  return (
    <CenterAdminShell
      activeNav="gallery"
      subtitle={(dict) => dict.gallery.subtitle}
      title={(dict) => dict.gallery.title}
    >
      {() => {
        if (loadStatus === "loading") {
          return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div className="aspect-square animate-pulse rounded-xl bg-[#E5E7EB]" key={i} />
              ))}
            </div>
          );
        }

        if (loadStatus === "error") {
          const extra = galleryErrorCopy[locale as SupportedLocale] ?? galleryErrorCopy.en;
          return (
            <div className="space-y-4">
              <AdminState
                body={loadError ?? g.loadError}
                title={g.loadError}
                tone="error"
              />
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-[#0B2D5C] bg-[#0B2D5C] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B2D5C]/90"
                onClick={() => void loadGallery()}
                type="button"
              >
                {extra.retry}
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#66758a]">{g.recommendedSize}</p>
                {images.length >= 20 && (
                  <p className="mt-0.5 text-xs font-semibold text-amber-600">{g.maxImages}</p>
                )}
              </div>
              <div>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="gallery-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file);
                  }}
                  ref={fileRef}
                  type="file"
                />
                <label
                  className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#0B2D5C] bg-[#0B2D5C] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B2D5C]/90 focus-within:ring-2 focus-within:ring-[#0B2D5C]/25 ${uploading || images.length >= 20 ? "cursor-not-allowed opacity-50" : ""}`}
                  htmlFor={uploading || images.length >= 20 ? undefined : "gallery-upload"}
                >
                  {uploading ? (
                    <>
                      <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M4 12a8 8 0 018-8" />
                      </svg>
                      {g.uploadingText}
                    </>
                  ) : (
                    <>
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {g.uploadButton}
                    </>
                  )}
                </label>
              </div>
            </div>

            {uploadError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {uploadError}
              </p>
            )}

            {images.length === 0 ? (
              <AdminState body={g.emptyBody} className="border-dashed" title={g.emptyTitle} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img, index) => (
                  <div
                    className="group relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm"
                    key={img.id}
                  >
                    <div className="aspect-square">
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={img.imageUrl}
                      />
                    </div>
                    {/* Overlay controls */}
                    <div className="absolute inset-0 flex flex-col items-end justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={deletingId === img.id}
                        onClick={() => void handleDelete(img.id)}
                        title={g.deleteButton}
                        type="button"
                      >
                        {deletingId === img.id ? (
                          <svg aria-hidden="true" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M4 12a8 8 0 018-8" />
                          </svg>
                        ) : (
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#0B2D5C] shadow hover:bg-white disabled:opacity-30"
                          disabled={index === 0}
                          onClick={() => void handleMove(index, "up")}
                          title={g.moveUp}
                          type="button"
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#0B2D5C] shadow hover:bg-white disabled:opacity-30"
                          disabled={index === images.length - 1}
                          onClick={() => void handleMove(index, "down")}
                          title={g.moveDown}
                          type="button"
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Sort order badge */}
                    <div className="absolute start-2 top-2">
                      <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </CenterAdminShell>
  );
}
