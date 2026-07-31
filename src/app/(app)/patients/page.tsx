import Link from "next/link";

import { PatientListView } from "@/components/PatientListView/PatientListView";
import { canEditPatients, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { PatientWithDelivery } from "@/types/patient";

export default async function PatientsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: patients } = await supabase
    .from("patients")
    .select("*, meal_deliveries(*)")
    .order("room")
    .order("patient_name")
    .returns<PatientWithDelivery[]>();

  return (
    <div className="p-4">
      {canEditPatients(profile) ? (
        <div className="mb-3 flex justify-end">
          <Link
            href="/patients/new"
            className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-on-primary"
          >
            + Tambah Pasien
          </Link>
        </div>
      ) : null}

      <PatientListView patients={patients ?? []} />
    </div>
  );
}
