"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon } from "@/components/Icon/Icon";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Input } from "@/components/ui/input";
import type { PatientWithDelivery } from "@/types/patient";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Patient or Bed..."
          aria-label="Cari pasien, bed, atau No. RM"
          className="h-12 rounded-lg bg-surface-container-lowest pr-4 pl-12 text-base md:text-sm"
        />
      </div>

      {wards.length > 1 ? (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <WardChip label="Semua" active={ward === null} onClick={() => setWard(null)} />
          {wards.map((w) => (
            <WardChip key={w} label={w} active={ward === w} onClick={() => setWard(w)} />
          ))}
        </div>
      ) : null}

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{ward ?? "Semua Pasien"}</h2>
        <span className="text-sm text-on-surface-variant tabular-nums">{filtered.length} pasien</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant px-6 py-12 text-center">
          <Icon name="person_search" size={32} className="text-outline" />
          <p className="text-sm font-medium">Gak ada pasien ketemu.</p>
          {query || ward ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setWard(null);
              }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Hapus pencarian
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {filtered.map((patient) => (
            <li key={patient.id}>
              <PatientCard patient={patient} />
            </li>
          ))}
        </ul>
      )}

      {canScan ? (
        <Link
          href="/scan"
          aria-label="Scan QR pasien"
          className="fixed right-4 bottom-24 z-30 flex size-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-floating transition-transform hover:bg-primary-container active:scale-95 md:right-8 md:bottom-8"
        >
          <Icon name="qr_code_scanner" size={28} />
        </Link>
      ) : null}
    </div>
  );
}

function WardChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:text-on-surface",
      )}
    >
      {label}
    </button>
  );
}

function PatientCard({ patient }: { patient: PatientWithDelivery }) {
  const status = patient.meal_deliveries[0]?.status ?? "pending";
  const highAlert = !!patient.meal_deliveries[0]?.mismatch;
  const allergies = patient.allergies.map((a) => a.type).join(", ");

  return (
    <Link
      href={`/patients/${patient.id}`}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-xl border bg-surface-container-lowest p-3 pr-4 transition-[border-color,box-shadow] hover:shadow-raised md:p-4",
        highAlert ? "border-error" : "border-outline-variant hover:border-outline",
      )}
    >
      {highAlert ? <div className="absolute inset-y-0 left-0 w-1 bg-error" /> : null}

      <div
        className={cn(
          "flex size-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg p-0.5",
          highAlert ? "bg-error-container text-on-error-container" : "bg-surface-container text-on-surface-variant",
        )}
      >
        <span className="text-[11px] font-medium">Bed</span>
        <span
          className={cn(
            "line-clamp-2 w-full text-center leading-tight font-bold wrap-break-word tabular-nums",
            (patient.bed?.length ?? 0) > 4 ? "text-xs" : "text-xl",
            highAlert ? "text-error" : "text-primary",
          )}
        >
          {patient.bed ?? "-"}
        </span>
      </div>

      <div className="flex min-w-0 grow flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{patient.patient_name ?? "(tanpa nama)"}</h3>
            <p className="truncate text-sm text-on-surface-variant">
              {patient.room} · {patient.diet_type ?? "-"}
            </p>
          </div>
          {highAlert ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-error px-2 py-0.5 text-[11px] font-bold text-on-error">
              <Icon name="warning" filled size={14} />
              High Alert
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={status} />
          {allergies ? (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-error-container px-2.5 py-1 text-xs font-semibold text-on-error-container">
              <Icon name="emergency" size={14} />
              <span className="truncate">Alergi: {allergies}</span>
            </span>
          ) : null}
        </div>
      </div>

      <Icon name="chevron_right" className="shrink-0 text-outline transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
