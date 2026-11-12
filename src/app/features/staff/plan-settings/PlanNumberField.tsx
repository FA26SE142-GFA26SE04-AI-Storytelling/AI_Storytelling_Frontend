"use client";

export interface PlanNumberFieldProps {
  label: string;
  value: number | string;
  onChange: (raw: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  suffix?: string;
  required?: boolean;
}

export default function PlanNumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  suffix,
  required,
}: PlanNumberFieldProps) {
  return (
    <label className="cp-field">
      <span className="lbl">{label}</span>
      <span className="cp-num-row">
        <input
          className="inp"
          type="number"
          min={min}
          max={max}
          step={step ?? 1}
          placeholder={placeholder}
          value={value ?? ""}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="cp-suffix">{suffix}</span>}
      </span>
    </label>
  );
}
