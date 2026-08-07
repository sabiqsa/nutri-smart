"use client";

import Link from "next/link";

// Spec asks for Save/Update/Reset/Cancel on the print page, but a label has
// no separate saved record of its own — it always reflects the live patient
// row (editing happens on the patient form, not here). Simplified to what
// actually applies: Cetak (print) + Cancel.
export function PrintActions({ cancelHref }: { cancelHref: string }) {
  return (
    <div className="mt-4 flex gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-card flex-1 bg-primary py-2 text-sm font-semibold text-on-primary"
      >
        Cetak
      </button>
      <Link
        href={cancelHref}
        className="rounded-card flex-1 border border-outline-variant py-2 text-center text-sm font-medium text-on-surface-variant"
      >
        Batal
      </Link>
    </div>
  );
}
