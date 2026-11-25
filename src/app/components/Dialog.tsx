"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Popup dùng chung cho form điền thông tin: bấm nền tối, nút X hoặc phím Escape (khi là hộp thoại trên cùng) để đóng.
 * Luôn vẽ ở `document.body`: khung cha có `backdrop-filter` / `transform` (nền trong suốt, hiệu ứng) làm
 * `position: fixed` bị giới hạn trong khung đó, popup sẽ bị khuất nếu vẽ tại chỗ.
 */
export default function Dialog({
  title,
  onClose,
  children,
  wide,
  className,
  closeOnBackdrop = true,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  className?: string;
  closeOnBackdrop?: boolean;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector(".sel-list")) return;
      const modal = backdropRef.current;
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (!modal || dialogs[dialogs.length - 1] !== modal) return;
      event.preventDefault();
      closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const node = (
    <div
      ref={backdropRef}
      className="dlg-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`dlg${wide ? " wide" : ""}${className ? ` ${className}` : ""}`}>
        <div className="row">
          <b className="display grow" style={{ fontSize: "var(--fs-lg)" }}>{title}</b>
          <button type="button" className="btn btn-g" aria-label="Đóng" title="Đóng" onClick={onClose}><X className="ic" /></button>
        </div>
        {children}
      </div>
    </div>
  );
  return typeof document === "undefined" ? node : createPortal(node, document.body);
}
