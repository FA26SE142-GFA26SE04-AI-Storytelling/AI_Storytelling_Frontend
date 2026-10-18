"use client";

import { useCallback, useEffect, useState } from "react";
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
        <form className="sec" style={{ gap: 8 }} onSubmit={(e) => {
          e.preventDefault();
          void run(() => staffService.createDataRequest(child.id, "delete", { currentPassword: password, confirmNickname: nickname }), "Đã gửi yêu cầu xoá hồ sơ.")
            .then((ok) => { if (ok) { setConfirmDelete(false); setPassword(""); setNickname(""); } });
        }}>
          <div className="notice err">Sau khi quản trị viên xử lý, toàn bộ dữ liệu của {child.nickname} bị xoá và không khôi phục được.</div>
          <label className="field"><span className="lbl">Gõ lại biệt danh của bé: <b>{child.nickname}</b></span>
            <input className="inp" required value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="off" /></label>
          <label className="field"><span className="lbl">Mật khẩu của bạn</span>
            <input className="inp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          <div className="row">
            <button type="button" className="btn btn-g" onClick={() => setConfirmDelete(false)}>Huỷ</button>
            <button className="btn btn-no" disabled={busy || nickname.trim() !== child.nickname || !password}>Gửi yêu cầu xoá</button>
          </div>
        </form>
      )}

      {list.length > 0 && (
        <div className="sec" style={{ gap: 4 }}>
          {list.map((r) => {
            const [tone, label] = statusOf(r.status);
            return (
              <div key={r.id} className="ck">
                <span className="grow">{/delete/i.test(r.requestType) ? "Xoá dữ liệu" : "Xuất dữ liệu"} · gửi {fmtDateTime(r.createdAt)}
                  {r.rejectionReason && <small style={{ display: "block" }}>Lý do từ chối: {r.rejectionReason}</small>}</span>
                <span className={`pill ${tone}`}>{label}</span>
                {/pending/i.test(r.status) && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.cancelDataRequest(r.id), "Đã huỷ yêu cầu.")}>Huỷ</button>}
              </div>
            );
          })}
        </div>
      )}
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
    </section>
  );
}
