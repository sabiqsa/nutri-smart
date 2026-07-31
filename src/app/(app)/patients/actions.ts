"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canEditPatients, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

function patientFromFormData(formData: FormData) {
  return {
    room: String(formData.get("room") ?? "").trim(),
    bed: emptyToNull(formData.get("bed")),
    medical_record_number: String(formData.get("medical_record_number") ?? "").trim(),
    patient_name: emptyToNull(formData.get("patient_name")),
    date_of_birth: emptyToNull(formData.get("date_of_birth")),
    diet_type: emptyToNull(formData.get("diet_type")),
    special_diet: emptyToNull(formData.get("special_diet")),
    food_form: emptyToNull(formData.get("food_form")),
    food_form_detail: emptyToNull(formData.get("food_form_detail")),
    allergies: emptyToNull(formData.get("allergies")),
    food_restrictions: emptyToNull(formData.get("food_restrictions")),
    notes: emptyToNull(formData.get("notes")),
  };
}

export async function createPatient(_prevState: string | void | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!canEditPatients(profile)) {
    return "Butuh login Ahli Gizi/Admin.";
  }

  const values = patientFromFormData(formData);
  if (!values.room || !values.medical_record_number) {
    return "Ruangan dan No. RM wajib diisi.";
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
  if (!canEditPatients(profile)) {
    return "Butuh login Ahli Gizi/Admin.";
  }

  const values = patientFromFormData(formData);
  if (!values.room || !values.medical_record_number) {
    return "Ruangan dan No. RM wajib diisi.";
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
