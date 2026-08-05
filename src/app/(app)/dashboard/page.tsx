import Link from "next/link";

import { Icon } from "@/components/Icon/Icon";
import { createClient } from "@/libs/supabase/server";
import type { PatientWithDelivery } from "@/types/patient";
import { cn } from "@/utils/cn";

const FOOD_FORM_LABELS = ["BIASA", "TIM", "BUBUR", "SARING", "CAIR"] as const;

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*, meal_deliveries(*)")
    .returns<PatientWithDelivery[]>();

  const counts = { pending: 0, ready: 0, delivered: 0 };
  const foodFormCounts: Record<string, number> = {};
  const alerts: PatientWithDelivery[] = [];

  for (const patient of patients ?? []) {
    const delivery = patient.meal_deliveries[0];
    const status = delivery?.status ?? "pending";
    counts[status] += 1;

    if (patient.food_form) {
      foodFormCounts[patient.food_form] = (foodFormCounts[patient.food_form] ?? 0) + 1;
    }

    if (patient.allergies.length > 0 || delivery?.mismatch) {
      alerts.push(patient);
    }
  }

  const recent = [...(patients ?? [])]
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

      {/* Stats bento */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Pending" value={counts.pending} valueClass="text-on-surface-variant" />
        <StatCard label="Ready" value={counts.ready} valueClass="text-primary" />
        <StatCard label="Delivered" value={counts.delivered} valueClass="text-secondary" icon="check_circle" />
      </section>

      {/* Diet stats */}
      {Object.keys(foodFormCounts).length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Statistik Bentuk Makanan</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {FOOD_FORM_LABELS.filter((f) => foodFormCounts[f]).map((form) => (
              <div
                key={form}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-primary"
              >
                <span className="text-xs text-on-surface-variant">{form}</span>
                <span className="text-xl font-semibold text-primary">{foodFormCounts[form]}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Urgent alerts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="warning" filled className="text-error" />
            Pemberitahuan Mendesak
          </h2>
        </div>
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

      {/* Recent distribution table */}
      {recent.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Monitoring Distribusi Terakhir</h2>
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
                              : "rounded bg-primary-container px-2 py-1 text-xs font-bold text-on-primary-container"
                          }
                        >
                          {status === "delivered" ? "TERKIRIM" : "PROSES"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
  icon,
}: {
  label: string;
  value: number;
  valueClass: string;
  icon?: string;
}) {
  return (
    <div className="flex h-32 flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-primary">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-3xl font-bold", valueClass)}>{value}</span>
        {icon ? <Icon name={icon} filled className={valueClass} /> : null}
      </div>
    </div>
  );
}

