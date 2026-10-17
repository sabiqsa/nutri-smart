"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEAL_PERIOD_LABEL } from "@/config/meal-cutoff";
import type { MealCutoffRow } from "@/types/meal-cutoff";

type Action = (prevState: string | void | null, formData: FormData) => Promise<string | void | null>;

function toHHMM(time: string): string {
  return time.slice(0, 5);
}

export function MealCutoffForm({ row, action }: { row: MealCutoffRow; action: Action }) {
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
    >
      <h2 className="text-base font-semibold">{MEAL_PERIOD_LABEL[row.period]}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${row.period}-data_cutoff_time`}>Cut-off Data Kebutuhan</Label>
          <Input
            id={`${row.period}-data_cutoff_time`}
            name="data_cutoff_time"
            type="time"
            required
            defaultValue={toHHMM(row.data_cutoff_time)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${row.period}-evaluation_cutoff_time`}>Cut-off Evaluasi Distribusi</Label>
          <Input
            id={`${row.period}-evaluation_cutoff_time`}
            name="evaluation_cutoff_time"
            type="time"
            required
            defaultValue={toHHMM(row.evaluation_cutoff_time)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${row.period}-distribution_start_time`}>Mulai Distribusi</Label>
          <Input
            id={`${row.period}-distribution_start_time`}
            name="distribution_start_time"
            type="time"
            required
            defaultValue={toHHMM(row.distribution_start_time)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${row.period}-distribution_end_time`}>Selesai Distribusi</Label>
          <Input
            id={`${row.period}-distribution_end_time`}
            name="distribution_end_time"
            type="time"
            required
            defaultValue={toHHMM(row.distribution_end_time)}
          />
        </div>
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
