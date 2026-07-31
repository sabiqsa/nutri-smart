"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";

import { Icon } from "@/components/Icon/Icon";
import { createClient } from "@/libs/supabase/client";
import type { PatientWithDelivery } from "@/types/patient";
import { cn } from "@/utils/cn";
import { parsePatientQrValue } from "@/utils/patient-qr";

type ScanState =
  | { phase: "scanning" }
  | { phase: "not_found" }
  | { phase: "matched"; patient: PatientWithDelivery }
  | { phase: "confirmed"; patient: PatientWithDelivery };

export function ScanView() {
  const [state, setState] = useState<ScanState>({ phase: "scanning" });
  const [confirming, setConfirming] = useState(false);

  async function handleScan(codes: { rawValue: string }[]) {
    if (state.phase !== "scanning") {
      return;
    }

    const raw = codes[0]?.rawValue;
    const rm = raw ? parsePatientQrValue(raw) : null;
    if (!rm) {
      setState({ phase: "not_found" });
      return;
    }

    const supabase = createClient();
    const { data: patient } = await supabase
      .from("patients")
      .select("*, meal_deliveries(*)")
      .eq("medical_record_number", rm)
      .single<PatientWithDelivery>();

    setState(patient ? { phase: "matched", patient } : { phase: "not_found" });
  }

  async function handleConfirmDelivery() {
    if (state.phase !== "matched") {
      return;
    }

    const deliveryId = state.patient.meal_deliveries[0]?.id;
    if (deliveryId) {
      setConfirming(true);
      const supabase = createClient();
      await supabase
        .from("meal_deliveries")
        .update({ status: "delivered", delivered_at: new Date().toISOString() })
        .eq("id", deliveryId);
      setConfirming(false);
    }

    setState({ phase: "confirmed", patient: state.patient });
  }

  function reset() {
    setState({ phase: "scanning" });
  }

  const sheetOpen = state.phase !== "scanning";

  return (
    <div className="relative flex-1 overflow-hidden bg-black">
      <Scanner
        onScan={handleScan}
        formats={["qr_code"]}
        paused={sheetOpen}
        constraints={{ facingMode: "environment" }}
        styles={{ container: { height: "100%" }, video: { objectFit: "cover" } }}
      >
        {!sheetOpen ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative size-64 rounded-xl border-2 border-white/50">
              <div className="absolute top-0 left-0 size-8 rounded-tl-lg border-t-4 border-l-4 border-secondary" />
              <div className="absolute top-0 right-0 size-8 rounded-tr-lg border-t-4 border-r-4 border-secondary" />
              <div className="absolute bottom-0 left-0 size-8 rounded-bl-lg border-b-4 border-l-4 border-secondary" />
              <div className="absolute right-0 bottom-0 size-8 rounded-br-lg border-r-4 border-b-4 border-secondary" />
            </div>
            <div className="absolute top-1/4 mt-48 px-6 text-center">
              <p className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-lg font-semibold text-white backdrop-blur-md">
                Arahkan Kamera ke QR Pasien
              </p>
            </div>
          </div>
        ) : null}
      </Scanner>

      {/* Bottom verification sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-60 rounded-t-xl bg-surface shadow-[0_-10px_40px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-out",
          sheetOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-outline-variant" />

        {state.phase === "not_found" ? (
          <div className="p-6">
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-error/20 bg-error-container/30 p-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-error text-on-error">
                <Icon name="block" filled />
              </span>
              <div>
                <h3 className="text-xs font-semibold tracking-wider text-error uppercase">Hasil Verifikasi</h3>
                <p className="text-lg font-bold text-on-error-container">Tidak Cocok (Mismatch)</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-on-surface-variant">
              RM di QR ini gak ketemu di sistem. Pastiin QR nempel di pasien yang bener.
            </p>
            <button
              type="button"
              onClick={reset}
              className="h-12 w-full rounded-xl bg-primary font-semibold text-on-primary transition-all active:scale-[0.98]"
            >
              Scan Lagi
            </button>
            <div className="h-8" />
          </div>
        ) : null}

        {state.phase === "confirmed" ? (
          <div className="p-6 text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-secondary text-on-secondary">
              <Icon name="check_circle" filled size={28} />
            </span>
            <p className="mb-1 text-lg font-bold">Delivered</p>
            <p className="mb-6 text-sm text-on-surface-variant">
              {state.patient.patient_name ?? state.patient.medical_record_number} dikonfirmasi.
            </p>
            <button
              type="button"
              onClick={reset}
              className="h-12 w-full rounded-xl bg-primary font-semibold text-on-primary transition-all active:scale-[0.98]"
            >
              Scan Lagi
            </button>
            <div className="h-8" />
          </div>
        ) : null}

        {state.phase === "matched" ? (
          <div className="p-6">
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-secondary/20 bg-secondary-container/30 p-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-on-secondary">
                <Icon name="check_circle" filled />
              </span>
              <div>
                <h3 className="text-xs font-semibold tracking-wider text-secondary uppercase">Hasil Verifikasi</h3>
                <p className="text-lg font-bold text-on-secondary-container">Cocok (Matched)</p>
              </div>
            </div>

            <div className="mb-8 space-y-4">
              <Row label="Nama Pasien" value={state.patient.patient_name ?? "-"} />
              <div className="flex items-start justify-between border-b border-surface-container-highest pb-3">
                <div className="text-sm font-medium text-on-surface-variant">Diet Khusus</div>
                <div className="inline-flex rounded-full bg-tertiary-fixed px-3 py-1 text-sm font-bold text-on-tertiary-fixed-variant">
                  {state.patient.special_diet ?? state.patient.diet_type ?? "-"}
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div className="text-sm font-medium text-on-surface-variant">Ruangan</div>
                <div className="text-right font-semibold">
                  {state.patient.room} / Bed {state.patient.bed ?? "-"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-on-primary transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <Icon name="local_shipping" size={20} />
                {confirming ? "Memproses..." : "Konfirmasi Pengantaran"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="h-12 w-full rounded-xl font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                Batal
              </button>
            </div>
            <div className="h-8" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between border-b border-surface-container-highest pb-3">
      <div className="text-sm font-medium text-on-surface-variant">{label}</div>
      <div className="text-right font-semibold">{value}</div>
    </div>
  );
}
