"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hộp thoại dùng bàn phím được: mở thì focus vào phần tử đầu tiên, Tab chỉ chạy trong hộp,
 * Esc để đóng, đóng xong trả focus về chỗ cũ.
 */
export function useDialog<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const before = document.activeElement as HTMLElement | null;
    const items = () => [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hidden && el.getClientRects().length > 0);
    (items()[0] ?? box).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, []);

  return ref;
}
