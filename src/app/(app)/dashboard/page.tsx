import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_TIMEZONE } from "@/config/meal-cutoff";
import { DELIVERY_STATUS } from "@/constants/delivery-status";
import { ALLERGY_OPTIONS, DIET_KHUSUS_OPTIONS, FOOD_FORM_OPTIONS } from "@/constants/patient-options";
import { canScanDistribution, canViewMetrics, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { DistributionStatus, PatientWithDelivery } from "@/types/patient";
import { cn } from "@/lib/utils";

import { Icon } from "@/components/Icon/Icon";
import { DashboardFilters } from "@/components/DashboardFilters/DashboardFilters";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Button } from "@/components/ui/button";

type SearchParams = { room?: string; diet_type?: string; special_diet?: string; status?: string };

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
    // Pemberitahuan Mendesak (the time-boxed, "last 12h" version of this)
    // moved to the header notification bell, see (app)/layout.tsx +
    // AppShell. This list stays the full, untouched history.
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

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Stacked bar segments, in the order a portion moves through the day.
  const segments: { key: DistributionStatus; className: string }[] = [
    { key: "delivered", className: "bg-secondary" },
    { key: "ready", className: "bg-primary" },
    { key: "pending", className: "bg-primary-fixed-dim" },
    { key: "not_distributed", className: "bg-outline" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-on-surface-variant">{todayLabel}</p>
          <h1 className="text-2xl font-bold md:text-3xl">Selamat Datang</h1>
          <p className="text-sm text-on-surface-variant">Siap untuk mendistribusikan nutrisi tepat waktu hari ini?</p>
        </div>
        {canScanDistribution(profile?.role ?? null) ? (
          <Button asChild size="lg" className="h-12 gap-2 self-start px-5 font-semibold shadow-raised md:self-auto">
            <Link href="/scan">
              <Icon name="qr_code_scanner" size={20} />
              Mulai Scan QR
            </Link>
          </Button>
        ) : null}
      </section>

      <div className="flex flex-col gap-4">
        <DashboardFilters />

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-base font-semibold">Progres Distribusi</h2>
              <p className="text-sm text-on-surface-variant tabular-nums">
                <span className="text-lg font-bold text-on-surface">{pct(statusCounts.delivered)}%</span> terkirim
              </p>
            </div>
            <div
              className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-surface-container-high"
              role="img"
              aria-label={`${statusCounts.delivered} dari ${total} porsi sudah dibagikan`}
            >
              {segments.map(({ key, className }) =>
                statusCounts[key] > 0 ? (
                  <div key={key} className={className} style={{ width: `${(statusCounts[key] / total) * 100}%` }} />
                ) : null,
              )}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
              {segments.map(({ key, className }) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span className={cn("size-2 rounded-full", className)} />
                  {DELIVERY_STATUS[key].label}
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid grid-cols-2 border-t border-outline-variant md:grid-cols-5">
            <Stat label="Total Porsi" value={total} />
            <Stat label="Sudah Dibagikan" value={statusCounts.delivered} pct={pct(statusCounts.delivered)} valueClass="text-secondary" />
            <Stat
              label="Belum Dibagikan"
              value={statusCounts.pending + statusCounts.ready}
              pct={pct(statusCounts.pending + statusCounts.ready)}
              valueClass="text-primary"
            />
            <Stat
              label="Tidak Dibagikan"
              value={statusCounts.not_distributed}
              pct={pct(statusCounts.not_distributed)}
            />
            <Stat
              label="Permintaan Khusus"
              value={specialRequests.length}
              pct={pct(specialRequests.length)}
              valueClass="text-error"
              className="col-span-2 md:col-span-1"
            />
          </dl>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RekapPanel title="Rekap Bentuk Makanan" icon="restaurant" counts={foodFormCounts} options={FOOD_FORM_OPTIONS} total={total} />
        <RekapPanel title="Rekap Diet Khusus" icon="nutrition" counts={dietKhususCounts} options={DIET_KHUSUS_OPTIONS} total={total} />
        <RekapPanel title="Rekap Alergi" icon="warning" counts={allergyCounts} options={ALLERGY_OPTIONS} total={total} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
            <h2 className="text-base font-semibold">
              Permintaan Khusus <span className="text-on-surface-variant tabular-nums">({specialRequests.length})</span>
            </h2>
            <Link href="/patients?special_request=true" className="text-sm font-semibold text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>
          {specialRequests.length === 0 ? (
            <EmptyRow icon="task_alt" text="Gak ada permintaan khusus saat ini." />
          ) : (
            <ul className="divide-y divide-outline-variant border-t border-outline-variant">
              {specialRequests.slice(0, 5).map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="flex flex-col gap-0.5 px-5 py-3 transition-colors hover:bg-surface-container-low"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold">
                        {patient.patient_name ?? patient.medical_record_number}
                      </span>
                      <span className="shrink-0 text-xs text-on-surface-variant tabular-nums">
                        {patient.room} · {patient.medical_record_number}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-sm text-on-surface-variant">{patient.special_request_note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest">
          <h2 className="px-5 pt-4 pb-3 text-base font-semibold">Monitoring Distribusi Terakhir</h2>
          {recent.length === 0 ? (
            <EmptyRow icon="local_shipping" text="Belum ada aktivitas distribusi." />
          ) : (
            <ul className="divide-y divide-outline-variant border-t border-outline-variant">
              {recent.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-container-low"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {patient.patient_name ?? patient.medical_record_number}
                      </span>
                      <span className="block text-xs text-on-surface-variant">Room {patient.room}</span>
                    </span>
                    <StatusBadge status={patient.meal_deliveries[0].status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  pct,
  valueClass,
  className,
}: {
  label: string;
  value: number;
  pct?: number;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-outline-variant px-5 py-4 not-last:border-b odd:not-last:border-r md:border-b-0 md:not-last:border-r",
        className,
      )}
    >
      <dt className="text-xs font-medium text-on-surface-variant">{label}</dt>
      <dd className="flex items-baseline gap-1.5 tabular-nums">
        <span className={cn("text-2xl font-bold", valueClass ?? "text-on-surface")}>{value}</span>
        {pct !== undefined ? <span className="text-xs text-on-surface-variant">{pct}%</span> : null}
      </dd>
    </div>
  );
}

function RekapPanel({
  title,
  icon,
  counts,
  options,
  total,
}: {
  title: string;
  icon: string;
  counts: Record<string, number>;
  options: readonly string[];
  total: number;
}) {
  const entries = options.filter((o) => counts[o]).sort((a, b) => counts[b] - counts[a]);
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <Icon name={icon} size={20} className="text-primary" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <ul className="flex flex-col gap-2.5 px-5 pb-4">
        {entries.map((option) => (
          <li key={option} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-on-surface-variant">{option}</span>
              <span className="font-semibold tabular-nums">{counts[option]}</span>
            </div>
            <div className="h-1 rounded-full bg-primary" style={{ width: `${total > 0 ? (counts[option] / total) * 100 : 0}%` }} />
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-baseline justify-between border-t border-outline-variant px-5 py-3 text-sm">
        <span className="text-on-surface-variant">Total</span>
        <span className="font-bold tabular-nums">{total}</span>
      </div>
    </section>
  );
}

function EmptyRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 border-t border-outline-variant px-5 py-8 text-center">
      <Icon name={icon} size={28} className="text-outline" />
      <p className="text-sm text-on-surface-variant">{text}</p>
    </div>
  );
}
