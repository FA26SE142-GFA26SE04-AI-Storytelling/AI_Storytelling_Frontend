"use client";

import "@/app/features/review/review-tools.css";
import { useEffect, useRef, useState } from "react";
import { TriangleAlert, CircleHelp } from "lucide-react";
import { subscribeConfirm, type ConfirmRequest } from "@/app/lib/confirm";

const DANGER = /(xoá|xóa|thu hồi|gỡ|lưu trữ|hủy|huỷ|từ chối|rời khỏi|đăng xuất|không hoàn tác|bỏ )/i;

/** Tách “Tiêu đề? Nội dung” thành hai phần; câu hỏi ngắn không có phần sau thì dùng tiêu đề chung. */
function split(message: string): { title: string; body: string } {
  const i = message.indexOf("?");
  if (i > 0 && i < message.length - 1) return { title: message.slice(0, i + 1).trim(), body: message.slice(i + 1).trim() };
  return { title: "Xác nhận thao tác", body: message.trim() };
}

export default function ConfirmHost() {
  const [queue, setQueue] = useState<ConfirmRequest[]>([]);
  const okRef = useRef<HTMLButtonElement>(null);
  const current = queue[0];

  useEffect(() => subscribeConfirm((r) => setQueue((q) => [...q, r])), []);

  const close = (ok: boolean) => {
    current?.resolve(ok);
    setQueue((q) => q.slice(1));
  };

  useEffect(() => {
    if (!current) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); current.resolve(false); setQueue((q) => q.slice(1)); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  if (!current) return null;
  const { title, body } = split(current.message);
  const danger = DANGER.test(current.message);
  const Icon = danger ? TriangleAlert : CircleHelp;
  return (
    <div className="dlg-backdrop confirm-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body"
      onClick={(e) => { if (e.target === e.currentTarget) close(false); }}>
      <div className="dlg confirm-dlg">
        <div className="confirm-head">
          <span className={`confirm-ic ${danger ? "danger" : ""}`}><Icon size={20} aria-hidden="true" /></span>
          <b id="confirm-title" className="display">{title}</b>
        </div>
        <p id="confirm-body" className="sub">{body}</p>
        <div className="row confirm-actions">
          <button type="button" className="btn btn-g" onClick={() => close(false)}>Huỷ</button>
          <button type="button" ref={okRef} className={`btn ${danger ? "btn-no" : "btn-p"}`} onClick={() => close(true)}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}
