"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = (prevState: string | void | null, formData: FormData) => Promise<string | void | null>;

export function MarkNotDistributedForm({ action }: { action: Action }) {
  const [open, setOpen] = useState(false);
  const [error, formAction, pending] = useActionState(action, null);

  if (!open) {
    return (
      <Button type="button" variant="link" className="h-auto p-0 text-error" onClick={() => setOpen(true)}>
        Tandai Tidak Dibagikan
      </Button>
    );
  }

  return (
    <form action={formAction} className="rounded-card flex flex-col gap-2 border border-error bg-error-container/20 p-3">
      <Label htmlFor="reason" className="text-xs text-on-error-container">
        Alasan tidak dibagikan
      </Label>
      <Textarea
        id="reason"
        name="reason"
        required
        rows={2}
        placeholder="Contoh: Pasien puasa pre-op / sudah pulang"
      />
      {error ? <p className="text-xs text-error">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={pending}>
          {pending ? "Menyimpan..." : "Konfirmasi"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
