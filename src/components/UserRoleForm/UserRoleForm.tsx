"use client";

import { useActionState } from "react";

import type { UserRole } from "@/types/profile";

type UserRoleFormAction = (
  prevState: string | void | null,
  formData: FormData,
) => Promise<string | void | null>;

export function UserRoleForm({
  action,
  currentRole,
}: {
  action: UserRoleFormAction;
  currentRole: UserRole | null;
}) {
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <select
        name="role"
        defaultValue={currentRole ?? ""}
        className="rounded-card border border-outline-variant px-2 py-1 text-sm"
      >
        <option value="">(belum di-assign)</option>
        <option value="perawat">Perawat</option>
        <option value="ahli_gizi">Ahli Gizi</option>
        <option value="produksi">Bagian Produksi</option>
        <option value="distribusi">Bagian Distribusi</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-card bg-primary px-3 py-1 text-xs font-medium text-on-primary disabled:opacity-60"
      >
        {pending ? "..." : "Simpan"}
      </button>
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </form>
  );
}
