import { DEFAULT_DATA_CUTOFF_TIMES } from "@/config/meal-cutoff";
import { createClient } from "@/libs/supabase/server";
import type { MealCutoffRow } from "@/types/meal-cutoff";
import type { MealCutoffTimes } from "@/utils/meal-period";

/** Live public.meal_cutoffs data_cutoff_time per period, falling back to
 *  the seed defaults if the table is empty/unreachable — used to feed the
 *  "perubahan ini masuk ke sesi X" indicator on patient forms. */
export async function getDataCutoffTimes(): Promise<MealCutoffTimes> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_cutoffs")
    .select("period, data_cutoff_time")
    .returns<Pick<MealCutoffRow, "period" | "data_cutoff_time">[]>();

  if (!data || data.length === 0) {
    return DEFAULT_DATA_CUTOFF_TIMES;
  }

  const result = { ...DEFAULT_DATA_CUTOFF_TIMES };
  for (const row of data) {
    result[row.period] = row.data_cutoff_time.slice(0, 5);
  }
  return result;
}
