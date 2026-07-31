import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { Badge } from "@/components/Badge/Badge";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { canEditPatients, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { PatientWithDelivery } from "@/types/patient";
import { buildPatientQrValue } from "@/utils/patient-qr";

const STATUS_LABEL = {
  pending: "Pending",
  ready: "Ready",
  delivered: "Delivered",
} as const;

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: patient } = await supabase
    .from("patients")
    .select("*, meal_deliveries(*)")
    .eq("id", id)
    .single<PatientWithDelivery>();

  if (!patient) {
    notFound();
  }

  const status = patient.meal_deliveries[0]?.status ?? "pending";
  const canEdit = canEditPatients(profile);
  const qrDataUrl = canEdit
    ? await QRCode.toDataURL(buildPatientQrValue(patient.medical_record_number), { width: 200 })
    : null;

  return (
    <div>
      <PageHeader title={patient.patient_name ?? "(tanpa nama)"} backHref="/patients" />

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Badge variant={status}>{STATUS_LABEL[status]}</Badge>
          {canEdit ? (
            <Link
              href={`/patients/${patient.id}/edit`}
              className="text-sm font-medium text-primary"
            >
              Edit
            </Link>
          ) : null}
        </div>

        {qrDataUrl ? (
          <div className="rounded-card flex flex-col items-center gap-2 border border-outline-variant bg-surface-container-lowest p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, next/image can't optimize it */}
            <img src={qrDataUrl} alt={`QR code untuk RM ${patient.medical_record_number}`} width={200} height={200} />
            <p className="text-xs text-on-surface-variant">Tempel di gelang/label pasien buat scan distribusi.</p>
          </div>
        ) : null}

        <Field label="Ruangan / Bed" value={`${patient.room} / ${patient.bed ?? "-"}`} />
        <Field label="No. RM" value={patient.medical_record_number} />
        <Field label="Tanggal Lahir" value={patient.date_of_birth ?? "-"} />
        <Field label="Diet" value={patient.diet_type ?? "-"} />
        <Field label="Diet Khusus" value={patient.special_diet ?? "-"} />
        <Field label="Bentuk Makanan" value={patient.food_form ?? "-"} />
        <Field label="Detail Bentuk Makanan" value={patient.food_form_detail ?? "-"} />
        <Field label="Alergi" value={patient.allergies ?? "-"} highlight={!!patient.allergies} />
        <Field label="Pantangan Makanan" value={patient.food_restrictions ?? "-"} />
        <Field label="Keterangan" value={patient.notes ?? "-"} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-3">
      <div className="text-xs text-on-surface-variant">{label}</div>
      <div className={highlight ? "font-medium text-error" : "font-medium"}>{value}</div>
    </div>
  );
}
