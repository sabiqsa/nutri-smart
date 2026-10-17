import { redirect } from "next/navigation";

import { MealCutoffForm } from "@/components/MealCutoffForm/MealCutoffForm";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { MEAL_PERIOD_ORDER } from "@/config/meal-cutoff";
import { getCurrentProfile, isAdmin } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { MealCutoffRow } from "@/types/meal-cutoff";

import { updateMealCutoff } from "./actions";

export default async function MealCutoffPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role ?? null)) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: rows } = await supabase.from("meal_cutoffs").select("*").returns<MealCutoffRow[]>();
  const byPeriod = new Map((rows ?? []).map((r) => [r.period, r]));

  return (
    <div>
      <PageHeader title="Cut-off Sesi Makan" backHref="/dashboard" />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 md:px-6">
        <p className="max-w-[65ch] text-sm text-on-surface-variant">
          Perubahan data kebutuhan makan sampai jam cut-off dipakai untuk rekap sesi itu. Lewat dari situ otomatis
          masuk sesi berikutnya. Jam evaluasi distribusi menentukan kapan rekap Berhasil/Pending/Tidak Dibagikan
          digenerate otomatis.
        </p>

        {MEAL_PERIOD_ORDER.map((period) => {
          const row = byPeriod.get(period);
          if (!row) return null;
          return <MealCutoffForm key={period} row={row} action={updateMealCutoff.bind(null, period)} />;
        })}
      </div>
    </div>
  );
}
