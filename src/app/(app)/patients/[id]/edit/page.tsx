import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader/PageHeader";
import { PatientForm } from "@/components/PatientForm/PatientForm";
import { canEditPatients, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { Patient } from "@/types/patient";

import { updatePatient } from "../../actions";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!canEditPatients(profile?.role ?? null)) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single<Patient>();

  if (!patient) {
    notFound();
  }

  const action = updatePatient.bind(null, patient.id);

  return (
    <div>
      <PageHeader title={`Edit ${patient.patient_name ?? "Pasien"}`} backHref={`/patients/${patient.id}`} />
      <PatientForm action={action} initial={patient} />
    </div>
  );
}
