"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon } from "@/components/Icon/Icon";
import { Input } from "@/components/ui/input";
import type { PatientWithDelivery } from "@/types/patient";
import { cn } from "@/utils/cn";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: "schedule", className: "bg-surface-container-highest text-on-surface-variant" },
  ready: {
    label: "Siap Kirim",
    icon: "check_circle",
    className: "bg-secondary-container text-on-secondary-container",
  },
  delivered: {
    label: "Terkirim",
    icon: "check_circle",
    className: "bg-secondary-container text-on-secondary-container",
  },
  not_distributed: {
    label: "Tidak Dibagikan",
    icon: "block",
    className: "bg-outline-variant text-on-surface",
  },
} as const;

export function PatientListView({
  patients,
  canScan,
}: {
  patients: PatientWithDelivery[];
  canScan: boolean;
}) {
  const [query, setQuery] = useState("");
  const [ward, setWard] = useState<string | null>(null);

  const wards = useMemo(() => Array.from(new Set(patients.map((p) => p.room))), [patients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (ward && p.room !== ward) return false;
      if (!q) return true;
      return (
        p.patient_name?.toLowerCase().includes(q) ||
        p.room.toLowerCase().includes(q) ||
        p.bed?.toLowerCase().includes(q) ||
        p.medical_record_number.toLowerCase().includes(q)
      );
    });
  }, [patients, query, ward]);

  return (
    <div>
      <div className="relative mb-3">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Patient or Bed..."
          className="h-12 rounded-xl pr-4 pl-12 text-sm focus-visible:border-primary focus-visible:ring-primary/50"
        />
      </div>

      {wards.length > 1 ? (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setWard(null)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              ward === null
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest",
            )}
          >
            Semua
          </button>
          {wards.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWard(w)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                ward === w
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{ward ?? "Semua Pasien"}</h2>
        <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant">
          {filtered.length} Patients
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Gak ada pasien ketemu.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => (
            <PatientCard key={patient.id} patient={patient} canScan={canScan} />
          ))}
        </div>
      )}

      {canScan ? (
        <Link
          href="/scan"
          className="fixed right-6 bottom-24 z-30 flex size-16 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-xl transition-transform active:scale-95"
        >
          <Icon name="qr_code_scanner" size={32} />
        </Link>
      ) : null}
    </div>
  );
}

function PatientCard({ patient, canScan }: { patient: PatientWithDelivery; canScan: boolean }) {
  const status = STATUS_CONFIG[patient.meal_deliveries[0]?.status ?? "pending"];
  const highAlert = !!patient.meal_deliveries[0]?.mismatch;

  return (
    <Link
      href={`/patients/${patient.id}`}
      className={cn(
        "relative flex items-center gap-4 overflow-hidden rounded-xl border bg-surface-container-lowest p-4 transition-shadow hover:shadow-sm",
        highAlert ? "border-error" : "border-outline-variant",
      )}
    >
      {highAlert ? <div className="absolute top-0 left-0 h-full w-1 bg-error" /> : null}

      <div
        className={cn(
          "flex size-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border p-0.5",
          highAlert
            ? "border-error-container bg-error-container text-on-error-container"
            : "border-outline-variant bg-surface-container-high",
        )}
      >
        <span className="text-xs">Bed</span>
        <span
          className={cn(
            "line-clamp-2 w-full text-center leading-tight font-bold wrap-break-word",
            (patient.bed?.length ?? 0) > 4 ? "text-xs" : "text-lg",
            highAlert ? "text-error" : "text-primary",
          )}
        >
          {patient.bed ?? "-"}
        </span>
      </div>

      <div className="min-w-0 grow">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold">{patient.patient_name ?? "(tanpa nama)"}</h3>
          {highAlert ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-error px-2 py-0.5 text-[10px] font-bold tracking-wider text-on-error uppercase">
              <Icon name="warning" size={12} />
              High Alert
            </span>
          ) : patient.allergies.length > 0 ? (
            <span className="shrink-0 rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold tracking-wider text-on-error-container uppercase">
              Allergy: {patient.allergies.map((a) => a.type).join(", ")}
            </span>
          ) : null}
        </div>
        <p className="mb-2 text-sm text-on-surface-variant">{patient.diet_type ?? "-"}</p>
        {highAlert && patient.allergies.length > 0 ? (
          <p className="mb-2 text-xs font-bold text-error italic">
            Allergy: {patient.allergies.map((a) => a.type).join(", ")}
          </p>
        ) : null}
        <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", status.className)}>
          <Icon name={status.icon} size={14} />
          {status.label}
        </span>
      </div>

      {canScan ? (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border",
            highAlert ? "border-error text-error" : "border-outline-variant text-primary",
          )}
        >
          <Icon name="qr_code_scanner" size={20} />
        </span>
      ) : null}
    </Link>
  );
}
