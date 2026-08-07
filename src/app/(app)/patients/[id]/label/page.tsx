import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";

import { PrintActions } from "@/components/PrintActions/PrintActions";
import { MealLabel } from "@/components/MealLabel/MealLabel";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { canPrintLabel, getCurrentProfile } from "@/libs/supabase/get-profile";
import { getLatestVerifier } from "@/libs/supabase/get-verifier";
import { createClient } from "@/libs/supabase/server";
import type { Patient } from "@/types/patient";
import { buildPatientQrValue } from "@/utils/patient-qr";

export default async function PatientLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!canPrintLabel(profile?.role ?? null)) {
    redirect("/patients");
  }

  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single<Patient>();
  if (!patient) {
    notFound();
  }

  const [qrDataUrl, verifiedBy] = await Promise.all([
    QRCode.toDataURL(buildPatientQrValue(patient.medical_record_number), { width: 160 }),
    getLatestVerifier(patient.id),
  ]);

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="Cetak Label" backHref={`/patients/${patient.id}`} />
      </div>

      <div className="mx-auto max-w-sm p-4">
        <MealLabel patient={patient} qrDataUrl={qrDataUrl} verifiedBy={verifiedBy} />
        <PrintActions cancelHref={`/patients/${patient.id}`} />
      </div>
    </div>
  );
}
