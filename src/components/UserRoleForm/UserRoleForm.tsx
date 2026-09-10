"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <Select name="role" defaultValue={currentRole ?? "none"}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="(belum di-assign)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">(belum di-assign)</SelectItem>
          <SelectItem value="perawat">Perawat</SelectItem>
          <SelectItem value="ahli_gizi">Ahli Gizi</SelectItem>
          <SelectItem value="produksi">Bagian Produksi</SelectItem>
          <SelectItem value="distribusi">Bagian Distribusi</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "..." : "Simpan"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </form>
  );
}
