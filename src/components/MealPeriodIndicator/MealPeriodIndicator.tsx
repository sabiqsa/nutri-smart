"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/Icon/Icon";
import { MEAL_PERIOD_LABEL } from "@/config/meal-cutoff";
import { getMealPeriodForTimestamp, type MealCutoffTimes } from "@/utils/meal-period";

/** Live "perubahan ini akan masuk ke sesi X" hint for Perawat/Ahli Gizi
 *  editing patient data near/across a cut-off. Recomputed every 30s so it
 *  doesn't need a page reload to flip across a cut-off boundary while the
 *  form is open. */
export function MealPeriodIndicator({ cutoffTimes }: { cutoffTimes: MealCutoffTimes }) {
  // Lazy initializer runs at render time (client and, briefly, server) —
  // a hint text like this tolerates the rare hydration mismatch if a
  // cut-off boundary is crossed in the split-second between SSR and
  // hydration, so it's not worth the extra effect-driven "loading" state.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { period, rolledToNextDay } = getMealPeriodForTimestamp(now, cutoffTimes);
  const cutoff = cutoffTimes[period];

  return (
    <p className="rounded-card flex items-center gap-2 border border-primary/30 bg-primary-fixed px-3 py-2 text-xs text-on-primary-fixed-variant">
      <Icon name="schedule" size={16} />
      Perubahan sekarang akan masuk ke rekap kebutuhan makan{" "}
      <strong>{rolledToNextDay ? `${MEAL_PERIOD_LABEL[period]} besok` : MEAL_PERIOD_LABEL[period]}</strong>{" "}
      (cut-off {cutoff}).
    </p>
  );
}
