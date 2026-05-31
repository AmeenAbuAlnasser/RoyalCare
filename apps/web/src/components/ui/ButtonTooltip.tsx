"use client";

import { useRef, useState } from "react";

type ButtonTooltipProps = {
  children: React.ReactNode;
  text: string;
};

export function ButtonTooltip({ children, text }: ButtonTooltipProps) {
  const [visible, setVisible] = useState(false);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const handleTouchStart = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    setVisible(true);
    touchTimerRef.current = setTimeout(() => setVisible(false), 3500);
  };

  return (
    <div
      className="relative inline-flex"
      onBlur={hide}
      onFocus={show}
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={handleTouchStart}
    >
      {children}
      {visible ? (
        <div
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md bg-[#0B2D5C] px-3 py-2 text-xs leading-5 text-white shadow-lg"
          role="tooltip"
        >
          {text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-[#0B2D5C]" />
        </div>
      ) : null}
    </div>
  );
}
