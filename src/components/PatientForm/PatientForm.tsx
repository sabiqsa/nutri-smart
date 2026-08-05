"use client";

import { useActionState, useState } from "react";

import {
  ALLERGY_OPTIONS,
  CUSTOM_LIQUID_OPTION,
  DIET_KHUSUS_OPTIONS,
  DIET_UTAMA_OPTIONS,
  FOOD_FORM_CAIR_OPTIONS,
  FOOD_FORM_OPTIONS,
  FOOD_FORM_SARING_OPTIONS,
  FOOD_RESTRICTION_OPTIONS,
  ROOM_OPTIONS,
} from "@/constants/patient-options";
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

  const [foodForm, setFoodForm] = useState(initial?.food_form ?? "");
  const [foodFormDetail, setFoodFormDetail] = useState(initial?.food_form_detail ?? "");
  const [customLiquid] = useState(
    foodForm === "CAIR" && initial?.food_form_detail && !isKnownLiquidOption(initial.food_form_detail)
      ? initial.food_form_detail
      : "",
  );

  const initialAllergyMap = new Map((initial?.allergies ?? []).map((a) => [a.type, a.detail]));
  const [checkedAllergies, setCheckedAllergies] = useState<Set<string>>(new Set(initialAllergyMap.keys()));
  const [allergyDetails, setAllergyDetails] = useState<Map<string, string>>(initialAllergyMap);

  const [isSpecialRequest, setIsSpecialRequest] = useState(initial?.is_special_request ?? false);

  function toggleAllergy(type: string, checked: boolean) {
    setCheckedAllergies((prev) => {
      const next = new Set(prev);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4">
      <SelectField name="room" label="Ruangan" defaultValue={initial?.room ?? ""} options={ROOM_OPTIONS} required />
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

      <SelectField
        name="diet_type"
        label="Diet Utama"
        defaultValue={initial?.diet_type ?? ""}
        options={DIET_UTAMA_OPTIONS}
      />

      <CheckboxGroup
        legend="Diet Khusus (opsional, boleh lebih dari satu)"
        name="special_diet"
        options={DIET_KHUSUS_OPTIONS}
        defaultChecked={initial?.special_diet ?? []}
      />

      <SelectField
        name="food_form"
        label="Bentuk Makanan"
        defaultValue={foodForm}
        options={FOOD_FORM_OPTIONS}
        onChange={(v) => {
          setFoodForm(v);
          setFoodFormDetail("");
        }}
        required
      />

      {foodForm === "CAIR" ? (
        <div className="flex flex-col gap-2">
          <SelectField
            name="food_form_detail"
            label="Opsi Makanan Cair"
            defaultValue={foodFormDetail}
            options={FOOD_FORM_CAIR_OPTIONS}
            onChange={setFoodFormDetail}
          />
          {foodFormDetail === CUSTOM_LIQUID_OPTION ? (
            <TextField
              name="food_form_detail_custom"
              label="Nama Susu Formula (Pribadi)"
              defaultValue={customLiquid}
            />
          ) : null}
        </div>
      ) : null}

      {foodForm === "SARING" ? (
        <SelectField
          name="food_form_detail"
          label="Opsi Makanan Saring"
          defaultValue={foodFormDetail}
          options={FOOD_FORM_SARING_OPTIONS}
          onChange={setFoodFormDetail}
        />
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-on-surface">Alergi Makanan (opsional)</legend>
        {ALLERGY_OPTIONS.map((option) => (
          <div key={option} className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allergies"
                value={option}
                defaultChecked={checkedAllergies.has(option)}
                onChange={(e) => toggleAllergy(option, e.target.checked)}
              />
              {option}
            </label>
            {checkedAllergies.has(option) ? (
              <input
                type="text"
                name={`allergy_detail_${option}`}
                placeholder="Keterangan (contoh: gatal ringan)"
                defaultValue={allergyDetails.get(option) ?? ""}
                onChange={(e) => setAllergyDetails((prev) => new Map(prev).set(option, e.target.value))}
                className="rounded-card ml-6 border border-outline-variant px-3 py-1.5 text-sm"
              />
            ) : null}
          </div>
        ))}
      </fieldset>

      <CheckboxGroup
        legend="Pantangan Makanan (opsional, boleh lebih dari satu)"
        name="food_restrictions"
        options={FOOD_RESTRICTION_OPTIONS}
        defaultChecked={initial?.food_restrictions ?? []}
      />

      <div className="rounded-card flex flex-col gap-2 border border-outline-variant p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="is_special_request"
            value="true"
            checked={isSpecialRequest}
            onChange={(e) => setIsSpecialRequest(e.target.checked)}
          />
          Permintaan Khusus
        </label>
        {isSpecialRequest ? (
          <textarea
            name="special_request_note"
            placeholder="Jelasin permintaan khususnya — muncul di Pemberitahuan Mendesak"
            defaultValue={initial?.special_request_note ?? ""}
            rows={2}
            required
            className="rounded-card border border-outline-variant px-3 py-2 text-sm"
          />
        ) : null}
      </div>

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

function isKnownLiquidOption(value: string) {
  return (FOOD_FORM_CAIR_OPTIONS as readonly string[]).includes(value);
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

function SelectField({
  name,
  label,
  defaultValue,
  options,
  required,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: readonly string[];
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-on-surface">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
        className="rounded-card border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
      >
        <option value="">(pilih)</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxGroup({
  legend,
  name,
  options,
  defaultChecked,
}: {
  legend: string;
  name: string;
  options: readonly string[];
  defaultChecked: string[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-on-surface">{legend}</legend>
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={name} value={option} defaultChecked={defaultChecked.includes(option)} />
          {option}
        </label>
      ))}
    </fieldset>
  );
}
