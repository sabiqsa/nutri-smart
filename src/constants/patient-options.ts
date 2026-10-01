// Master data for patient form dropdowns. Centralized here (not hardcoded
// per-field in the form) so it's a one-file edit if the hospital's ward
// list / diet catalogue changes. Mirrored by CHECK constraints in
// supabase/migrations/0006_patient_master_data.sql — keep both in sync.

export const ROOM_OPTIONS = [
  "ICU DEWASA",
  "CVC",
  "IW MEDIK",
  "IW BEDAH",
  "PAV SUKAMAN",
  "SILVER-VENTRIKEL",
  "RAWAT ANAK",
  "ICU ANAK",
  "IW ANAK",
  "GP 2 LT 3",
  "GP 2 LT 4",
  "GP 2 LT 5",
  "IGD",
  "HD",
  "ODC",
] as const;

// Diet Jantung 900–2400 KKAL (step 100) interleaved with ETPT 2300/2400,
// sorted ascending by kcal (confirmed with user: step 100, Diet Jantung
// before ETPT at the same kcal).
export const DIET_UTAMA_OPTIONS = [
  "Diet Jantung 900 KKAL",
  "Diet Jantung 1000 KKAL",
  "Diet Jantung 1100 KKAL",
  "Diet Jantung 1200 KKAL",
  "Diet Jantung 1300 KKAL",
  "Diet Jantung 1400 KKAL",
  "Diet Jantung 1500 KKAL",
  "Diet Jantung 1600 KKAL",
  "Diet Jantung 1700 KKAL",
  "Diet Jantung 1800 KKAL",
  "Diet Jantung 1900 KKAL",
  "Diet Jantung 2000 KKAL",
  "Diet Jantung 2100 KKAL",
  "Diet Jantung 2200 KKAL",
  "Diet Jantung 2300 KKAL",
  "ETPT 2300 KKAL",
  "Diet Jantung 2400 KKAL",
  "ETPT 2400 KKAL",
] as const;

export const DIET_KHUSUS_OPTIONS = [
  "DM",
  "RP 30",
  "RP 35",
  "RP 40",
  "RP 45",
  "RP 50",
  "Rendah Cholesterol Lemak Terbatas",
  "Rendah Purin",
  "Rendah Kalium",
  "Tinggi Kalium",
  "Rendah Garam I",
  "Low Fat",
  "Non Fat",
] as const;

export const FOOD_FORM_OPTIONS = ["CAIR", "SARING", "BUBUR", "TIM", "BIASA", "BIASA ANAK"] as const;

// Frekuensi makan (per hari) — dipake buat field umum "Frekuensi Makan" dan
// field khusus "Frekuensi Makanan Cair". SelectField kerjanya pake string
// value, jadi angka di sini ditulis sebagai string (actions.ts yang parse
// balik jadi integer sebelum masuk DB).
export const FREKUENSI_MAKAN_OPTIONS = ["2", "3", "4", "5", "6", "7", "8"] as const;

export const CUSTOM_LIQUID_OPTION = "Susu Formula (Pribadi)";

export const FOOD_FORM_CAIR_OPTIONS = [
  "Goldsure",
  "Entramix",
  "Proten",
  "Diabetasol",
  "Nephrisol",
  "Peptisol",
  "Peptamen",
  "SGM Ananda",
  "SGM Eksplore",
  "Entrakid",
  "SGM LLM",
  "SGM Gain 100",
  "SGM Gain Optigrow",
  "SGM Soya",
  "Nutrinidrink",
  "Pepticate",
  "Peptamen Junior",
  "Neocate",
  "Proteed",
  CUSTOM_LIQUID_OPTION,
] as const;

export const FOOD_FORM_SARING_OPTIONS = ["SUM SUM", "TIM BLENDER", "BLENDER CAMPUR", "NESTLE", "CREAMSUP"] as const;

export const ALLERGY_OPTIONS = [
  "IKAN",
  "SEAFOOD",
  "SUSU SAPI",
  "KACANG-KACANGAN",
  "TELUR",
  "AYAM",
  "DAGING SAPI",
  "GLUTEN",
] as const;

// Pantangan Makanan re-uses the same catalogue as Alergi (confirmed in spec).
export const FOOD_RESTRICTION_OPTIONS = ALLERGY_OPTIONS;
