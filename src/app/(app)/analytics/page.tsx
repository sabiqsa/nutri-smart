import { redirect } from "next/navigation";

import { Icon } from "@/components/Icon/Icon";
import { canViewMetrics, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { PatientWithDelivery } from "@/types/patient";

const PAPER_SHEETS_PER_DELIVERY = 1;

export default async function AnalyticsPage() {
  const profile = await getCurrentProfile();
  if (!canViewMetrics(profile?.role ?? null)) {
    redirect("/patients");
  }

  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*, meal_deliveries(*)")
    .returns<PatientWithDelivery[]>();

  const all = patients ?? [];
  const total = all.length;
  const deliveredList = all.filter((p) => p.meal_deliveries[0]?.status === "delivered");
  const deliveredCount = deliveredList.length;
  const completionPct = total > 0 ? Math.round((deliveredCount / total) * 100) : 0;

  const deliveryMinutes = deliveredList
    .map((p) => {
      const d = p.meal_deliveries[0];
      if (!d.delivered_at) return null;
      const mins = (new Date(d.delivered_at).getTime() - new Date(d.created_at).getTime()) / 60000;
      return mins >= 0 ? mins : null;
    })
    .filter((v): v is number => v !== null);
  const avgMinutes =
    deliveryMinutes.length > 0
      ? Math.round(deliveryMinutes.reduce((a, b) => a + b, 0) / deliveryMinutes.length)
      : null;

  const wardStatus = Array.from(new Set(all.map((p) => p.room))).map((room) => {
    const wardPatients = all.filter((p) => p.room === room);
    const wardDelivered = wardPatients.filter((p) => p.meal_deliveries[0]?.status === "delivered").length;
    return { room, done: wardDelivered === wardPatients.length && wardPatients.length > 0 };
  });

  const errorLog = all.filter((p) => p.meal_deliveries[0]?.mismatch);

  return (
    <div className="space-y-6 p-4 pb-8">
      {/* Progress */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-sm text-on-surface-variant">Status Pengiriman Real-time</p>
            <h2 className="text-2xl font-semibold text-primary">{completionPct}% Distribusi Selesai</h2>
          </div>
          <p className="mb-1 text-sm text-on-surface-variant">
            {deliveredCount}/{total} Pasien
          </p>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
        </div>
        {wardStatus.length > 0 ? (
          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
            {wardStatus.map(({ room, done }) => (
              <span
                key={room}
                className={
                  done
                    ? "shrink-0 rounded-full bg-secondary-container px-3 py-1 text-xs font-medium whitespace-nowrap text-on-secondary-container"
                    : "shrink-0 rounded-full bg-primary-fixed px-3 py-1 text-xs font-medium whitespace-nowrap text-on-primary-fixed-variant"
                }
              >
                {room}: {done ? "Selesai" : "Sedang Berjalan"}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Delivery time */}
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <h3 className="text-lg font-semibold">Waktu Rata-rata per Pengantaran</h3>
          <p className="mb-4 text-sm text-on-surface-variant">Efisiensi Alur Kerja</p>
          {avgMinutes === null ? (
            <p className="text-sm text-on-surface-variant">Belum ada delivery selesai buat dihitung.</p>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{avgMinutes}</span>
              <span className="text-sm text-on-surface-variant">menit rata-rata ({deliveryMinutes.length} delivery)</span>
            </div>
          )}
        </section>

        {/* Resource saving */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-secondary-container p-6 text-on-secondary-container">
          <div className="absolute -top-5 -right-5 opacity-10">
            <Icon name="eco" filled className="text-[160px]" />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Icon name="eco" filled className="text-secondary" />
              <h3 className="text-lg font-semibold">Dampak Ekologis</h3>
            </div>
            <p className="text-2xl leading-tight font-bold">
              Estimasi hemat {deliveredCount * PAPER_SHEETS_PER_DELIVERY} lembar kertas
            </p>
          </div>
          <p className="mt-4 text-sm opacity-80">
            Estimasi (asumsi {PAPER_SHEETS_PER_DELIVERY} lembar label per delivery digital) — belum diukur langsung.
          </p>
        </section>
      </div>

      {/* Error log */}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant bg-error-container/20 p-6">
          <div className="flex items-center gap-3">
            <Icon name="gpp_maybe" filled className="text-error" />
            <h3 className="text-lg font-semibold text-on-error-container">
              {errorLog.length} Kesalahan Terdeteksi
            </h3>
          </div>
        </div>
        {errorLog.length === 0 ? (
          <p className="p-6 text-sm text-on-surface-variant">
            Belum ada mismatch tercatat — fitur logging mismatch belum dipakai aktif di flow scan.
          </p>
        ) : (
          <div className="divide-y divide-outline-variant">
            {errorLog.map((patient) => (
              <div key={patient.id} className="flex items-start gap-4 p-4">
                <span className="shrink-0 rounded-full bg-error-container p-2 text-error">
                  <Icon name="block" size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold">{patient.patient_name ?? patient.medical_record_number}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {patient.meal_deliveries[0]?.mismatch_note ?? "Mismatch terdeteksi saat scan."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
