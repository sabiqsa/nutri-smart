import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { MealLabel } from "@/components/MealLabel/MealLabel";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { PrintActions } from "@/components/PrintActions/PrintActions";
import { RoomPicker } from "@/components/RoomPicker/RoomPicker";
import { canPrintLabel, getCurrentProfile } from "@/libs/supabase/get-profile";
import { getLatestVerifier } from "@/libs/supabase/get-verifier";
import { createClient } from "@/libs/supabase/server";
import type { Patient } from "@/types/patient";
import { buildPatientQrValue } from "@/utils/patient-qr";

export default async function PrintLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!canPrintLabel(profile?.role ?? null)) {
    redirect("/patients");
  }

  const { room } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("patients").select("*").order("bed");
  if (room) query = query.eq("room", room);
  const { data: patients } = await query.returns<Patient[]>();

  const labels = await Promise.all(
    (patients ?? []).map(async (patient) => ({
      patient,
      qrDataUrl: await QRCode.toDataURL(buildPatientQrValue(patient.medical_record_number), { width: 160 }),
      verifiedBy: await getLatestVerifier(patient.id),
    })),
  );

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="Cetak Label Massal" backHref="/patients" />
      </div>

      <div className="p-4 print:p-0">
        <div className="mb-4 print:hidden">
          <RoomPicker value={room ?? ""} />
        </div>

        {!room ? (
          <p className="text-sm text-on-surface-variant print:hidden">
            Pilih ruangan dulu buat nampilin label yang mau dicetak.
          </p>
        ) : labels.length === 0 ? (
          <p className="text-sm text-on-surface-variant print:hidden">Gak ada pasien di ruangan ini.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
              {labels.map(({ patient, qrDataUrl, verifiedBy }) => (
                <MealLabel key={patient.id} patient={patient} qrDataUrl={qrDataUrl} verifiedBy={verifiedBy} />
              ))}
            </div>
            <PrintActions cancelHref="/patients" />
          </>
        )}
      </div>
    </div>
  );
}
