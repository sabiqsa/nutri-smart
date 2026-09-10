"use client";

import { useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateUserAction = (
  prevState: string | void | null,
  formData: FormData,
) => Promise<string | void | null>;

type Result = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

export function CreateUserForm({ action }: { action: CreateUserAction }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const error = await action(null, formData);
    setPending(false);

    if (error) {
      setResult({ status: "error", message: error });
    } else {
      setResult({ status: "success" });
      formRef.current?.reset();
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-card flex flex-col gap-3 border border-outline-variant bg-surface-container-lowest p-4"
    >
      <span className="text-sm font-medium">Tambah User</span>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Nama lengkap</Label>
        <Input id="full_name" name="full_name" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
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

      {result.status === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Gagal bikin user</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

      {result.status === "success" ? (
        <Alert className="border-primary/40 text-primary">
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription className="text-primary/80">User baru berhasil dibuat.</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
