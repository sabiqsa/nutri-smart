"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { CUSTOM_LIQUID_OPTION } from "@/constants/patient-options";
import { canEditPatients, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { AllergyEntry } from "@/types/patient";

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

function patientFromFormData(formData: FormData) {
  const foodFormDetailRaw = String(formData.get("food_form_detail") ?? "").trim();
  const foodFormDetail =
    foodFormDetailRaw === CUSTOM_LIQUID_OPTION
      ? emptyToNull(formData.get("food_form_detail_custom"))
      : emptyToNull(formData.get("food_form_detail"));

  const allergies: AllergyEntry[] = formData.getAll("allergies").map((raw) => {
    const type = String(raw);
    const detail = String(formData.get(`allergy_detail_${type}`) ?? "").trim();
    return { type, detail };
  });

  return {
    room: String(formData.get("room") ?? "").trim(),
    bed: emptyToNull(formData.get("bed")),
    medical_record_number: String(formData.get("medical_record_number") ?? "").trim(),
    patient_name: emptyToNull(formData.get("patient_name")),
    date_of_birth: emptyToNull(formData.get("date_of_birth")),
    diet_type: emptyToNull(formData.get("diet_type")),
    special_diet: formData.getAll("special_diet").map(String),
    food_form: emptyToNull(formData.get("food_form")),
    food_form_detail: foodFormDetail,
    allergies,
    food_restrictions: formData.getAll("food_restrictions").map(String),
    is_special_request: formData.get("is_special_request") === "true",
    special_request_note: emptyToNull(formData.get("special_request_note")),
    notes: emptyToNull(formData.get("notes")),
  };
}

export async function createPatient(_prevState: string | void | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!canEditPatients(profile?.role ?? null)) {
    return "Butuh login Ahli Gizi/Admin.";
  }

  const values = patientFromFormData(formData);
  if (!values.room || !values.medical_record_number || !values.food_form) {
    // food_form used to be enforced client-side by a native <select
    // required> — now a Radix Select without real browser constraint
    // validation, so this check carries that requirement server-side.
    return "Ruangan, No. RM, dan Bentuk Makanan wajib diisi.";
  }
  if (values.is_special_request && !values.special_request_note) {
    return "Isi keterangan Permintaan Khusus.";
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("patients").insert(values).select("id").single();
  if (error) {
    return error.message;
  }

  revalidatePath("/patients");
  redirect(`/patients/${data.id}`);
}

export async function updatePatient(id: string, _prevState: string | void | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!canEditPatients(profile?.role ?? null)) {
    return "Butuh login Ahli Gizi/Admin.";
  }

  const values = patientFromFormData(formData);
  if (!values.room || !values.medical_record_number || !values.food_form) {
    // food_form used to be enforced client-side by a native <select
    // required> — now a Radix Select without real browser constraint
    // validation, so this check carries that requirement server-side.
    return "Ruangan, No. RM, dan Bentuk Makanan wajib diisi.";
  }
  if (values.is_special_request && !values.special_request_note) {
    return "Isi keterangan Permintaan Khusus.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("patients").update(values).eq("id", id);
  if (error) {
    return error.message;
  }

  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
  redirect(`/patients/${id}`);
}
