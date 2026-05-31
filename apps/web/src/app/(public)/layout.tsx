import type { ReactNode } from "react";
import { PlatformMarketingInjector } from "@/components/marketing/PlatformMarketingInjector";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PlatformMarketingInjector />
      {children}
    </>
  );
}
