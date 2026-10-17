"use client";

import { useActionState, useRef } from "react";

import { Button } from "@/components/ui/button";

type Action = (prevState: string | void | null, formData: FormData) => Promise<string | void | null>;

// Hard delete (per hospital's call: pasien pulang/meninggal -> data hilang
// permanen, bukan soft-close) — a native confirm() is the last guard before
// an irreversible action, cheap and good enough without pulling in an
// AlertDialog component for a single use site.
export function ClosePatientButton({ action, patientName }: { action: Action; patientName: string }) {
  const [error, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Tutup data pasien "${patientName}"? Ini menghapus datanya PERMANEN (termasuk riwayat diet). Pastiin pasien emang udah pulang/meninggal.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <Button type="submit" variant="destructive" size="sm" className="w-full" disabled={pending}>
        {pending ? "Menutup..." : "Close Pasien"}
      </Button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
