"use client";

import PasswordInput from "@/app/components/PasswordInput";
import { useState, type FormEvent } from "react";
import { Mail, Save } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { accountService } from "@/app/services/accountService";

const ROLE: Record<string, string> = { Parent: "Phụ huynh", Administrator: "Quản trị viên", ContentCreator: "Người tạo nội dung", Moderator: "Kiểm duyệt viên" };
type Note = { ok: boolean; text: string } | null;

/** Luồng 1 Bước 1.1b — sửa họ tên, ảnh đại diện; đổi email bằng mã xác thực gửi tới email mới (chỉ Phụ huynh). */
export default function ProfileSection() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState({ password: "", next: "", otp: "", sent: false });
  const [eNote, setENote] = useState<Note>(null);
  const isParent = user?.role === "Parent";
  const dirty = fullName.trim() !== (user?.fullName ?? "") || avatarUrl.trim() !== (user?.avatarUrl ?? "");

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    const r = await accountService.updateProfile({ fullName, avatarUrl });
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? "Đã lưu thông tin." : r.message });
    if (r.success) await refreshProfile();
  };

  const requestEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.next.trim())) { setENote({ ok: false, text: "Email mới chưa đúng định dạng." }); return; }
    setBusy(true);
    setENote(null);
    const r = await accountService.requestEmailChange(email.password, email.next);
    setBusy(false);
    setENote({ ok: r.success, text: r.success ? `Đã gửi mã xác thực tới ${email.next.trim()}. Email chỉ đổi sau khi bạn nhập mã.` : r.message });
    if (r.success) setEmail({ ...email, password: "", sent: true });
  };

  const confirmEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setENote(null);
    const r = await accountService.confirmEmailChange(email.otp);
    setBusy(false);
    setENote({ ok: r.success, text: r.success ? "Đã đổi email. Lần sau hãy đăng nhập bằng email mới." : r.message });
    if (r.success) { setEmail({ password: "", next: "", otp: "", sent: false }); await refreshProfile(); }
  };

  return (
    <>
      <form className="sec" style={{ gap: 10 }} onSubmit={saveProfile}>
        <h3 className="display" style={{ margin: 0 }}>Thông tin</h3>
        <div className="kv">
          <div><small>Tên đăng nhập</small><b>{user?.username || "—"}</b></div>
          <div><small>Email</small><b>{user?.email || "—"}</b></div>
          <div><small>Loại tài khoản</small><b>{ROLE[user?.role ?? ""] ?? user?.role}</b></div>
        </div>
        <label className="field"><span className="lbl">Họ và tên</span>
          <input className="inp" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" /></label>
        <label className="field"><span className="lbl">Ảnh đại diện (đường dẫn ảnh, không bắt buộc)</span>
          <input className="inp" type="url" maxLength={500} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" /></label>
        {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
        <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || !dirty || !fullName.trim()}><Save className="ic" />Lưu thông tin</button>
      </form>

      {isParent && (
        <section className="sec" style={{ gap: 10 }}>
          <h3 className="display" style={{ margin: 0 }}>Đổi email</h3>
          {!email.sent ? (
            <form className="sec" style={{ gap: 10 }} onSubmit={requestEmail}>
              <label className="field"><span className="lbl">Email mới</span>
                <input className="inp" type="email" required value={email.next} onChange={(e) => setEmail({ ...email, next: e.target.value })} autoComplete="email" /></label>
              <label className="field"><span className="lbl">Mật khẩu hiện tại</span>
                <PasswordInput className="inp" required value={email.password} onChange={(e) => setEmail({ ...email, password: e.target.value })} autoComplete="current-password" /></label>
              <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy}><Mail className="ic" />Gửi mã xác thực</button>
            </form>
          ) : (
            <form className="sec" style={{ gap: 10 }} onSubmit={confirmEmail}>
              <label className="field"><span className="lbl">Mã xác thực gửi tới {email.next.trim()}</span>
                <input className="inp" required autoFocus inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={email.otp}
                  onChange={(e) => setEmail({ ...email, otp: e.target.value.replace(/\D/g, "") })} style={{ letterSpacing: 6, textAlign: "center", maxWidth: 200 }} /></label>
              <div className="row">
                <button type="button" className="btn btn-g" disabled={busy} onClick={() => { setEmail({ password: "", next: "", otp: "", sent: false }); setENote(null); }}>Hủy</button>
                <button className="btn btn-p" disabled={busy || email.otp.length !== 6}>Xác nhận đổi email</button>
              </div>
            </form>
          )}
          {eNote && <div className={`notice ${eNote.ok ? "ok" : "err"}`} role="status">{eNote.text}</div>}
        </section>
      )}
    </>
  );
}
