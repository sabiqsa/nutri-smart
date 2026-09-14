import type { MealPeriod } from "@/types/meal-cutoff";

// Fallback used only when public.meal_cutoffs can't be read (offline-first
// UI hint, or the config row is somehow missing) — the DB is the real
// source of truth; Admin edits it at /admin/meal-cutoff. Keep these in sync
// with supabase/migrations/0010_meal_cutoff.sql's seed values.
export const DEFAULT_DATA_CUTOFF_TIMES: Record<MealPeriod, string> = {
  pagi: "04:00",
  siang: "10:00",
  sore: "14:00",
};

export const DEFAULT_EVALUATION_CUTOFF_TIMES: Record<MealPeriod, string> = {
  pagi: "07:00",
  siang: "12:30",
  sore: "18:00",
};

export const MEAL_PERIOD_ORDER: readonly MealPeriod[] = ["pagi", "siang", "sore"];

export const MEAL_PERIOD_LABEL: Record<MealPeriod, string> = {
  pagi: "Pagi",
  siang: "Siang",
  sore: "Sore",
};

// Hospital ops run on local (WIB) time regardless of where the server
// process runs (Vercel functions default to UTC) — every cut-off
// comparison goes through this timezone.
export const APP_TIMEZONE = "Asia/Jakarta";

// Cron hits this route on a schedule tighter than the cutoffs themselves
// (see vercel.json) — this is how far past a cutoff it'll still fire the
// lock/snapshot for, in case a run gets delayed or skipped.
export const CUTOFF_GRACE_MINUTES = 20;
