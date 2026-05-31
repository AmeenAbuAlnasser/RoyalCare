"use client";

import { useEffect } from "react";
import { trackPlatformEvent } from "@/lib/marketing/platform-track";

export function LandingTracker() {
  useEffect(() => {
    trackPlatformEvent("ViewLanding");
  }, []);
  return null;
}
