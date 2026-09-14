"use client";

import { useActionState, useState } from "react";

import { MealPeriodIndicator } from "@/components/MealPeriodIndicator/MealPeriodIndicator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MealCutoffTimes } from "@/utils/meal-period";
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

// Radix Select items can't have an empty-string value — this sentinel
// stands in for "(pilih)"/unselected and gets translated back to "" (which
// patientFromFormData's emptyToNull() already treats as unset) via a hidden
// input, instead of letting the literal sentinel reach the server action.
const UNSET = "__unset__";

type PatientFormAction = (
  prevState: string | void | null,
  formData: FormData,
) => Promise<string | void | null>;

type PatientFormProps = {
  action: PatientFormAction;
  initial?: Partial<Patient>;
  cutoffTimes?: MealCutoffTimes;
};

export function PatientForm({ action, initial, cutoffTimes }: PatientFormProps) {
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
    <form action={formAction} className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
      {cutoffTimes ? <MealPeriodIndicator cutoffTimes={cutoffTimes} /> : null}

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
              <Checkbox
                name="allergies"
                value={option}
                defaultChecked={checkedAllergies.has(option)}
                onCheckedChange={(checked) => toggleAllergy(option, checked === true)}
              />
              {option}
            </label>
            {checkedAllergies.has(option) ? (
              <Input
                type="text"
                name={`allergy_detail_${option}`}
                placeholder="Keterangan (contoh: gatal ringan)"
                defaultValue={allergyDetails.get(option) ?? ""}
                onChange={(e) => setAllergyDetails((prev) => new Map(prev).set(option, e.target.value))}
                className="ml-6 w-auto"
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
          <Checkbox
            name="is_special_request"
            value="true"
            checked={isSpecialRequest}
            onCheckedChange={(checked) => setIsSpecialRequest(checked === true)}
          />
          Permintaan Khusus
        </label>
        {isSpecialRequest ? (
          <Textarea
            name="special_request_note"
            placeholder="Jelasin permintaan khususnya — muncul di Pemberitahuan Mendesak"
            defaultValue={initial?.special_request_note ?? ""}
            rows={2}
            required
          />
        ) : null}
      </div>

      <TextAreaField name="notes" label="Keterangan" defaultValue={initial?.notes ?? ""} />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
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
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
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
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} rows={3} />
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
  const [value, setValue] = useState(defaultValue || UNSET);

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onChange?.(v === UNSET ? "" : v);
        }}
      >
        <SelectTrigger id={name} className="w-full">
          <SelectValue placeholder="(pilih)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>(pilih)</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Select's own Radix-managed hidden input would submit the raw
          sentinel — carry the translated (possibly empty) value ourselves
          instead, same contract the server action already expects. */}
      <input type="hidden" name={name} value={value === UNSET ? "" : value} />
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
          <Checkbox name={name} value={option} defaultChecked={defaultChecked.includes(option)} />
          {option}
        </label>
      ))}
    </fieldset>
  );
}
