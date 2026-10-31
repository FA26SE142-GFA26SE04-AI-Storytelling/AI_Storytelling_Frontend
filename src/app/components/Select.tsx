"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption<T extends string> = { value: T; label: string };

/** Ô chọn có danh sách thả xuống theo giao diện của app, thay cho <select> gốc của trình duyệt. */
export default function Select<T extends string>({ value, options, onChange, placeholder, ariaLabel, className }: {
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const cur = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [open]);

  const openList = () => { setHi(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true); };
  const pick = (v: T) => { onChange(v); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { openList(); return; }
      setHi((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if ((e.key === "Enter" || e.key === " ") && open && hi >= 0) {
      e.preventDefault();
      pick(options[hi].value);
    }
  };

  return (
    <div className={`sel${className ? ` ${className}` : ""}`} ref={root} onKeyDown={onKey}>
      <button type="button" className={`inp sel-btn${open ? " open" : ""}`} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => (open ? setOpen(false) : openList())}>
        <span className={cur ? "" : "sel-ph"}>{cur?.label ?? placeholder ?? ""}</span>
        <ChevronDown className="ic sel-chev" />
      </button>
      {open && (
        <ul className="sel-list" role="listbox" aria-label={ariaLabel}>
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value} className={`sel-opt${i === hi ? " hi" : ""}${o.value === value ? " on" : ""}`} onMouseEnter={() => setHi(i)} onMouseDown={(e) => { e.preventDefault(); pick(o.value); }}>
              <span>{o.label}</span>{o.value === value && <Check className="ic" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
