import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader/PageHeader";
import { PatientForm } from "@/components/PatientForm/PatientForm";
import { canEditPatients, getCurrentProfile } from "@/libs/supabase/get-profile";

import { createPatient } from "../actions";

export default async function NewPatientPage() {
  const profile = await getCurrentProfile();
  if (!canEditPatients(profile)) {
    redirect("/login");
  }

  return (
    <div>
      <PageHeader title="Tambah Pasien" backHref="/patients" />
      <PatientForm action={createPatient} />
    </div>
  );
}
