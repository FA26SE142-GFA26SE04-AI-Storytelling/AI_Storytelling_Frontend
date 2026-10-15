"use client";

import "../children/children.css";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound, LogOut, MonitorSmartphone } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { accountService } from "@/app/services/accountService";
import type { LoginSession } from "@/app/types/supervision";
import { fmtDateTime, passwordProblem } from "@/app/lib/guardian";

const ROLE: Record<string, string> = { Parent: "Phụ huynh", Administrator: "Quản trị viên", ContentCreator: "Người tạo nội dung", Moderator: "Kiểm duyệt viên" };
type Note = { ok: boolean; text: string } | null;

/** Luồng 1 Bước 1.1b — quản lý tài khoản cá nhân. */
export default function AccountWorkspace() {
  const { user, logout } = useAuth();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwNote, setPwNote] = useState<Note>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [sessions, setSessions] = useState<LoginSession[] | null>(null);
  const [sNote, setSNote] = useState<Note>(null);

  const loadSessions = useCallback(async () => {
    const r = await accountService.listSessions();
    setSessions(r.data ?? []);
    if (!r.success) setSNote({ ok: false, text: r.message });
  }, []);
  useEffect(() => { void loadSessions(); }, [loadSessions]);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(pw.next) ?? (pw.next !== pw.confirm ? "Mật khẩu nhập lại chưa khớp." : pw.next === pw.current ? "Mật khẩu mới phải khác mật khẩu hiện tại." : null);
    if (problem) { setPwNote({ ok: false, text: problem }); return; }
    setPwBusy(true);
    setPwNote(null);
    const r = await accountService.changePassword({ currentPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm });
    setPwBusy(false);
    setPwNote({ ok: r.success, text: r.success ? "Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất." : r.message });
    if (r.success) { setPw({ current: "", next: "", confirm: "" }); void loadSessions(); }
  };

  const revoke = async (id: number) => {
    const r = await accountService.revokeSession(id);
    setSNote({ ok: r.success, text: r.success ? "Đã đăng xuất phiên này." : r.message });
    void loadSessions();
  };

  const logoutAll = async () => {
    if (!confirm("Đăng xuất khỏi mọi thiết bị, kể cả thiết bị này?")) return;
    const r = await accountService.logoutAllDevices();
    if (r.success) await logout();
    else setSNote({ ok: false, text: r.message });
  };

  const set = (k: keyof typeof pw) => (e: React.ChangeEvent<HTMLInputElement>) => setPw({ ...pw, [k]: e.target.value });

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
      <div className="pane children-main">
        <div className="ph"><span>Tài khoản</span></div>
        <div className="pb children-body">
          <div className="sec" style={{ gap: 28, maxWidth: 560 }}>
            <section className="sec" style={{ gap: 10 }}>
              <h3 className="display" style={{ margin: 0 }}>Thông tin</h3>
              <div className="kv">
                <div><small>Họ và tên</small><b>{user?.fullName || "—"}</b></div>
                <div><small>Tên đăng nhập</small><b>{user?.username || "—"}</b></div>
                <div><small>Email</small><b>{user?.email || "—"}</b></div>
                <div><small>Loại tài khoản</small><b>{ROLE[user?.role ?? ""] ?? user?.role}</b></div>
              </div>
            </section>

            <form className="sec" style={{ gap: 10 }} onSubmit={changePassword}>
              <h3 className="display" style={{ margin: 0 }}>Đổi mật khẩu</h3>
              <label className="field"><span className="lbl">Mật khẩu hiện tại</span><input className="inp" type="password" required autoComplete="current-password" value={pw.current} onChange={set("current")} /></label>
              <label className="field"><span className="lbl">Mật khẩu mới</span><input className="inp" type="password" required autoComplete="new-password" value={pw.next} onChange={set("next")} /></label>
              <label className="field"><span className="lbl">Nhập lại mật khẩu mới</span><input className="inp" type="password" required autoComplete="new-password" value={pw.confirm} onChange={set("confirm")} /></label>
              <p className="sub">Ít nhất 8 ký tự, có cả chữ và số. Đổi xong, các thiết bị khác sẽ bị đăng xuất.</p>
              {pwNote && <div className={`notice ${pwNote.ok ? "ok" : "err"}`} role="status">{pwNote.text}</div>}
              <button className="btn btn-p" style={{ width: "fit-content" }} disabled={pwBusy}><KeyRound className="ic" />{pwBusy ? "Đang đổi…" : "Đổi mật khẩu"}</button>
            </form>

            <section className="sec" style={{ gap: 6 }}>
              <h3 className="display" style={{ margin: 0 }}>Phiên đăng nhập</h3>
              {sessions === null && <p className="sub">Đang tải…</p>}
              {sessions?.length === 0 && <p className="sub">Không có phiên nào khác.</p>}
              {sessions?.map((s) => (
                <div key={s.id} className="session-row">
                  <MonitorSmartphone className="ic" />
                  <span className="grow">Đăng nhập lúc {fmtDateTime(s.issuedAt)}<small className="sub" style={{ display: "block" }}>Hết hạn {fmtDateTime(s.expiresAt)}</small></span>
                  <button className="btn btn-g" onClick={() => void revoke(s.id)}>Đăng xuất</button>
                </div>
              ))}
              {sNote && <div className={`notice ${sNote.ok ? "ok" : "err"}`} role="status">{sNote.text}</div>}
              <button className="btn btn-no" style={{ width: "fit-content", marginTop: 8 }} onClick={() => void logoutAll()}><LogOut className="ic" />Đăng xuất khỏi mọi thiết bị</button>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
