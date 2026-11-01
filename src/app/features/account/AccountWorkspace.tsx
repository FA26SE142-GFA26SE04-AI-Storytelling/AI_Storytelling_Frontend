"use client";
import { confirmDialog } from "@/app/lib/confirm";

import PasswordInput from "@/app/components/PasswordInput";
import "../children/children.css";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound, LogOut, MonitorSmartphone, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { accountService } from "@/app/services/accountService";
import type { LoginSession } from "@/app/types/supervision";
import { showToast } from "@/app/lib/toast";
import { fmtDateTime, passwordProblem } from "@/app/lib/guardian";
import ProfileSection from "./ProfileSection";
import DeleteAccountSection from "./DeleteAccountSection";
import ActivitySection from './ActivitySection';
import PaymentSection from './PaymentSection';
import ConnectionStatus from './ConnectionStatus';

type Note = { ok: boolean; text: string } | null;
/** Mỗi trang tài khoản lo một việc. Không truyền `page` thì hiện tất cả (khu nhân viên). */
export type AccountPage = "profile" | "payment" | "activity";

/** Luồng 1 Bước 1.1b — quản lý tài khoản cá nhân: thông tin, email, mật khẩu, phiên đăng nhập, xoá tài khoản. */
export default function AccountWorkspace({ page }: { page?: AccountPage }) {
  const show = (p: AccountPage) => !page || page === p;
  const { user, logout } = useAuth();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwNote, setPwNote] = useState<Note>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [sessions, setSessions] = useState<LoginSession[] | null>(null);
  const [sNote, setSNote] = useState<Note>(null);

  const loadSessions = useCallback(async () => {
    const r = await accountService.listSessions();
    setSessions(r.data ?? []);
    if (!r.success) setSNote({ ok: false, text: r.message });
  }, []);
  const needSessions = show("profile");
  useEffect(() => { if (needSessions) void loadSessions(); }, [loadSessions, needSessions]);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(pw.next) ?? (pw.next !== pw.confirm ? "Mật khẩu nhập lại chưa khớp." : pw.next === pw.current ? "Mật khẩu mới phải khác mật khẩu hiện tại." : null);
    if (problem) { setPwNote({ ok: false, text: problem }); return; }
    setPwBusy(true);
    setPwNote(null);
    const r = await accountService.changePassword({ currentPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm });
    setPwBusy(false);
    if (!r.success) { setPwNote({ ok: false, text: r.message }); return; }
    setPw({ current: "", next: "", confirm: "" });
    setPwOpen(false);
    showToast("Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.");
    void loadSessions();
  };
  const closePw = () => { setPwOpen(false); setPwNote(null); setPw({ current: "", next: "", confirm: "" }); };

  const revoke = async (id: number) => {
    const r = await accountService.revokeSession(id);
    setSNote({ ok: r.success, text: r.success ? "Đã đăng xuất phiên này." : r.message });
    void loadSessions();
  };

  const logoutAll = async () => {
    if (!await confirmDialog("Đăng xuất khỏi mọi thiết bị, kể cả thiết bị này?")) return;
    const r = await accountService.logoutAllDevices();
    if (r.success) await logout();
    else setSNote({ ok: false, text: r.message });
  };

  const set = (k: keyof typeof pw) => (e: React.ChangeEvent<HTMLInputElement>) => setPw({ ...pw, [k]: e.target.value });

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
      <div className="pane children-main">
        <div className="pb children-body">
          <div className={`sec${page === "profile" ? " acc-wrap" : ""}`} style={page === "profile" ? undefined : { gap: 28, maxWidth: page === "payment" ? undefined : 560 }}>
            {show("profile") && (page ? <section className="acc-card"><ProfileSection /></section> : <ProfileSection />)}
            {show("payment") && <PaymentSection />}
            {show("activity") && <><ActivitySection /><ConnectionStatus /></>}

            {show("profile") && <>
            <section className="acc-card">
              <div className="row">
                <h3 className="display grow" style={{ margin: 0 }}>Mật khẩu</h3>
                <button className="btn btn-s" onClick={() => setPwOpen(true)}><KeyRound className="ic" />Đổi mật khẩu</button>
              </div>
            </section>

            {pwOpen && (
              <div className="dlg-backdrop confirm-backdrop" role="dialog" aria-modal="true" aria-label="Đổi mật khẩu" onClick={(e) => { if (e.target === e.currentTarget) closePw(); }}>
                <form className="dlg" onSubmit={changePassword} style={{ gap: 12, width: "min(440px, 100%)" }}>
                  <div className="row"><b className="display grow" style={{ fontSize: 18 }}>Đổi mật khẩu</b><button type="button" className="btn btn-g" aria-label="Đóng" onClick={closePw}><X className="ic" /></button></div>
                  <label className="field"><span className="lbl">Mật khẩu hiện tại</span><PasswordInput className="inp" required autoComplete="current-password" value={pw.current} onChange={set("current")} /></label>
                  <label className="field"><span className="lbl">Mật khẩu mới</span><PasswordInput className="inp" required autoComplete="new-password" value={pw.next} onChange={set("next")} /></label>
                  <label className="field"><span className="lbl">Nhập lại mật khẩu mới</span><PasswordInput className="inp" required autoComplete="new-password" value={pw.confirm} onChange={set("confirm")} /></label>
                  <p className="sub">Ít nhất 8 ký tự, có cả chữ và số. Đổi xong, các thiết bị khác sẽ bị đăng xuất.</p>
                  {pwNote && <div className={`notice ${pwNote.ok ? "ok" : "err"}`} role="status">{pwNote.text}</div>}
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-g" onClick={closePw}>Hủy</button>
                    <button className="btn btn-p" disabled={pwBusy}><KeyRound className="ic" />{pwBusy ? "Đang đổi…" : "Đổi mật khẩu"}</button>
                  </div>
                </form>
              </div>
            )}

            <section className="acc-card" style={{ gap: 6 }}>
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

            {user?.role === "Parent" && <DeleteAccountSection />}
            </>}
          </div>
        </div>
      </div>
    </section>
  );
}
