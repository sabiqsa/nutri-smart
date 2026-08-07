import Link from "next/link";
import { redirect } from "next/navigation";

import { ALLERGY_OPTIONS, DIET_KHUSUS_OPTIONS, FOOD_FORM_OPTIONS } from "@/constants/patient-options";
import { canViewMetrics, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { DistributionStatus, PatientWithDelivery } from "@/types/patient";
import { cn } from "@/utils/cn";

import { Icon } from "@/components/Icon/Icon";
import { DashboardFilters } from "@/components/DashboardFilters/DashboardFilters";

type SearchParams = { room?: string; diet_type?: string; special_diet?: string; status?: string };

const STATUS_ROW_LABEL: Record<string, string> = {
  pending: "PENDING",
  ready: "PROSES",
  delivered: "TERKIRIM",
  not_distributed: "TIDAK DIBAGIKAN",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const profile = await getCurrentProfile();
  if (!canViewMetrics(profile?.role ?? null)) {
    // Perawat: no access to rekap-porsi metrics per spec.
    redirect("/patients");
  }

  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("patients").select("*, meal_deliveries(*)");
  if (params.room) query = query.eq("room", params.room);
  if (params.diet_type) query = query.eq("diet_type", params.diet_type);
  if (params.special_diet) query = query.contains("special_diet", [params.special_diet]);

  const { data: allPatients } = await query.returns<PatientWithDelivery[]>();

  const patients = (allPatients ?? []).filter((p) => {
    if (!params.status) return true;
    const status = p.meal_deliveries[0]?.status ?? "pending";
    return status === params.status;
  });

  const total = patients.length;
  const statusCounts: Record<DistributionStatus, number> = {
    pending: 0,
    ready: 0,
    delivered: 0,
    not_distributed: 0,
  };
  const foodFormCounts: Record<string, number> = {};
  const dietKhususCounts: Record<string, number> = {};
  const allergyCounts: Record<string, number> = {};
  const alerts: PatientWithDelivery[] = [];
  const specialRequests: PatientWithDelivery[] = [];

  for (const patient of patients) {
    const delivery = patient.meal_deliveries[0];
    const status = delivery?.status ?? "pending";
    statusCounts[status] += 1;

    if (patient.food_form) {
      foodFormCounts[patient.food_form] = (foodFormCounts[patient.food_form] ?? 0) + 1;
    }
    for (const diet of patient.special_diet ?? []) {
      dietKhususCounts[diet] = (dietKhususCounts[diet] ?? 0) + 1;
    }
    for (const allergy of patient.allergies) {
      allergyCounts[allergy.type] = (allergyCounts[allergy.type] ?? 0) + 1;
    }
    if (patient.allergies.length > 0 || delivery?.mismatch) {
      alerts.push(patient);
    }
    if (patient.is_special_request) {
      specialRequests.push(patient);
    }
  }

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const recent = [...patients]
    .filter((p) => p.meal_deliveries[0])
    .sort(
      (a, b) =>
        new Date(b.meal_deliveries[0].updated_at).getTime() -
        new Date(a.meal_deliveries[0].updated_at).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 p-4 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl bg-primary px-6 py-8 text-on-primary">
        <div className="relative z-10 flex flex-col items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl leading-tight font-bold tracking-tight">Selamat Datang</h1>
            <p className="text-sm opacity-90">Siap untuk mendistribusikan nutrisi tepat waktu hari ini?</p>
          </div>
          <Link
            href="/scan"
            className="mt-2 flex items-center gap-2 rounded-xl bg-secondary-container px-6 py-3 text-sm font-semibold text-on-secondary-container shadow-lg transition-transform active:scale-95"
          >
            <Icon name="qr_code_scanner" filled />
            Mulai Scan QR
          </Link>
        </div>
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-primary-container opacity-20 blur-3xl" />
        <div className="absolute right-0 bottom-0 p-4 opacity-10">
          <Icon name="restaurant" className="text-[120px]" />
        </div>
      </section>

      <DashboardFilters />

      {/* Summary stat cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total Porsi" value={total} pct={null} valueClass="text-on-surface" />
        <StatCard
          label="Sudah Dibagikan"
          value={statusCounts.delivered}
          pct={pct(statusCounts.delivered)}
          valueClass="text-secondary"
        />
        <StatCard
          label="Belum Dibagikan"
          value={statusCounts.pending + statusCounts.ready}
          pct={pct(statusCounts.pending + statusCounts.ready)}
          valueClass="text-primary"
        />
        <StatCard
          label="Tidak Dibagikan"
          value={statusCounts.not_distributed}
          pct={pct(statusCounts.not_distributed)}
          valueClass="text-on-surface-variant"
        />
        <StatCard
          label="Permintaan Khusus"
          value={specialRequests.length}
          pct={pct(specialRequests.length)}
          valueClass="text-error"
        />
      </section>

      {/* Bentuk Makanan */}
      <RekapPanel title="Rekap Bentuk Makanan" counts={foodFormCounts} options={FOOD_FORM_OPTIONS} total={total} />

      {/* Diet Khusus */}
      <RekapPanel
        title="Rekap Diet Khusus"
        counts={dietKhususCounts}
        options={DIET_KHUSUS_OPTIONS}
        total={total}
      />

      {/* Alergi */}
      <RekapPanel title="Rekap Alergi" counts={allergyCounts} options={ALLERGY_OPTIONS} total={total} />

      {/* Urgent alerts */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="warning" filled className="text-error" />
          Pemberitahuan Mendesak
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Gak ada alert saat ini.</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((patient) => (
              <Link
                key={patient.id}
                href={`/patients/${patient.id}`}
                className="flex items-center gap-3 rounded-lg border-l-4 border-error bg-error-container/30 p-4"
              >
                <span className="rounded-full bg-error-container p-2">
                  <Icon name="edit_notifications" className="text-on-error-container" size={20} />
                </span>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{patient.patient_name ?? patient.medical_record_number}</h3>
                  <p className="text-sm">
                    {patient.allergies.length > 0 ? (
                      <>
                        Alergi:{" "}
                        <span className="font-bold text-error">
                          {patient.allergies.map((a) => a.type).join(", ")}
                        </span>
                      </>
                    ) : (
                      "Diet mismatch terdeteksi"
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Permintaan Khusus */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Permintaan Khusus ({specialRequests.length})</h2>
          <Link href="/patients?special_request=true" className="text-sm font-medium text-primary">
            Lihat Semua
          </Link>
        </div>
        {specialRequests.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Gak ada permintaan khusus saat ini.</p>
        ) : (
          <div className="space-y-2">
            {specialRequests.slice(0, 5).map((patient) => (
              <Link
                key={patient.id}
                href={`/patients/${patient.id}`}
                className="rounded-card block border border-outline-variant bg-surface-container-lowest p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {patient.patient_name ?? patient.medical_record_number}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {patient.room} · {patient.medical_record_number}
                  </span>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">{patient.special_request_note}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent distribution table */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Monitoring Distribusi Terakhir</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Belum ada aktivitas distribusi.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant bg-surface-container-low">
                <tr>
                  <th className="px-4 py-2 font-medium">Pasien</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {recent.map((patient) => {
                  const status = patient.meal_deliveries[0].status;
                  return (
                    <tr key={patient.id}>
                      <td className="px-4 py-3">
                        <p className="font-bold">{patient.patient_name ?? patient.medical_record_number}</p>
                        <p className="text-xs text-on-surface-variant">Room {patient.room}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            status === "delivered"
                              ? "rounded bg-secondary-container px-2 py-1 text-xs font-bold text-on-secondary-container"
                              : status === "not_distributed"
                                ? "rounded bg-outline-variant px-2 py-1 text-xs font-bold text-on-surface"
                                : "rounded bg-primary-container px-2 py-1 text-xs font-bold text-on-primary-container"
                          }
                        >
                          {STATUS_ROW_LABEL[status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  pct,
  valueClass,
}: {
  label: string;
  value: number;
  pct: number | null;
  valueClass: string;
}) {
  return (
    <div className="flex h-24 flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-3 transition-colors hover:border-primary">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-bold", valueClass)}>{value}</span>
        {pct !== null ? <span className="text-xs text-on-surface-variant">({pct}%)</span> : null}
      </div>
    </div>
  );
}

function RekapPanel({
  title,
  counts,
  options,
  total,
}: {
  title: string;
  counts: Record<string, number>;
  options: readonly string[];
  total: number;
}) {
  const entries = options.filter((o) => counts[o]);
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {entries.map((option) => (
          <div
            key={option}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center transition-colors hover:border-primary"
          >
            <span className="text-xs text-on-surface-variant">{option}</span>
            <span className="text-xl font-semibold text-primary">{counts[option]}</span>
          </div>
        ))}
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-outline-variant bg-surface-container-high p-4 text-center">
          <span className="text-xs text-on-surface-variant">Total</span>
          <span className="text-xl font-semibold">{total}</span>
        </div>
      </div>
    </section>
  );
}
