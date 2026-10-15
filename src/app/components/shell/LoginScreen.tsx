"use client";

import "./login.css";
import { useEffect, useState, type FormEvent } from "react";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import { useAuth } from "@/app/context/AuthContext";
import { useRiseIn } from "@/app/lib/motion";
import { accountService } from "@/app/services/accountService";
import { passwordProblem } from "@/app/lib/guardian";
import { staffService } from "@/app/services/staffService";
import QrCode from "@/app/components/QrCode";

type Mode = "login" | "register" | "verify" | "forgot" | "reset" | "mfa" | "creator";

const TITLES: Record<Mode, string> = {
  login: "Chào mừng trở lại",
  register: "Tạo tài khoản Taletale",
  verify: "Xác thực email",
  forgot: "Quên mật khẩu",
  reset: "Đặt mật khẩu mới",
  mfa: "Xác thực hai bước",
  creator: "Đăng ký làm Content Creator",
};
const SUBMIT_LABELS: Record<Mode, string> = { login: "Đăng nhập", register: "Đăng ký", verify: "Xác thực", forgot: "Gửi hướng dẫn", reset: "Đổi mật khẩu", mfa: "Xác nhận", creator: "Nộp đơn" };

/**
 * Link trong email được next.config.ts chuyển về "/" kèm tham số:
 * ?auth=verify&token=...&email=... → xác thực email
 * ?auth=reset&token=...&email=...  → đặt mật khẩu mới
 * ?auth=forgot | signup | signin   → mở đúng biểu mẫu
 */
function modeFromUrl(params: URLSearchParams): Mode | null {
  const auth = params.get("auth");
  if (auth === "verify") return "verify";
  if (params.get("token") || params.get("resetToken") || auth === "reset") return "reset";
  if (auth === "forgot") return "forgot";
  if (auth === "signup") return "register";
  if (auth === "signin") return "login";
  return null;
}

export default function LoginScreen() {
  const cardRef = useRiseIn<HTMLFormElement>(":scope > *", []);
  const { login, register, forgotPassword, resetPassword, verifyMfa, backendOnline, backendStatusMessage } = useAuth();
  const [mfa, setMfa] = useState<{ challenge: string; uri: string | null } | null>(null);
  const [cr, setCr] = useState({ expertise: "", years: 1, note: "", portfolio: "", commit: false });
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ identifier: "", password: "", username: "", email: "", fullName: "", confirm: "", token: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = modeFromUrl(params);
    if (!next) return;
    setMode(next);
    setF((cur) => ({ ...cur, email: params.get("email") ?? "", token: params.get("token") ?? params.get("resetToken") ?? "" }));
  }, []);

  const go = (next: Mode) => {
    setMode(next);
    setMsg(null);
    // Bỏ tham số trên URL để tải lại trang không mở lại biểu mẫu cũ.
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const r = await login({ identifier: f.identifier.trim(), password: f.password });
        if (r.success && (r.data?.mfaRequired || r.data?.mfaSetupRequired) && r.data.mfaChallengeToken) {
          // Tài khoản vận hành: bắt buộc mã TOTP (Luồng 5 Bước 5.1).
          setMfa({ challenge: r.data.mfaChallengeToken, uri: r.data.mfaSetupRequired ? r.data.mfaProvisioningUri ?? null : null });
          setF((cur) => ({ ...cur, token: "" }));
          go("mfa");
        } else if (!r.success) setMsg({ ok: false, text: r.message });
      } else if (mode === "mfa") {
        if (!mfa) { go("login"); return; }
        const r = await verifyMfa(mfa.challenge, f.token.trim());
        if (!r.success) setMsg({ ok: false, text: r.message || "Mã không đúng." });
      } else if (mode === "creator") {
        const problem = passwordProblem(f.password) ?? (f.password !== f.confirm ? "Mật khẩu nhập lại chưa khớp." : !cr.commit ? "Hãy đồng ý cam kết bảo mật dữ liệu trẻ em và quy tắc nội dung." : cr.note.length > 1000 ? "Mô tả kinh nghiệm tối đa 1000 ký tự." : null);
        if (problem) { setMsg({ ok: false, text: problem }); return; }
        const r = await staffService.applyCreator({ fullName: f.fullName.trim(), email: f.email.trim(), password: f.password, expertise: cr.expertise.trim(), yearsExperience: cr.years, experienceNote: cr.note.trim(), portfolioUrl: cr.portfolio.trim() });
        if (r.success) { go("login"); setMsg({ ok: true, text: r.message || "Đã nộp đơn. Bạn sẽ nhận email kết quả." }); }
        else setMsg({ ok: false, text: r.message });
      } else if (mode === "register") {
        const problem = passwordProblem(f.password) ?? (f.password !== f.confirm ? "Mật khẩu nhập lại chưa khớp." : null);
        if (problem) { setMsg({ ok: false, text: problem }); return; }
        const r = await register({ username: f.username.trim(), email: f.email.trim(), fullName: f.fullName.trim(), password: f.password, confirmPassword: f.confirm });
        if (r.success) { go("verify"); setMsg({ ok: true, text: `Đăng ký thành công. Nhập mã xác thực đã gửi tới ${f.email.trim()}.` }); }
        else setMsg({ ok: false, text: r.message });
      } else if (mode === "verify") {
        const r = await accountService.verifyEmail(f.email.trim(), f.token.trim());
        if (r.success) { go("login"); setF((cur) => ({ ...cur, identifier: cur.email, token: "" })); setMsg({ ok: true, text: "Đã xác thực email. Bạn có thể đăng nhập." }); }
        else setMsg({ ok: false, text: r.message });
      } else if (mode === "forgot") {
        const r = await forgotPassword({ email: f.email.trim() });
        setMsg({ ok: r.success, text: r.success ? "Đã gửi hướng dẫn đặt lại mật khẩu qua email." : r.message });
      } else {
        if (!f.token) { setMsg({ ok: false, text: "Link đặt lại mật khẩu không hợp lệ. Hãy mở lại link trong email." }); return; }
        const problem = passwordProblem(f.password) ?? (f.password !== f.confirm ? "Mật khẩu nhập lại chưa khớp." : null);
        if (problem) { setMsg({ ok: false, text: problem }); return; }
        const r = await resetPassword({ email: f.email.trim(), resetToken: f.token, newPassword: f.password, confirmPassword: f.confirm });
        if (r.success) { go("login"); setMsg({ ok: true, text: "Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới." }); }
        else setMsg({ ok: false, text: r.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!f.email.trim()) { setMsg({ ok: false, text: "Hãy nhập email đã đăng ký." }); return; }
    setBusy(true);
    const r = await accountService.resendVerificationEmail(f.email.trim());
    setBusy(false);
    setMsg({ ok: r.success, text: r.success ? "Đã gửi lại mã xác thực. Hãy kiểm tra hộp thư." : r.message });
  };

  const needsPassword = mode !== "forgot" && mode !== "verify" && mode !== "mfa";
  const needsConfirm = mode === "register" || mode === "reset" || mode === "creator";

  return (
    <div className="login-wrap">
      <PondBackdrop />
      <form ref={cardRef} className="login-card" onSubmit={submit}>
        <span className="login-frog"><Frog size={110} mood="happy" /></span>
        <h1 className="display">{TITLES[mode]}</h1>
        <p className="sub">Nền tảng kể chuyện AI an toàn cho trẻ em, có phụ huynh đồng hành.</p>

        {(mode === "register" || mode === "creator") && (
          <label className="field"><span className="lbl">Họ và tên</span><input className="inp" required value={f.fullName} onChange={set("fullName")} autoComplete="name" /></label>
        )}
        {mode === "register" && (
          <label className="field"><span className="lbl">Tên đăng nhập</span><input className="inp" required value={f.username} onChange={set("username")} autoComplete="username" /></label>
        )}
        {mode === "mfa" ? (
          <>
            {mfa?.uri ? (
              <div className="sec" style={{ gap: 8, alignItems: "center" }}>
                <p className="sub">Lần đăng nhập đầu: quét mã này bằng ứng dụng xác thực (Google Authenticator, Microsoft Authenticator…), rồi nhập mã 6 số.</p>
                <QrCode value={mfa.uri} size={180} label="Mã QR thiết lập xác thực hai bước" />
              </div>
            ) : <p className="sub">Nhập mã 6 số trong ứng dụng xác thực của bạn.</p>}
            <label className="field"><span className="lbl">Mã xác thực</span><input className="inp" required autoFocus inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={f.token} onChange={(e) => setF({ ...f, token: e.target.value.replace(/\D/g, "") })} style={{ letterSpacing: 6, textAlign: "center" }} /></label>
          </>
        ) : mode === "login"
          ? <label className="field"><span className="lbl">Email hoặc tên đăng nhập</span><input className="inp" required value={f.identifier} onChange={set("identifier")} autoComplete="username" /></label>
          : <label className="field"><span className="lbl">Email</span><input className="inp" type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>}
        {mode === "creator" && (
          <>
            <label className="field"><span className="lbl">Chuyên môn</span><input className="inp" required value={cr.expertise} onChange={(e) => setCr({ ...cr, expertise: e.target.value })} placeholder="VD: Biên tập viên sách thiếu nhi, giáo viên tiểu học" /></label>
            <label className="field"><span className="lbl">Số năm kinh nghiệm</span><input className="inp" type="number" min={0} max={60} value={cr.years} onChange={(e) => setCr({ ...cr, years: +e.target.value })} /></label>
            <label className="field"><span className="lbl">Mô tả kinh nghiệm ({cr.note.length}/1000)</span><textarea className="inp" rows={3} maxLength={1000} required value={cr.note} onChange={(e) => setCr({ ...cr, note: e.target.value })} /></label>
            <label className="field"><span className="lbl">Link portfolio (không bắt buộc)</span><input className="inp" type="url" value={cr.portfolio} onChange={(e) => setCr({ ...cr, portfolio: e.target.value })} /></label>
          </>
        )}
        {needsPassword && (
          <label className="field"><span className="lbl">{mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}</span>
            <input className="inp" type="password" required value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        )}
        {needsConfirm && (
          <label className="field"><span className="lbl">Nhập lại mật khẩu</span><input className="inp" type="password" required value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></label>
        )}
        {needsConfirm && <p className="sub">Ít nhất 8 ký tự, có cả chữ và số.</p>}
        {mode === "verify" && (
          <label className="field"><span className="lbl">Mã xác thực trong email</span><input className="inp" required value={f.token} onChange={set("token")} autoComplete="one-time-code" inputMode="numeric" /></label>
        )}

        {mode === "creator" && (
          <label className="row" style={{ alignItems: "flex-start", fontSize: 13 }}>
            <input type="checkbox" checked={cr.commit} onChange={(e) => setCr({ ...cr, commit: e.target.checked })} style={{ marginTop: 3 }} />
            <span>Tôi cam kết bảo mật dữ liệu trẻ em, chỉ đăng nội dung do tôi sáng tác hoặc có quyền phát hành, và tuân thủ quy tắc nội dung của nền tảng.</span>
          </label>
        )}
        {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} role="alert">{msg.text}</div>}
        {backendOnline === false && <div className="notice err" role="status">{backendStatusMessage}</div>}

        <button className="btn btn-p btn-c" style={{ padding: 10 }} disabled={busy}>{busy ? "Đang xử lý…" : SUBMIT_LABELS[mode]}</button>

        <div className="login-links">
          {mode !== "login" && <button type="button" onClick={() => go("login")}>Quay lại đăng nhập</button>}
          {mode === "login" && <button type="button" onClick={() => go("register")}>Tạo tài khoản</button>}
          {mode === "login" && <button type="button" onClick={() => go("forgot")}>Quên mật khẩu?</button>}
          {mode === "login" && <button type="button" onClick={() => go("verify")}>Xác thực email</button>}
          {mode === "login" && <button type="button" onClick={() => go("creator")}>Đăng ký làm Content Creator</button>}
          {mode === "verify" && <button type="button" disabled={busy} onClick={() => void resend()}>Gửi lại mã</button>}
        </div>
      </form>
    </div>
  );
}
