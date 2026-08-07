import Link from "next/link";

import { PatientListView } from "@/components/PatientListView/PatientListView";
import { canEditPatients, canPrintLabel, canScanDistribution, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { PatientWithDelivery } from "@/types/patient";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ special_request?: string }>;
}) {
  const { special_request: specialRequestOnly } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  let query = supabase
    .from("patients")
    .select("*, meal_deliveries(*)")
    .order("room")
    .order("patient_name");
  if (specialRequestOnly === "true") {
    query = query.eq("is_special_request", true);
  }

  const { data: patients } = await query.returns<PatientWithDelivery[]>();

  return (
    <div className="p-4">
      {specialRequestOnly === "true" ? (
        <div className="mb-3 rounded-card bg-error-container/30 px-3 py-2 text-sm text-error">
          Nampilin pasien dengan Permintaan Khusus doang.{" "}
          <Link href="/patients" className="font-medium underline">
            Reset
          </Link>
        </div>
      ) : null}

      {canEditPatients(profile?.role ?? null) || canPrintLabel(profile?.role ?? null) ? (
        <div className="mb-3 flex justify-end gap-2">
          {canPrintLabel(profile?.role ?? null) ? (
            <Link
              href="/patients/print-labels"
              className="rounded-full border border-outline-variant px-3 py-1.5 text-sm font-medium text-on-surface-variant"
            >
              Cetak Label Massal
            </Link>
          ) : null}
          {canEditPatients(profile?.role ?? null) ? (
            <Link
              href="/patients/new"
              className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-on-primary"
            >
              + Tambah Pasien
            </Link>
          ) : null}
        </div>
      ) : null}

      <PatientListView patients={patients ?? []} canScan={canScanDistribution(profile?.role ?? null)} />
    </div>
  );
}
