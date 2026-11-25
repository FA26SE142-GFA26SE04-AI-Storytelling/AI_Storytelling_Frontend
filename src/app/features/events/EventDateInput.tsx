"use client";

import { useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatEventDateInput, parseEventDateInput } from "./eventTime";

export default function EventDateInput({ id, value, onChange, onInvalidChange, includeTime = false, min, max, error }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onInvalidChange?: (invalid: boolean) => void;
  includeTime?: boolean;
  min?: string;
  max?: string;
  error?: string;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [draft, setDraft] = useState<{ text: string; parsed: string } | null>(null);
  const text = draft?.parsed === value ? draft.text : formatEventDateInput(value);
  const placeholder = includeTime ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY";
  const invalidText = Boolean(text.trim() && !value);
  const message = invalidText ? `Nhập ngày hợp lệ theo định dạng ${placeholder}.` : error;

  const updateText = (textValue: string) => {
    const parsed = parseEventDateInput(textValue, includeTime);
    setDraft({ text: textValue, parsed });
    onChange(parsed);
    onInvalidChange?.(Boolean(textValue.trim() && !parsed));
  };

  const openCalendar = () => {
    try {
      if (picker.current?.showPicker) {
        picker.current.showPicker();
        return;
      }
    } catch {
      // Keep typing available when the browser cannot open the native calendar.
    }
    input.current?.focus();
  };

  return (
    <div className="ev-date-field">
      <div className="ev-date-input">
        <input ref={input} id={id} className="inp" type="text" inputMode="numeric" autoComplete="off"
          placeholder={placeholder} value={text} aria-invalid={message ? true : undefined}
          aria-describedby={message ? errorId : undefined}
          onChange={(e) => updateText(e.target.value)}
          onBlur={() => {
            if (value) setDraft(null);
          }} />
        <button type="button" className="btn btn-g icon-only" aria-label="Mở lịch chọn ngày" onClick={openCalendar}>
          <CalendarDays className="ic" aria-hidden="true" />
        </button>
        <input ref={picker} type="date" tabIndex={-1} aria-hidden="true" className="ev-date-native-picker"
          value={value.slice(0, 10)} min={min || undefined} max={max || undefined}
          onChange={(e) => {
            const date = e.target.value;
            const time = includeTime ? (value.slice(11, 16) || "00:00") : "";
            updateText(formatEventDateInput(date && time ? `${date}T${time}` : date));
          }} />
      </div>
      {message && <small id={errorId} className="ev-warn-text">{message}</small>}
    </div>
  );
}
