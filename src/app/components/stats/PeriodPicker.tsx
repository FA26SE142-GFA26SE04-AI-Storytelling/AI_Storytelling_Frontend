'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { CalendarRange } from 'lucide-react';
import {
  Period,
  PeriodPreset,
  PRESET_LABEL,
  presetPeriod,
  customPeriod,
  isValidRange,
} from '@/app/lib/monthPeriods';
import './PeriodPicker.css';

const PRESETS: PeriodPreset[] = ['thisMonth', 'lastMonth', 'last3Months', 'custom'];

export default function PeriodPicker({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const [draftStart, setDraftStart] = useState(value.start);
  const [draftEnd, setDraftEnd] = useState(value.end);

  useEffect(() => {
    setDraftStart(value.start);
    setDraftEnd(value.end);
  }, [value.start, value.end]);

  const handlePresetClick = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      const start = draftStart || value.start;
      const end = draftEnd || value.end;
      onChange(customPeriod(start, end));
    } else {
      onChange(presetPeriod(preset));
    }
  };

  const handleStartChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextStart = e.target.value;
    setDraftStart(nextStart);
    if (isValidRange(nextStart, draftEnd)) {
      onChange(customPeriod(nextStart, draftEnd));
    }
  };

  const handleEndChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextEnd = e.target.value;
    setDraftEnd(nextEnd);
    if (isValidRange(draftStart, nextEnd)) {
      onChange(customPeriod(draftStart, nextEnd));
    }
  };

  const hasError =
    value.preset === 'custom' &&
    Boolean(draftStart && draftEnd && draftEnd < draftStart);

  return (
    <div className="period-picker">
      <CalendarRange className="ic" aria-hidden="true" />
      {PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className={`btn btn-s${value.preset === preset ? ' on' : ''}`}
          onClick={() => handlePresetClick(preset)}
        >
          {PRESET_LABEL[preset]}
        </button>
      ))}

      {value.preset === 'custom' && (
        <>
          <input
            type="date"
            className="inp"
            aria-label="Từ ngày"
            value={draftStart}
            onChange={handleStartChange}
          />
          <input
            type="date"
            className="inp"
            aria-label="Đến ngày"
            value={draftEnd}
            onChange={handleEndChange}
          />
        </>
      )}

      {hasError && (
        <span className="notice warn">
          Ngày kết thúc phải bằng hoặc sau ngày bắt đầu
        </span>
      )}
    </div>
  );
}
