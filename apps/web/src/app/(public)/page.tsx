import { CentersDirectoryPage } from "@/features/public/centers/CentersDirectoryPage";
import { LandingTracker } from "@/components/marketing/LandingTracker";

export default function LandingRoute() {
  return (
    <>
      <LandingTracker />
      <CentersDirectoryPage />
    </>
  );
}
