"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption<T extends string> = { value: T; label: string };

type PortalPos = { top?: number; bottom?: number; left: number; width: number; maxHeight: number };

function measurePortalPos(btn: HTMLButtonElement | null): PortalPos | null {
  if (!btn || typeof window === "undefined") return null;
  const r = btn.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - r.bottom - 12;
  const spaceAbove = r.top - 12;
  const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(120, Math.min(280, openAbove ? spaceAbove : spaceBelow));
  const width = Math.min(r.width, vw - 16);
  const left = Math.max(8, Math.min(r.left, vw - width - 8));
  return openAbove
    ? { left, width, maxHeight, bottom: vh - r.top + 6 }
    : { left, width, maxHeight, top: r.bottom + 6 };
}

/** Ô chọn có danh sách thả xuống theo giao diện của app, thay cho <select> gốc của trình duyệt. */
export default function Select<T extends string>({ value, options, onChange, placeholder, ariaLabel, className, portal, disabled }: {
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  portal?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [pos, setPos] = useState<PortalPos | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const cur = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!root.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !portal || typeof window === "undefined") { setPos(null); return; }
    const place = () => setPos(measurePortalPos(btnRef.current));
    place();
    const onScroll = (e: Event) => {
      if (listRef.current && e.target instanceof Node && listRef.current.contains(e.target)) return;
      place();
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, portal, options.length]);

  useEffect(() => {
    if (!open || hi < 0) return;
    const item = listRef.current?.children[hi] as HTMLElement | undefined;
    item?.scrollIntoView?.({ block: "nearest" });
  }, [open, hi]);

  const openList = () => {
    if (disabled || options.length === 0) return;
    if (portal) setPos(measurePortalPos(btnRef.current));
    setHi(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const pick = (v: T) => { onChange(v); setOpen(false); btnRef.current?.focus(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (disabled || options.length === 0) return;
    if (e.key === "Escape") {
      if (open) { e.stopPropagation(); setOpen(false); btnRef.current?.focus(); }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { openList(); return; }
      setHi((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Home" && open) {
      e.preventDefault(); setHi(0);
    } else if (e.key === "End" && open) {
      e.preventDefault(); setHi(options.length - 1);
    } else if ((e.key === "Enter" || e.key === " ") && open && hi >= 0) {
      e.preventDefault();
      pick(options[hi].value);
    }
  };

  const listNode = open ? (
    <ul
      ref={listRef}
      className={`sel-list${portal ? " sel-portal" : ""}`}
      role="listbox"
      aria-label={ariaLabel}
      style={portal && pos ? pos : undefined}
    >
      {options.map((o, i) => (
        <li
          key={o.value}
          role="option"
          aria-selected={o.value === value}
          className={`sel-opt${i === hi ? " hi" : ""}${o.value === value ? " on" : ""}`}
          onMouseMove={() => { if (hi !== i) setHi(i); }}
          onMouseDown={(e) => { e.preventDefault(); pick(o.value); }}
        >
          <span>{o.label}</span>{o.value === value && <Check className="ic" />}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div className={`sel${className ? ` ${className}` : ""}`} ref={root} onKeyDown={onKey}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        className={`inp sel-btn${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span className={cur ? "" : "sel-ph"}>{cur?.label ?? placeholder ?? ""}</span>
        <ChevronDown className="ic sel-chev" />
      </button>
      {portal && typeof document !== "undefined" ? (listNode ? createPortal(listNode, document.body) : null) : listNode}
    </div>
  );
}
