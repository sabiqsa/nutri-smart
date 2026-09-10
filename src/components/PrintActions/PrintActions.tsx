"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// Spec asks for Save/Update/Reset/Cancel on the print page, but a label has
// no separate saved record of its own — it always reflects the live patient
// row (editing happens on the patient form, not here). Simplified to what
// actually applies: Cetak (print) + Cancel.
export function PrintActions({ cancelHref }: { cancelHref: string }) {
  return (
    <div className="mt-4 flex gap-2 print:hidden">
      <Button type="button" className="h-auto flex-1 py-2" onClick={() => window.print()}>
        Cetak
      </Button>
      <Button asChild type="button" variant="outline" className="h-auto flex-1 py-2">
        <Link href={cancelHref}>Batal</Link>
      </Button>
    </div>
  );
}
