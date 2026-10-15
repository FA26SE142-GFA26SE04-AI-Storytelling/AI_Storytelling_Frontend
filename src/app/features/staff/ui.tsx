"use client";

import { useState } from "react";

export type Note = { ok: boolean; text: string } | null;

/** Khung một trang trong khu vận hành: tiêu đề, nút phụ, nội dung cuộn. */
export function Page({ title, sub, actions, children }: { title: string; sub?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
      <div className="pane st-page">
        <div className="ph"><span>{title}</span>{actions && <div className="act">{actions}</div>}</div>
        <div className="st-body">
          {sub && <p className="sub st-sub">{sub}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function Notice({ note }: { note: Note }) {
  return note ? <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div> : null;
}

/** Chạy một thao tác trả ApiResponse, hiện thông báo kết quả rồi tải lại. */
export function useAction(reload: () => unknown) {
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<{ success: boolean; message: string }>, okText?: string) => {
    setBusy(true);
    setNote(null);
    const r = await fn();
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? (okText ?? (r.message || "Đã lưu.")) : r.message || "Không thực hiện được." });
    await reload();
    return r.success;
  };
  return { note, setNote, busy, run };
}

export const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
export const fmtDay = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

export const STAFF_STATUS: Record<string, [string, string]> = {
  invited: ["wait", "Đã mời"], active: ["ok", "Đang hoạt động"], deactivated: ["draft", "Đã vô hiệu hoá"],
  pending_approval: ["wait", "Chờ duyệt"], rejected: ["flag", "Bị từ chối"], pending: ["wait", "Chờ duyệt"], approved: ["ok", "Đã duyệt"],
  locked: ["wait", "Khoá đăng nhập"], suspended: ["flag", "Tạm khoá"], unverified: ["draft", "Chưa xác thực"],
};
export function Pill({ status }: { status: string }) {
  const [tone, label] = STAFF_STATUS[status] ?? ["draft", status];
  return <span className={`pill ${tone}`}>{label}</span>;
}
