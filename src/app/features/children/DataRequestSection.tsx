"use client";

import "@/app/features/review/review-tools.css";
import PasswordInput from "@/app/components/PasswordInput";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { staffService } from "@/app/services/staffService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { DataRequest } from "@/app/types/staff";
import { fmtDateTime } from "@/app/lib/guardian";

const STATUS: Record<string, [string, string]> = {
  Pending: ["wait", "Đang chờ xử lý"], Resolved: ["ok", "Đã xử lý"], Rejected: ["flag", "Bị từ chối"], Cancelled: ["draft", "Đã huỷ"],
};
const statusOf = (s: string) => STATUS[s] ?? STATUS[s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()] ?? ["draft", s];

/**
 * Luồng 5 Bước 5.4 — Owner yêu cầu xuất / xoá dữ liệu của bé; Administrator xử lý trong 72 giờ.
 * Yêu cầu xoá bắt buộc nhập lại mật khẩu và gõ đúng biệt danh của bé.
 */
export default function DataRequestSection({ child }: { child: ChildProfile }) {
  const [list, setList] = useState<DataRequest[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const r = await staffService.myDataRequests();
    setList((r.data ?? []).filter((x) => x.childProfileId === child.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [child.id]);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<{ success: boolean; message: string }>, okText: string) => {
    setBusy(true);
    setNote(null);
    const r = await fn();
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? okText : r.message || "Không thực hiện được." });
    if (r.success) void load();
    return r.success;
  };

  const closeDelete = useCallback(() => { setConfirmDelete(false); setPassword(""); setNickname(""); }, []);
  useEffect(() => {
    if (!confirmDelete) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) closeDelete(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDelete, busy, closeDelete]);

  const pending = (type: string) => list.some((x) => /pending/i.test(x.status) && x.requestType.toLowerCase() === type);

  return (
    <section className="sec" style={{ gap: 8 }}>
      <h3 className="display" style={{ margin: 0 }}>Dữ liệu của bé</h3>
      <p className="sub">Bạn có thể yêu cầu xuất toàn bộ dữ liệu của {child.nickname}, hoặc xoá hồ sơ. Xoá sẽ thu hồi mọi quyền truy cập, xoá truyện riêng và dữ liệu học tập; không hoàn tác được. Quản trị viên xử lý trong tối đa 72 giờ.</p>
      <div className="row">
        <button className="btn btn-s" disabled={busy || pending("export")} onClick={() => void run(() => staffService.createDataRequest(child.id, "export"), "Đã gửi yêu cầu xuất dữ liệu.")}>Yêu cầu xuất dữ liệu</button>
        <button className="btn btn-no" disabled={busy || pending("delete")} onClick={() => { setConfirmDelete(true); setNote(null); }}>Yêu cầu xoá hồ sơ</button>
      </div>

      {confirmDelete && (
        <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label="Xác nhận yêu cầu xoá hồ sơ" onClick={(e) => { if (e.target === e.currentTarget && !busy) closeDelete(); }}>
          <form className="dlg" style={{ gap: 10 }} onSubmit={(e) => {
            e.preventDefault();
            void run(() => staffService.createDataRequest(child.id, "delete", { currentPassword: password, confirmNickname: nickname }), "Đã gửi yêu cầu xoá hồ sơ.")
              .then((ok) => { if (ok) closeDelete(); });
          }}>
            <div className="row"><b className="display grow" style={{ fontSize: 18 }}>Xác nhận xoá hồ sơ</b>
              <button type="button" className="btn btn-g" aria-label="Đóng" disabled={busy} onClick={closeDelete}><X className="ic" /></button></div>
            <div className="notice err">Sau khi quản trị viên xử lý, toàn bộ dữ liệu của {child.nickname} bị xoá và không khôi phục được.</div>
            <label className="field"><span className="lbl">Gõ lại biệt danh của bé: <b>{child.nickname}</b></span>
              <input className="inp" required autoFocus value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="off" /></label>
            <label className="field"><span className="lbl">Mật khẩu của bạn</span>
              <PasswordInput className="inp" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
            {note && !note.ok && <div className="notice err" role="alert">{note.text}</div>}
            <div className="row">
              <button type="button" className="btn btn-g" disabled={busy} onClick={closeDelete}>Huỷ</button>
              <button className="btn btn-no" disabled={busy || nickname.trim() !== child.nickname || !password}>{busy ? "Đang gửi…" : "Gửi yêu cầu xoá"}</button>
            </div>
          </form>
        </div>
      )}

      {list.length > 0 && (
        <div className="req-table-wrap">
          <table className="req-table">
            <thead><tr><th>Yêu cầu</th><th>Thời gian gửi</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
            <tbody>
              {list.map((r) => {
                const [tone, label] = statusOf(r.status);
                return (
                  <tr key={r.id}>
                    <td>{/delete/i.test(r.requestType) ? "Xoá dữ liệu" : "Xuất dữ liệu"}
                      {r.rejectionReason && <small className="req-reason">Lý do từ chối: {r.rejectionReason}</small>}</td>
                    <td>{fmtDateTime(r.createdAt)}</td>
                    <td><span className={`pill ${tone}`}>{label}</span></td>
                    <td className="req-act">{/pending/i.test(r.status) && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.cancelDataRequest(r.id), "Đã huỷ yêu cầu.")}>Huỷ</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {note && (note.ok || !confirmDelete) && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
    </section>
  );
}
