export type FoodForm = "CAIR" | "SARING" | "BUBUR" | "TIM" | "BIASA";

export type Patient = {
  id: string;
  room: string;
  bed: string | null;
  medical_record_number: string;
  patient_name: string | null;
  date_of_birth: string | null;
  diet_type: string | null;
  special_diet: string | null;
  food_form: string | null;
  food_form_detail: string | null;
  allergies: string | null;
  food_restrictions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DistributionStatus = "pending" | "ready" | "delivered";

export type MealDelivery = {
  id: string;
  patient_id: string;
  status: DistributionStatus;
  delivered_at: string | null;
  mismatch: boolean;
  mismatch_note: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientWithDelivery = Patient & {
  meal_deliveries: MealDelivery[];
};
