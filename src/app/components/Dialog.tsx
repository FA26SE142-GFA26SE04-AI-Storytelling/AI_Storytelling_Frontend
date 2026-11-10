"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Popup dùng chung cho form điền thông tin: bấm nền tối hoặc nút X để đóng.
 * Luôn vẽ ở `document.body`: khung cha có `backdrop-filter` / `transform` (nền trong suốt, hiệu ứng) làm
 * `position: fixed` bị giới hạn trong khung đó, popup sẽ bị khuất nếu vẽ tại chỗ.
 */
export default function Dialog({ title, onClose, children, wide, className }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; className?: string }) {
  const node = (
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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
