'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { CUSTOM_LIQUID_OPTION } from '@/constants/patient-options';
import {
  canDeletePatients,
  canEditPatients,
  getCurrentProfile,
} from '@/libs/supabase/get-profile';
import { createClient } from '@/libs/supabase/server';
import type { AllergyEntry } from '@/types/patient';

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? '').trim();
  return str === '' ? null : str;
}

function emptyToInt(value: FormDataEntryValue | null) {
  const str = String(value ?? '').trim();
  if (str === '') return null;
  const n = Number(str);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function patientFromFormData(formData: FormData) {
  const foodFormDetailRaw = String(
    formData.get('food_form_detail') ?? '',
  ).trim();
  const foodFormDetail =
    foodFormDetailRaw === CUSTOM_LIQUID_OPTION
      ? emptyToNull(formData.get('food_form_detail_custom'))
      : emptyToNull(formData.get('food_form_detail'));

  const allergies: AllergyEntry[] = formData.getAll('allergies').map((raw) => {
    const type = String(raw);
    const detail = String(formData.get(`allergy_detail_${type}`) ?? '').trim();
    return { type, detail };
  });

  const isSpecialRequest = formData.get('is_special_request') === 'true';

  return {
    room: String(formData.get('room') ?? '').trim(),
    bed: emptyToNull(formData.get('bed')),
    medical_record_number: String(
      formData.get('medical_record_number') ?? '',
    ).trim(),
    patient_name: emptyToNull(formData.get('patient_name')),
    date_of_birth: emptyToNull(formData.get('date_of_birth')),
    diet_type: emptyToNull(formData.get('diet_type')),
    special_diet: formData.getAll('special_diet').map(String),
    food_form: emptyToNull(formData.get('food_form')),
    food_form_detail: foodFormDetail,
    frekuensi_makan: emptyToInt(formData.get('frekuensi_makan')),
    food_form_cair_frekuensi: emptyToInt(
      formData.get('food_form_cair_frekuensi'),
    ),
    food_form_cair_kalori: emptyToInt(formData.get('food_form_cair_kalori')),
    food_form_cair_ml: emptyToInt(formData.get('food_form_cair_ml')),
    allergies,
    food_restrictions: formData.getAll('food_restrictions').map(String),
    is_special_request: isSpecialRequest,
    special_request_note: emptyToNull(formData.get('special_request_note')),
    // Refreshes every time a save keeps/sets the flag true — the dashboard's
    // "Permintaan Khusus" panel only shows entries within a configurable
    // recent window (app_settings.urgent_notification_hours), not forever.
    special_request_flagged_at: isSpecialRequest
      ? new Date().toISOString()
      : null,
    notes: emptyToNull(formData.get('notes')),
  };
}

// Postgres unique_violation — surfaced here only for medical_record_number
// (the one unique constraint patients currently has) rather than leaking
// the raw constraint-name error.
function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'No. RM ini sudah digunakan oleh pasien lain.';
  }
  return error.message;
}

export async function createPatient(
  _prevState: string | void | null,
  formData: FormData,
) {
  const profile = await getCurrentProfile();
  if (!canEditPatients(profile?.role ?? null)) {
    return 'Butuh login Ahli Gizi/Admin.';
  }

  const values = patientFromFormData(formData);
  if (!values.room || !values.medical_record_number || !values.food_form) {
    // food_form used to be enforced client-side by a native <select
    // required> — now a Radix Select without real browser constraint
    // validation, so this check carries that requirement server-side.
    return 'Ruangan, No. RM, dan Bentuk Makanan wajib diisi.';
  }
  if (values.is_special_request && !values.special_request_note) {
    return 'Isi keterangan Permintaan Khusus.';
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .insert(values)
    .select('id')
    .single();
  if (error) {
    return friendlyError(error);
  }

  revalidatePath('/patients');
  revalidatePath('/', 'layout'); // refresh the (app) layout's notification bell too
  redirect(`/patients/${data.id}`);
}

export async function updatePatient(
  id: string,
  _prevState: string | void | null,
  formData: FormData,
) {
  const profile = await getCurrentProfile();
  if (!canEditPatients(profile?.role ?? null)) {
    return 'Butuh login Ahli Gizi/Admin.';
  }

  const values = patientFromFormData(formData);
  if (!values.room || !values.medical_record_number || !values.food_form) {
    // food_form used to be enforced client-side by a native <select
    // required> — now a Radix Select without real browser constraint
    // validation, so this check carries that requirement server-side.
    return 'Ruangan, No. RM, dan Bentuk Makanan wajib diisi.';
  }
  if (values.is_special_request && !values.special_request_note) {
    return 'Isi keterangan Permintaan Khusus.';
  }

  const supabase = await createClient();
  const { error } = await supabase.from('patients').update(values).eq('id', id);
  if (error) {
    return friendlyError(error);
  }

  revalidatePath('/patients');
  revalidatePath(`/patients/${id}`);
  // The urgent-notification bell is computed in (app)/layout.tsx — a
  // shared layout above /patients — so revalidating just the page paths
  // above doesn't refresh it. Bust the layout explicitly too.
  revalidatePath('/', 'layout');
  redirect(`/patients/${id}`);
}

// "Close Pasien" — pasien pulang/meninggal, dihapus permanen (bukan
// soft-delete) per keputusan user. Reuses the existing admin-only
// patients_delete_admin RLS policy; diet_history/meal_deliveries cascade
// on delete (0004/0008).
// Signature matches useActionState's (prevState, formData) shape even
// though neither is used — there's nothing in the form besides the confirm
// dialog, the id is already bound.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function closePatient(id: string, _prevState: string | void | null, _formData: FormData) {
  const profile = await getCurrentProfile();
  if (!canDeletePatients(profile?.role ?? null)) {
    return "Butuh login Admin.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) {
    return error.message;
  }

  revalidatePath('/patients');
  revalidatePath('/', 'layout'); // refresh the (app) layout's notification bell too
  redirect('/patients');
}
