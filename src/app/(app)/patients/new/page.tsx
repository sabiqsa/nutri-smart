import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader/PageHeader";
import { PatientForm } from "@/components/PatientForm/PatientForm";
import { canEditPatients, getCurrentProfile } from "@/libs/supabase/get-profile";
import { getDataCutoffTimes } from "@/libs/meal-cutoff/get-data-cutoff-times";

import { createPatient } from "../actions";

export default async function NewPatientPage() {
  const profile = await getCurrentProfile();
  if (!canEditPatients(profile?.role ?? null)) {
    redirect("/login");
  }

  const cutoffTimes = await getDataCutoffTimes();

  return (
    <div>
      <PageHeader title="Tambah Pasien" backHref="/patients" />
      <PatientForm action={createPatient} cutoffTimes={cutoffTimes} />
    </div>
  );
}
