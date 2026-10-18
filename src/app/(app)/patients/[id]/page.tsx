import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { ClosePatientButton } from "@/components/ClosePatientButton/ClosePatientButton";
import { Icon } from "@/components/Icon/Icon";
import { MarkNotDistributedForm } from "@/components/MarkNotDistributedForm/MarkNotDistributedForm";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Button } from "@/components/ui/button";
import { APP_TIMEZONE } from "@/config/meal-cutoff";
import { canDeletePatients, canEditPatients, canViewDietHistory, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { PatientWithDelivery } from "@/types/patient";
import { cn } from "@/lib/utils";
import { buildPatientQrValue } from "@/utils/patient-qr";
import { canPrintLabel, canScanDistribution } from "@/utils/roles";

import { closePatient } from "../actions";
import { markNotDistributed } from "../delivery-actions";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const role = profile?.role ?? null;

  const { data: patient } = await supabase
    .from("patients")
    .select("*, meal_deliveries(*)")
    .eq("id", id)
    .single<PatientWithDelivery>();

  if (!patient) {
    notFound();
  }

  const status = patient.meal_deliveries[0]?.status ?? "pending";
  const canEdit = canEditPatients(role);
  const canSeeHistory = canViewDietHistory(role);
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

  const hasAllergy = patient.allergies.length > 0;
  const allergyText = patient.allergies.map((a) => (a.detail ? `${a.type} (${a.detail})` : a.type)).join(", ");
  const canMarkNotDistributed =
    canScanDistribution(role) &&
    !!patient.meal_deliveries[0] &&
    status !== "not_distributed" &&
    status !== "delivered";

  return (
    <div className="flex flex-col">
      <PageHeader
        title={patient.patient_name ?? "(tanpa nama)"}
        subtitle={`RM ${patient.medical_record_number} · ${patient.room} / Bed ${patient.bed ?? "-"}`}
        backHref="/patients"
        actions={
          <>
            {canPrintLabel(role) ? (
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href={`/patients/${patient.id}/label`}>
                  <Icon name="print" size={16} />
                  Cetak Label
                </Link>
              </Button>
            ) : null}
            {canEdit ? (
              <Button asChild size="sm" className="gap-1">
                <Link href={`/patients/${patient.id}/edit`}>
                  <Icon name="edit" size={16} />
                  Edit
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={status} className="text-sm" />
            {canMarkNotDistributed ? (
              <MarkNotDistributedForm
                action={markNotDistributed.bind(null, patient.meal_deliveries[0].id, patient.id)}
              />
            ) : null}
          </div>

          {patient.is_special_request ? (
            <Callout icon="priority_high" title="Permintaan Khusus">
              {patient.special_request_note}
            </Callout>
          ) : null}

          {hasAllergy ? (
            <Callout icon="emergency" title="Alergi">
              {allergyText}
            </Callout>
          ) : null}

          <FieldGroup title="Identitas">
            <Field label="Ruangan / Bed" value={`${patient.room} / ${patient.bed ?? "-"}`} />
            <Field label="No. RM" value={patient.medical_record_number} mono />
            <Field label="Tanggal Lahir" value={patient.date_of_birth ?? "-"} />
          </FieldGroup>

          <FieldGroup title="Kebutuhan Diet">
            <Field label="Diet Utama" value={patient.diet_type ?? "-"} />
            <Field
              label="Diet Khusus"
              value={patient.special_diet && patient.special_diet.length > 0 ? patient.special_diet.join(", ") : "-"}
            />
            <Field
              label="Frekuensi Makan"
              value={patient.frekuensi_makan != null ? `${patient.frekuensi_makan}x/hari` : "-"}
            />
            <Field label="Bentuk Makanan" value={patient.food_form ?? "-"} />
            <Field label="Detail Bentuk Makanan" value={patient.food_form_detail ?? "-"} />
            {patient.food_form === "CAIR" ? (
              <Field
                label="Detail Makanan Cair"
                value={
                  [
                    patient.food_form_cair_frekuensi != null ? `${patient.food_form_cair_frekuensi}x/hari` : null,
                    patient.food_form_cair_kalori != null ? `${patient.food_form_cair_kalori} KKAL` : null,
                    patient.food_form_cair_ml != null ? `${patient.food_form_cair_ml} ML` : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"
                }
              />
            ) : null}
          </FieldGroup>

          <FieldGroup title="Alergi & Pantangan">
            <Field
              label="Alergi"
              value={allergyText || "-"}
              highlight={hasAllergy}
            />
            <Field
              label="Pantangan Makanan"
              value={
                patient.food_restrictions && patient.food_restrictions.length > 0
                  ? patient.food_restrictions.join(", ")
                  : "-"
              }
            />
          </FieldGroup>

          <FieldGroup title="Catatan">
            <Field label="Keterangan" value={patient.notes ?? "-"} wide />
          </FieldGroup>

          {canSeeHistory ? (
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest">
              <h2 className="px-5 pt-4 pb-3 text-base font-semibold">Riwayat Diet</h2>
              {history && history.length > 0 ? (
                <ol className="flex flex-col border-t border-outline-variant px-5 py-4">
                  {history.map((entry, i) => (
                    <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < history.length - 1 ? (
                        <span className="absolute top-3 bottom-0 left-1.25 w-px bg-outline-variant" />
                      ) : null}
                      <span className="relative mt-1.5 size-2.75 shrink-0 rounded-full border-2 border-primary bg-surface-container-lowest" />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="text-xs text-on-surface-variant">
                          <span className="font-semibold capitalize">
                            {entry.changed_by_role?.replace("_", " ") ?? "-"}
                          </span>
                          {", "}
                          {new Date(entry.created_at).toLocaleString("id-ID", {
                            timeZone: APP_TIMEZONE,
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="text-sm">{entry.summary}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="border-t border-outline-variant px-5 py-4 text-sm text-on-surface-variant">
                  Belum ada riwayat perubahan.
                </p>
              )}
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          {qrDataUrl ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 lg:sticky lg:top-20">
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, next/image can't optimize it */}
              <img
                src={qrDataUrl}
                alt={`QR code untuk RM ${patient.medical_record_number}`}
                width={180}
                height={180}
                className="rounded-md"
              />
              <p className="text-center text-xs text-on-surface-variant">
                Tempel di gelang/label pasien buat scan distribusi.
              </p>
            </div>
          ) : null}

          {canDeletePatients(role) ? (
            <div className="flex flex-col gap-2 rounded-xl border border-error/30 p-4">
              <p className="text-xs text-on-surface-variant">
                Pasien sudah pulang atau meninggal? Data dihapus permanen.
              </p>
              <ClosePatientButton
                action={closePatient.bind(null, patient.id)}
                patientName={patient.patient_name ?? patient.medical_record_number}
              />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Callout({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-error/40 bg-error-container/50 p-4">
      <Icon name={icon} filled size={20} className="mt-0.5 shrink-0 text-error" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold text-on-error-container">{title}</p>
        <p className="text-sm text-on-error-container">{children}</p>
      </div>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest">
      <h2 className="px-5 pt-4 pb-1 text-base font-semibold">{title}</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 pt-2 pb-5 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Field({
  label,
  value,
  highlight,
  mono,
  wide,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", wide && "sm:col-span-2")}>
      <dt className="text-xs text-on-surface-variant">{label}</dt>
      <dd
        className={cn(
          "font-medium wrap-break-word whitespace-pre-line",
          highlight && "text-error",
          mono && "tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
