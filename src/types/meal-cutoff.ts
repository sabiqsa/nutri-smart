export type MealPeriod = "pagi" | "siang" | "sore";

// Mirrors supabase/migrations/0010_meal_cutoff.sql's public.meal_cutoffs.
export type MealCutoffRow = {
  period: MealPeriod;
  data_cutoff_time: string; // "HH:MM:SS", Postgres `time` comes back as text
  distribution_start_time: string;
  distribution_end_time: string;
  evaluation_cutoff_time: string;
  updated_at: string;
  updated_by: string | null;
};

export type MealPeriodLock = {
  id: string;
  lock_date: string;
  period: MealPeriod;
  locked_at: string;
};

export type DistributionSnapshot = {
  id: string;
  snapshot_date: string;
  period: MealPeriod;
  berhasil_count: number;
  pending_count: number;
  tidak_dibagikan_count: number;
  total_count: number;
  generated_at: string;
};
