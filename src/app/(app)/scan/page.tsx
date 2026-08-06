import { redirect } from "next/navigation";

import { ScanView } from "@/components/ScanView/ScanView";
import { canScanDistribution, getCurrentProfile } from "@/libs/supabase/get-profile";

export default async function ScanPage() {
  const profile = await getCurrentProfile();
  if (!canScanDistribution(profile?.role ?? null)) {
    // Only Bagian Distribusi (+ Admin) does scan/confirm delivery per spec.
    redirect("/patients");
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScanView />
    </div>
  );
}
