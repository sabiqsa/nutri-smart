"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = (prevState: string | void | null, formData: FormData) => Promise<string | void | null>;

export function UrgentNotificationForm({ currentHours, action }: { currentHours: number; action: Action }) {
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="rounded-card flex flex-col gap-3 border border-outline-variant bg-surface-container-lowest p-4"
    >
      <div>
        <span className="text-sm font-semibold text-primary">Pemberitahuan Mendesak</span>
        <p className="text-xs text-on-surface-variant">
          Durasi &ldquo;Permintaan Khusus&rdquo; tetep nongol di Dashboard sejak terakhir disimpan, sebelum
          ke-geser/ilang dari daftar itu.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="urgent_notification_hours">Durasi (jam)</Label>
        <Input
          id="urgent_notification_hours"
          name="urgent_notification_hours"
          type="number"
          min={1}
          required
          defaultValue={currentHours}
          className="max-w-32"
        />
      </div>

      <Button type="submit" size="sm" className="self-start" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
