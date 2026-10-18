import { redirect } from "next/navigation";

import { Icon } from "@/components/Icon/Icon";
import { APP_TIMEZONE, MEAL_PERIOD_LABEL, MEAL_PERIOD_ORDER } from "@/config/meal-cutoff";
import { canViewMetrics, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { DistributionSnapshot, MealCutoffRow } from "@/types/meal-cutoff";
import type { PatientWithDelivery } from "@/types/patient";
import { cn } from "@/lib/utils";

const PAPER_SHEETS_PER_DELIVERY = 1;

export default async function AnalyticsPage() {
  const profile = await getCurrentProfile();
  if (!canViewMetrics(profile?.role ?? null)) {
    redirect("/patients");
  }

  const supabase = await createClient();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [{ data: patients }, { data: snapshots }, { data: cutoffs }, { data: history }] = await Promise.all([
    supabase.from("patients").select("*, meal_deliveries(*)").returns<PatientWithDelivery[]>(),
    supabase
      .from("distribution_snapshots")
      .select("*")
      .eq("snapshot_date", today)
      .returns<DistributionSnapshot[]>(),
    supabase.from("meal_cutoffs").select("*").returns<MealCutoffRow[]>(),
    // Last 7 days *before* today (today's already shown live above) — a
    // plain list, not a date-picker/chart, per the "kalo sehari berat,
    // seminggu juga gapapa" call: cheap to build, still gives a sense of
    // trend without a new UI pattern.
    supabase
      .from("distribution_snapshots")
      .select("*")
      .lt("snapshot_date", today)
      .order("snapshot_date", { ascending: false })
      .limit(21)
      .returns<DistributionSnapshot[]>(),
  ]);

  const snapshotByPeriod = new Map((snapshots ?? []).map((s) => [s.period, s]));
  const cutoffByPeriod = new Map((cutoffs ?? []).map((c) => [c.period, c]));

  const historyByDate = new Map<string, DistributionSnapshot[]>();
  for (const row of history ?? []) {
    const rows = historyByDate.get(row.snapshot_date) ?? [];
    rows.push(row);
    historyByDate.set(row.snapshot_date, rows);
  }
  const historyDates = Array.from(historyByDate.keys()).sort((a, b) => (a < b ? 1 : -1));

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
  const hasErrors = errorLog.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-2xl font-bold">Monitoring</h1>

      {/* Progress */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-sm text-on-surface-variant">Status Pengiriman Real-time</p>
            <h2 className="text-2xl font-bold text-primary tabular-nums">{completionPct}% Distribusi Selesai</h2>
          </div>
          <p className="mb-1 text-sm text-on-surface-variant tabular-nums">
            {deliveredCount}/{total} Pasien
          </p>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${completionPct}%` }} />
        </div>
        {wardStatus.length > 0 ? (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
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
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
          <h3 className="text-base font-semibold">Waktu Rata-rata per Pengantaran</h3>
          <p className="mb-4 text-sm text-on-surface-variant">Efisiensi Alur Kerja</p>
          {avgMinutes === null ? (
            <p className="text-sm text-on-surface-variant">Belum ada delivery selesai buat dihitung.</p>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary tabular-nums">{avgMinutes}</span>
              <span className="text-sm text-on-surface-variant">menit rata-rata ({deliveryMinutes.length} delivery)</span>
            </div>
          )}
        </section>

        {/* Resource saving */}
        <section className="flex flex-col justify-between rounded-xl border border-secondary/20 bg-secondary-container/40 p-5 text-on-secondary-fixed-variant md:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Icon name="eco" filled className="text-secondary" />
              <h3 className="text-base font-semibold">Dampak Ekologis</h3>
            </div>
            <p className="text-2xl leading-tight font-bold tabular-nums">
              Estimasi hemat {deliveredCount * PAPER_SHEETS_PER_DELIVERY} lembar kertas
            </p>
          </div>
          <p className="mt-4 text-sm opacity-80">
            Estimasi (asumsi {PAPER_SHEETS_PER_DELIVERY} lembar label per delivery digital), belum diukur langsung.
          </p>
        </section>
      </div>

      {/* Rekap evaluasi distribusi otomatis — snapshot per sesi, dibekukan
          otomatis oleh cron di jam cut-off evaluasi (lihat
          src/libs/meal-cutoff/run-cutoff-job.ts), bukan hitungan live. */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Rekap Evaluasi Distribusi (Otomatis)</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {MEAL_PERIOD_ORDER.map((period) => {
            const snapshot = snapshotByPeriod.get(period);
            const cutoff = cutoffByPeriod.get(period);
            return (
              <div
                key={period}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">{MEAL_PERIOD_LABEL[period]}</span>
                  {cutoff ? (
                    <span className="text-xs text-on-surface-variant">
                      cut-off {cutoff.evaluation_cutoff_time.slice(0, 5)}
                    </span>
                  ) : null}
                </div>
                {!snapshot ? (
                  <p className="text-xs text-on-surface-variant">
                    Belum digenerate, nunggu jam cut-off evaluasi.
                  </p>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm tabular-nums">
                    <dt className="text-on-surface-variant">Berhasil</dt>
                    <dd className="text-right font-semibold text-secondary">{snapshot.berhasil_count}</dd>
                    <dt className="text-on-surface-variant">Pending</dt>
                    <dd className="text-right font-semibold text-primary">{snapshot.pending_count}</dd>
                    <dt className="text-on-surface-variant">Tidak Dibagikan</dt>
                    <dd className="text-right font-semibold text-on-surface">
                      {snapshot.tidak_dibagikan_count}
                    </dd>
                    <dt className="border-t border-outline-variant pt-1 font-medium text-on-surface">Total</dt>
                    <dd className="border-t border-outline-variant pt-1 text-right font-bold">
                      {snapshot.total_count}
                    </dd>
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Riwayat 7 hari terakhir — plain list, bukan date-picker/chart
          (scoped-down per user call: cukup buat liat tren mingguan). */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Riwayat Rekap (7 Hari Terakhir)</h2>
        {historyDates.length > 0 ? (
          <p className="text-xs text-on-surface-variant">
            Format: <span className="text-secondary">Berhasil</span>/<span className="text-primary">Pending</span>
            /Tidak Dibagikan, dari Total
          </p>
        ) : null}
        {historyDates.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Belum ada histori, baru mulai kepake fitur ini.</p>
        ) : (
          <div className="space-y-2">
            {historyDates.map((date) => (
              <div
                key={date}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
              >
                <p className="mb-2 text-sm font-semibold">
                  {new Date(`${date}T00:00:00Z`).toLocaleDateString("id-ID", {
                    timeZone: APP_TIMEZONE,
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
                  {MEAL_PERIOD_ORDER.map((period) => {
                    const snapshot = (historyByDate.get(date) ?? []).find((s) => s.period === period);
                    return (
                      <div key={period} className="rounded-lg bg-surface-container p-2">
                        <p className="mb-1 font-medium text-primary">{MEAL_PERIOD_LABEL[period]}</p>
                        {!snapshot ? (
                          <p className="text-on-surface-variant">-</p>
                        ) : (
                          <p className="text-on-surface-variant">
                            <span className="text-secondary">{snapshot.berhasil_count}</span>/
                            <span className="text-primary">{snapshot.pending_count}</span>/
                            <span>{snapshot.tidak_dibagikan_count}</span> dari {snapshot.total_count}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Error log */}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div
          className={cn(
            "flex items-center justify-between border-b border-outline-variant px-5 py-4 md:px-6",
            hasErrors && "bg-error-container/30",
          )}
        >
          <div className="flex items-center gap-3">
            <Icon
              name={hasErrors ? "gpp_maybe" : "verified_user"}
              filled
              className={hasErrors ? "text-error" : "text-secondary"}
            />
            <h3 className={cn("text-base font-semibold", hasErrors && "text-on-error-container")}>
              {errorLog.length} Kesalahan Terdeteksi
            </h3>
          </div>
        </div>
        {errorLog.length === 0 ? (
          <p className="px-5 py-4 text-sm text-on-surface-variant md:px-6">
            Belum ada mismatch tercatat. Fitur logging mismatch belum dipakai aktif di flow scan.
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
