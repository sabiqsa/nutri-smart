import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { Badge } from "@/components/Badge/Badge";
import { MarkNotDistributedForm } from "@/components/MarkNotDistributedForm/MarkNotDistributedForm";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { APP_TIMEZONE } from "@/config/meal-cutoff";
import { canEditPatients, canViewDietHistory, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { PatientWithDelivery } from "@/types/patient";
import { buildPatientQrValue } from "@/utils/patient-qr";
import { canPrintLabel, canScanDistribution } from "@/utils/roles";

import { markNotDistributed } from "../delivery-actions";

const STATUS_LABEL = {
  pending: "Pending",
  ready: "Ready",
  delivered: "Delivered",
  not_distributed: "Tidak Dibagikan",
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
  const canEdit = canEditPatients(profile?.role ?? null);
  const canSeeHistory = canViewDietHistory(profile?.role ?? null);
  const qrDataUrl = canEdit
    ? await QRCode.toDataURL(buildPatientQrValue(patient.medical_record_number), { width: 200 })
    : null;

  const { data: history } = canSeeHistory
    ? await supabase
        .from("diet_history")
        .select("id, summary, changed_by_role, created_at")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: null };

  return (
    <div>
      <PageHeader title={patient.patient_name ?? "(tanpa nama)"} backHref="/patients" />

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Badge variant={status}>{STATUS_LABEL[status]}</Badge>
          <div className="flex gap-3">
            {canPrintLabel(profile?.role ?? null) ? (
              <Link href={`/patients/${patient.id}/label`} className="text-sm font-medium text-primary">
                Cetak Label
              </Link>
            ) : null}
            {canEdit ? (
              <Link
                href={`/patients/${patient.id}/edit`}
                className="text-sm font-medium text-primary"
              >
                Edit
              </Link>
            ) : null}
          </div>
        </div>

        {canScanDistribution(profile?.role ?? null) &&
        patient.meal_deliveries[0] &&
        status !== "not_distributed" &&
        status !== "delivered" ? (
          <MarkNotDistributedForm
            action={markNotDistributed.bind(null, patient.meal_deliveries[0].id, patient.id)}
          />
        ) : null}

        {qrDataUrl ? (
          <div className="rounded-card flex flex-col items-center gap-2 border border-outline-variant bg-surface-container-lowest p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, next/image can't optimize it */}
            <img src={qrDataUrl} alt={`QR code untuk RM ${patient.medical_record_number}`} width={200} height={200} />
            <p className="text-xs text-on-surface-variant">Tempel di gelang/label pasien buat scan distribusi.</p>
          </div>
        ) : null}

        {patient.is_special_request ? (
          <div className="rounded-card border border-error bg-error-container/30 p-3">
            <div className="text-xs font-semibold text-error uppercase">Permintaan Khusus</div>
            <div className="font-medium">{patient.special_request_note}</div>
          </div>
        ) : null}

        <Field label="Ruangan / Bed" value={`${patient.room} / ${patient.bed ?? "-"}`} />
        <Field label="No. RM" value={patient.medical_record_number} />
        <Field label="Tanggal Lahir" value={patient.date_of_birth ?? "-"} />
        <Field label="Diet Utama" value={patient.diet_type ?? "-"} />
        <Field
          label="Diet Khusus"
          value={patient.special_diet && patient.special_diet.length > 0 ? patient.special_diet.join(", ") : "-"}
        />
        <Field label="Bentuk Makanan" value={patient.food_form ?? "-"} />
        <Field label="Detail Bentuk Makanan" value={patient.food_form_detail ?? "-"} />
        <Field
          label="Alergi"
          value={
            patient.allergies.length > 0
              ? patient.allergies.map((a) => (a.detail ? `${a.type} (${a.detail})` : a.type)).join(", ")
              : "-"
          }
          highlight={patient.allergies.length > 0}
        />
        <Field
          label="Pantangan Makanan"
          value={
            patient.food_restrictions && patient.food_restrictions.length > 0
              ? patient.food_restrictions.join(", ")
              : "-"
          }
        />
        <Field label="Keterangan" value={patient.notes ?? "-"} />

        {canSeeHistory ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">Riwayat Diet</h2>
            {history && history.length > 0 ? (
              <div className="flex flex-col gap-2">
                {history.map((entry) => (
                  <div key={entry.id} className="rounded-card border border-outline-variant bg-surface-container-lowest p-3 text-sm">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span className="uppercase">{entry.changed_by_role ?? "-"}</span>
                      <span>
                        {new Date(entry.created_at).toLocaleString("id-ID", { timeZone: APP_TIMEZONE })}
                      </span>
                    </div>
                    <div className="mt-1">{entry.summary}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Belum ada riwayat perubahan.</p>
            )}
          </section>
        ) : null}
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
