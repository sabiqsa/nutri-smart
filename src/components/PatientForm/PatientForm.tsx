"use client";

import { useActionState } from "react";

import type { Patient } from "@/types/patient";

type PatientFormAction = (
  prevState: string | void | null,
  formData: FormData,
) => Promise<string | void | null>;

type PatientFormProps = {
  action: PatientFormAction;
  initial?: Partial<Patient>;
};

export function PatientForm({ action, initial }: PatientFormProps) {
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 p-4">
      <TextField name="room" label="Ruangan" defaultValue={initial?.room ?? ""} required />
      <TextField name="bed" label="Bed" defaultValue={initial?.bed ?? ""} />
      <TextField
        name="medical_record_number"
        label="No. RM"
        defaultValue={initial?.medical_record_number ?? ""}
        required
      />
      <TextField name="patient_name" label="Nama Pasien" defaultValue={initial?.patient_name ?? ""} />
      <TextField
        name="date_of_birth"
        label="Tanggal Lahir"
        type="date"
        defaultValue={initial?.date_of_birth ?? ""}
      />
      <TextField name="diet_type" label="Diet" defaultValue={initial?.diet_type ?? ""} />
      <TextField name="special_diet" label="Diet Khusus" defaultValue={initial?.special_diet ?? ""} />
      <TextField name="food_form" label="Bentuk Makanan" defaultValue={initial?.food_form ?? ""} />
      <TextField
        name="food_form_detail"
        label="Detail Bentuk Makanan"
        defaultValue={initial?.food_form_detail ?? ""}
      />
      <TextField name="allergies" label="Alergi" defaultValue={initial?.allergies ?? ""} />
      <TextField
        name="food_restrictions"
        label="Pantangan Makanan"
        defaultValue={initial?.food_restrictions ?? ""}
      />
      <TextAreaField name="notes" label="Keterangan" defaultValue={initial?.notes ?? ""} />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-card bg-primary py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-on-surface">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="rounded-card border border-outline-variant px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextAreaField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-on-surface">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={3}
        className="rounded-card border border-outline-variant px-3 py-2 text-sm"
      />
    </div>
  );
}
