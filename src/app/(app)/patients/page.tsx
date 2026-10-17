import Link from "next/link";

import { Icon } from "@/components/Icon/Icon";
import { PatientListView } from "@/components/PatientListView/PatientListView";
import { Button } from "@/components/ui/button";
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
  const role = profile?.role ?? null;

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Daftar Pasien</h1>
        {canEditPatients(role) || canPrintLabel(role) ? (
          <div className="flex gap-2">
            {canPrintLabel(role) ? (
              <Button asChild variant="outline" className="gap-1.5">
                <Link href="/patients/print-labels">
                  <Icon name="print" size={18} />
                  Cetak Label Massal
                </Link>
              </Button>
            ) : null}
            {canEditPatients(role) ? (
              <Button asChild className="gap-1.5">
                <Link href="/patients/new">
                  <Icon name="add" size={18} />
                  Tambah Pasien
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {specialRequestOnly === "true" ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-error/30 bg-error-container/40 px-4 py-2.5 text-sm text-on-error-container">
          <span className="flex items-center gap-2">
            <Icon name="priority_high" size={18} className="text-error" />
            Nampilin pasien dengan Permintaan Khusus doang.
          </span>
          <Link href="/patients" className="shrink-0 font-semibold underline-offset-4 hover:underline">
            Reset
          </Link>
        </div>
      ) : null}

      <PatientListView patients={patients ?? []} canScan={canScanDistribution(role)} />
    </div>
  );
}
