export type AllergyEntry = {
  type: string;
  detail: string;
};

export type Patient = {
  id: string;
  room: string;
  bed: string | null;
  medical_record_number: string;
  patient_name: string | null;
  date_of_birth: string | null;
  diet_type: string | null;
  special_diet: string[] | null;
  food_form: string | null;
  food_form_detail: string | null;
  frekuensi_makan: number | null;
  food_form_cair_frekuensi: number | null;
  food_form_cair_kalori: number | null;
  food_form_cair_ml: number | null;
  allergies: AllergyEntry[];
  food_restrictions: string[] | null;
  notes: string | null;
  is_special_request: boolean;
  special_request_note: string | null;
  special_request_flagged_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DistributionStatus = "pending" | "ready" | "delivered" | "not_distributed";

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
