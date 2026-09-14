import { APP_TIMEZONE, DEFAULT_DATA_CUTOFF_TIMES, MEAL_PERIOD_ORDER } from "@/config/meal-cutoff";
import type { MealPeriod } from "@/types/meal-cutoff";

export type MealCutoffTimes = Record<MealPeriod, string>;

export type MealPeriodResult = {
  period: MealPeriod;
  /** true when the change fell after the last cutoff of the day and rolled
   *  into the next calendar day's first period (e.g. after 14:00 -> besok pagi). */
  rolledToNextDay: boolean;
};

/**
 * Buckets a "kebutuhan makan" change timestamp into the meal period whose
 * rekap it counts toward, per the cut-off rule:
 *
 *   - up to and including a period's cut-off -> that period's rekap
 *   - after a period's cut-off -> the next period (or, after the last
 *     period's cut-off of the day, the first period of the *next* day)
 *
 * `cutoffTimes` are "HH:MM" (or "HH:MM:SS") wall-clock times in
 * `timeZone` — defaults to the app's seed config and Asia/Jakarta, but the
 * caller should pass the live public.meal_cutoffs values where available.
 */
export function getMealPeriodForTimestamp(
  timestamp: Date | string | number,
  cutoffTimes: MealCutoffTimes = DEFAULT_DATA_CUTOFF_TIMES,
  timeZone: string = APP_TIMEZONE,
): MealPeriodResult {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const minuteOfDay = getMinuteOfDay(date, timeZone);

  const ordered = [...MEAL_PERIOD_ORDER]
    .map((period) => ({ period, cutoffMinutes: toMinutes(cutoffTimes[period]) }))
    .sort((a, b) => a.cutoffMinutes - b.cutoffMinutes);

  for (const entry of ordered) {
    if (minuteOfDay <= entry.cutoffMinutes) {
      return { period: entry.period, rolledToNextDay: false };
    }
  }

  // Past every cut-off today -> rolls to the earliest period, tomorrow.
  return { period: ordered[0].period, rolledToNextDay: true };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => Number(n));
  return h * 60 + (m || 0);
}

function getMinuteOfDay(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // avoid ICU's "24:00" midnight quirk from h24
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}
