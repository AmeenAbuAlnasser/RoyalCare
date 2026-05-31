"use client";

import { CenterAdminShell } from "../layout/CenterAdminShell";
import {
  getTenantCenterPublicProfile,
  updateTenantCenterPublicProfile,
  uploadTenantCenterPublicImage,
} from "@/lib/api/center-public-profile";
import { CenterPublicProfileSection } from "@/features/center-public-profile/CenterPublicProfileSection";

export function TenantSettingsPage() {
  return (
    <CenterAdminShell
      activeNav="settings"
      subtitle={(d) => d.nav.settings}
      title={(d) => d.nav.settings}
    >
      {() => (
        <div className="mt-5 min-w-0 space-y-5">
          <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <h3 className="text-sm font-semibold text-[#0B2D5C]">Public Profile</h3>
            </div>
            <div className="p-5">
              <CenterPublicProfileSection
                branding={null}
                onLoad={async () => {
                  const res = await getTenantCenterPublicProfile();
                  return res.branding ?? null;
                }}
                onSave={async (data) => {
                  await updateTenantCenterPublicProfile(data);
                }}
                onUploadImage={(file, type) => uploadTenantCenterPublicImage(file, type)}
              />
            </div>
          </section>
        </div>
      )}
    </CenterAdminShell>
  );
}
