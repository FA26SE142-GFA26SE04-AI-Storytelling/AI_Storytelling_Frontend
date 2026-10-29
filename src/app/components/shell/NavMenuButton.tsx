"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

/** Một mục trong menu xổ xuống; dùng chung cho khu phụ huynh và khu nhân viên. */
export type MenuItem<Id extends string = string> = { id: Id; label: string; icon: LucideIcon; menuLabel?: string; hint?: string };

type Props<Id extends string> = {
  entry: { label: string; icon: LucideIcon };
  items: MenuItem<Id>[];
  ws: Id;
  onWs: (id: Id) => void;
  /** Thanh tab ở đáy (điện thoại): menu mở lên trên thay vì xuống dưới. */
  upward?: boolean;
};

/**
 * Nút trên thanh điều hướng có menu xổ xuống. Menu gắn thẳng vào body, vì thanh điều hướng cuộn ngang
 * sẽ cắt mất mọi thứ tràn ra ngoài nó.
 */
export default function NavMenuButton<Id extends string>({ entry, items, ws, onWs, upward }: Props<Id>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = items.some((i) => i.id === ws);
  const Icon = entry.icon;

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const width = 280;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8);
    setPos(upward ? { left, bottom: window.innerHeight - r.top + 8 } : { left, top: r.bottom + 10 });
  }, [open, upward]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); window.removeEventListener("resize", close); };
  }, [open]);

  return (
    <>
      <button ref={btnRef} className={active || open ? "on" : ""} data-tip={entry.label} title={entry.label} aria-label={entry.label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon />
      </button>
      {open && pos && createPortal(
        <div ref={menuRef} className="nav-menu" role="menu" aria-label={entry.label} style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}>
          {items.map(({ id, label, menuLabel, hint, icon: ItemIcon }) => (
            <button key={id} role="menuitem" className={ws === id ? "on" : ""} aria-current={ws === id ? "page" : undefined} onClick={() => { setOpen(false); onWs(id); }}>
              <span className="nav-menu-ic"><ItemIcon /></span>
              <span className="grow"><b>{menuLabel ?? label}</b>{hint && <small>{hint}</small>}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
