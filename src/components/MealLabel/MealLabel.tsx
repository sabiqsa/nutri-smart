import type { Patient } from "@/types/patient";

type MealLabelProps = {
  patient: Patient;
  qrDataUrl: string;
  verifiedBy: string | null;
};

export function MealLabel({ patient, qrDataUrl, verifiedBy }: MealLabelProps) {
  const hasAllergy = patient.allergies.length > 0;

  return (
    <div className="rounded-card break-inside-avoid border-2 border-on-surface bg-surface-container-lowest p-4 print:break-inside-avoid">
      <div className="mb-2 flex items-center justify-between border-b border-outline-variant pb-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Dietary Service</p>
          <p className="text-sm font-bold">Patient Meal Label</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL */}
        <img src={qrDataUrl} alt={`QR ${patient.medical_record_number}`} width={64} height={64} />
      </div>

      <div className="space-y-1 text-sm">
        <Row label="Nama" value={patient.patient_name ?? "-"} bold />
        <Row label="No. RM" value={patient.medical_record_number} />
        <Row label="Tgl Lahir" value={patient.date_of_birth ?? "-"} />
        <Row label="Ruangan / Bed" value={`${patient.room} / ${patient.bed ?? "-"}`} />
        <Row label="Diet" value={patient.diet_type ?? "-"} />
        {patient.special_diet && patient.special_diet.length > 0 ? (
          <Row label="Diet Khusus" value={patient.special_diet.join(", ")} />
        ) : null}
        <Row label="Bentuk Makanan" value={patient.food_form ?? "-"} />
      </div>

      {hasAllergy ? (
        <div className="mt-2 rounded border-2 border-error bg-error-container px-2 py-1">
          <p className="text-xs font-bold text-on-error-container uppercase">
            ⚠ Alergi: {patient.allergies.map((a) => a.type).join(", ")}
          </p>
        </div>
      ) : null}

      <p className="mt-2 border-t border-outline-variant pt-2 text-xs text-on-surface-variant">
        Diverifikasi oleh: {verifiedBy ?? "-"}
      </p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-on-surface-variant">{label}</span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}
