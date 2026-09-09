"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateUserAction = (
  prevState: string | void | null,
  formData: FormData,
) => Promise<string | void | null>;

export function CreateUserForm({ action }: { action: CreateUserAction }) {
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="rounded-card flex flex-col gap-3 border border-outline-variant bg-surface-container-lowest p-4"
    >
      <span className="text-sm font-medium">Tambah User</span>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Nama lengkap</Label>
        <Input id="full_name" name="full_name" placeholder="Nama lengkap" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="Email" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Min. 6 karakter"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Role</Label>
        <Select name="role" defaultValue="none">
          <SelectTrigger id="role" className="w-full">
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
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Membuat..." : "Buat User"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </form>
  );
}
