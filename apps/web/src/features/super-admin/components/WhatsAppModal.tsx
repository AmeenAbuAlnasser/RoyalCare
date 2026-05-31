"use client";

import { useEffect, useRef, useState } from "react";
import { extractLocalNumber } from "@/lib/whatsapp";

export type WhatsAppModalLabels = {
  cancel: string;
  copiedHint: string;
  copyButton: string;
  logged?: string;
  messageLabel: string;
  modalTitle: string;
  noPhone: string;
  openButton970: string;
  openButton972: string;
  phoneLabel: string;
  tryBothHint?: string;
};

type WhatsAppModalProps = {
  centerName: string;
  defaultMessage: string;
  direction: "ltr" | "rtl";
  labels: WhatsAppModalLabels;
  onClose: () => void;
  onLog?: (
    action: "OPENED_WHATSAPP" | "COPIED_MESSAGE",
    phone: string,
    message: string,
  ) => Promise<void>;
  phone: string | null;
};

function WhatsAppSvg({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
      viewBox="0 0 24 24"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function WhatsAppModal({
  centerName,
  defaultMessage,
  direction,
  labels,
  onClose,
  onLog,
  phone,
}: WhatsAppModalProps) {
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);
  const [logStatus, setLogStatus] = useState<"idle" | "logged">("idle");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const localNumber = phone ? extractLocalNumber(phone) : "";
  const hasValidPhone = localNumber.length >= 7 && localNumber.length <= 10;

  function fireLog(
    action: "OPENED_WHATSAPP" | "COPIED_MESSAGE",
    finalPhone?: string,
  ) {
    if (!onLog || !phone) return;
    void onLog(action, finalPhone ?? phone, message)
      .then(() => {
        setLogStatus("logged");
        setTimeout(() => setLogStatus("idle"), 3000);
      })
      .catch(() => undefined);
  }

  function handleCopy() {
    navigator.clipboard.writeText(message).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        fireLog("COPIED_MESSAGE");
      },
      () => undefined,
    );
  }

  function handleOpenWhatsApp(prefix: "970" | "972") {
    if (!hasValidPhone || !message.trim()) return;
    const fullNumber = prefix + localNumber;
    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    fireLog("OPENED_WHATSAPP", fullNumber);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      dir={direction}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      ref={overlayRef}
    >
      <div className="w-full max-w-lg rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#1a9e50]">
              <WhatsAppSvg />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#0B2D5C]">
                {labels.modalTitle}
              </h2>
              <p className="text-xs text-[#66758a]">{centerName}</p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#66758a] transition hover:bg-[#F1F5F9] hover:text-[#0B2D5C]"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Phone */}
          <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
            <p className="text-xs font-medium text-[#66758a]">
              {labels.phoneLabel}
            </p>
            {phone ? (
              <p className="mt-1 text-sm font-semibold text-[#0B2D5C]" dir="ltr">
                {phone}
              </p>
            ) : (
              <p className="mt-1 text-sm font-semibold text-amber-700">
                {labels.noPhone}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[#24364f]">
              {labels.messageLabel}
            </label>
            <textarea
              className="mt-1.5 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm leading-6 text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/12"
              dir="auto"
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              value={message}
            />
          </div>

          {/* Dual-prefix hint */}
          {phone && labels.tryBothHint && (
            <p className="text-xs text-[#66758a]">{labels.tryBothHint}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-[#E5E7EB] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          {/* WhatsApp send buttons — primary, ordered first on mobile */}
          <div className="order-1 flex flex-col gap-2 sm:order-2 sm:flex-row">
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:bg-[#1aab54] disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-auto"
              disabled={!hasValidPhone || !message.trim()}
              onClick={() => handleOpenWhatsApp("970")}
              type="button"
            >
              <WhatsAppSvg className="h-4 w-4 shrink-0" />
              {labels.openButton970}
            </button>
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#128C7E] px-4 text-sm font-semibold text-white transition hover:bg-[#0e6b60] disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-auto"
              disabled={!hasValidPhone || !message.trim()}
              onClick={() => handleOpenWhatsApp("972")}
              type="button"
            >
              <WhatsAppSvg className="h-4 w-4 shrink-0" />
              {labels.openButton972}
            </button>
          </div>

          {/* Secondary actions — copy + cancel, ordered second on mobile */}
          <div className="order-2 flex flex-col gap-2 sm:order-1 sm:flex-row sm:items-center">
            <button
              className="h-11 w-full rounded-md border border-[#E5E7EB] px-4 text-sm font-medium text-[#526176] transition hover:bg-[#F1F5F9] sm:h-9 sm:w-auto"
              onClick={handleCopy}
              type="button"
            >
              {copied ? labels.copiedHint : labels.copyButton}
            </button>
            <button
              className="h-11 w-full rounded-md border border-[#E5E7EB] px-4 text-sm font-medium text-[#526176] transition hover:bg-[#F1F5F9] sm:h-9 sm:w-auto"
              onClick={onClose}
              type="button"
            >
              {labels.cancel}
            </button>
            {logStatus === "logged" && labels.logged && (
              <span className="text-center text-xs font-medium text-emerald-600 sm:text-start">
                {labels.logged}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
