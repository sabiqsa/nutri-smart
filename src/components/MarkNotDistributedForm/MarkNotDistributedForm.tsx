"use client";

import { useActionState, useState } from "react";

type Action = (prevState: string | void | null, formData: FormData) => Promise<string | void | null>;

export function MarkNotDistributedForm({ action }: { action: Action }) {
  const [open, setOpen] = useState(false);
  const [error, formAction, pending] = useActionState(action, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-error"
      >
        Tandai Tidak Dibagikan
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-card flex flex-col gap-2 border border-error bg-error-container/20 p-3">
      <label htmlFor="reason" className="text-xs font-medium text-on-error-container">
        Alasan tidak dibagikan
      </label>
      <textarea
        id="reason"
        name="reason"
        required
        rows={2}
        placeholder="Contoh: Pasien puasa pre-op / sudah pulang"
        className="rounded-card border border-outline-variant px-3 py-2 text-sm"
      />
      {error ? <p className="text-xs text-error">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-card bg-error px-3 py-1.5 text-xs font-semibold text-on-error disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Konfirmasi"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-card px-3 py-1.5 text-xs font-medium text-on-surface-variant"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
