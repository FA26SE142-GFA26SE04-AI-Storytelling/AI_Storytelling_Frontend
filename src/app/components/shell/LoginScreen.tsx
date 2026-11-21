"use client";

import { authScreenHref, readAuthScreenMode, type AuthScreenMode } from "@/app/lib/authLocation";
import PasswordInput from "@/app/components/PasswordInput";
import "@/app/styles/components/shell/login.css";
import { useEffect, useState, type FormEvent } from "react";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import { useAuth } from "@/app/context/AuthContext";
import { useRiseIn } from "@/app/lib/motion";
import { accountService } from "@/app/services/accountService";
import { authService } from "@/app/services/authService";
import { passwordProblem } from "@/app/lib/guardian";
import KidQrScanner from "@/app/features/kid/KidQrScanner";


type Mode = AuthScreenMode;

const TITLES: Record<Mode, string> = {
  login: "Chào mừng trở lại",
  register: "Tạo tài khoản Taletale",
  verify: "Xác thực email",
  forgot: "Quên mật khẩu",
  reset: "Đặt mật khẩu mới",
  creator: "Đăng ký làm nhà sáng tạo nội dung",
  activate: "Kích hoạt tài khoản vận hành",
};
const SUBMIT_LABELS: Record<Mode, string> = { login: "Đăng nhập", register: "Đăng ký", verify: "Xác thực", forgot: "Gửi hướng dẫn", reset: "Đổi mật khẩu", creator: "Nộp đơn", activate: "Kích hoạt" };

/**
 * Link trong email được next.config.ts chuyển về "/" kèm tham số:
 * ?auth=verify&token=...&email=... → xác thực email
 * ?auth=reset&token=...&email=...  → đặt mật khẩu mới
 * ?auth=forgot | signup | signin | creator → mở đúng biểu mẫu
 */


/**
 * `initialMode`: mở thẳng biểu mẫu đăng nhập hoặc đăng ký (từ trang giới thiệu). `onHome`: có thì hiện nút về trang giới thiệu.
 * `onKidCode`: có thì hiện lối "Bé quét mã QR" — đọc được mã Easy Login thì đưa bé vào chế độ của bé.
 */
export default function LoginScreen({ initialMode = "login", onHome, onKidCode }: { initialMode?: "login" | "register"; onHome?: () => void; onKidCode?: (code: string) => void } = {}) {
  const [scan, setScan] = useState(false);
  const cardRef = useRiseIn<HTMLFormElement>(":scope > *", []);
  const { login, register, forgotPassword, resetPassword, backendOnline, backendStatusMessage } = useAuth();
  const [cr, setCr] = useState({ intro: "", portfolio: "", commit: false });
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ identifier: "", password: "", username: "", email: "", fullName: "", confirm: "", token: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setMode(readAuthScreenMode(window.location.pathname, params, initialMode));
      setF((cur) => ({ ...cur, email: params.get("email") ?? cur.email, token: params.get("token") ?? params.get("resetToken") ?? "" }));
    };
    const onPopState = () => { syncFromUrl(); setMsg(null); };
    syncFromUrl();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [initialMode]);

  const go = (next: Mode) => {
    setMode(next);
    setMsg(null);
    const href = authScreenHref(next, window.location.href);
    if (href !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.pushState(null, "", href);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const r = await login({ identifier: f.identifier.trim(), password: f.password });
        if (!r.success) setMsg({ ok: false, text: r.message });
      } else if (mode === "creator") {
        const problem = cr.intro.trim().length < 20 ? "Giới thiệu bản thân cần ít nhất 20 ký tự." : passwordProblem(f.password) ?? (f.password !== f.confirm ? "Mật khẩu nhập lại chưa khớp." : !cr.commit ? "Hãy xác nhận cam kết trước khi nộp đơn." : null);
        if (problem) { setMsg({ ok: false, text: problem }); return; }
        const r = await authService.registerCreator({ username: f.username.trim(), email: f.email.trim(), fullName: f.fullName.trim(), password: f.password, confirmPassword: f.confirm, introduction: cr.intro.trim(), portfolioUrl: cr.portfolio.trim() || null });
        if (r.success) { go("verify"); setMsg({ ok: true, text: `Đã nộp đơn. Nhập mã xác thực đã gửi tới ${f.email.trim()}, sau đó quản trị viên sẽ xét duyệt đơn của bạn.` }); }
        else setMsg({ ok: false, text: r.errors?.[0] ?? r.message });
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
      } else if (mode === "activate") {
        const problem = passwordProblem(f.password) ?? (f.password !== f.confirm ? "Mật khẩu nhập lại chưa khớp." : !cr.commit ? "Hãy xác nhận cam kết trước khi kích hoạt." : null);
        if (problem) { setMsg({ ok: false, text: problem }); return; }
        const r = await accountService.activateStaff({ email: f.email.trim(), inviteToken: f.token.trim(), newPassword: f.password, confirmPassword: f.confirm, commitmentAccepted: true });
        if (r.success) { go("login"); setF((cur) => ({ ...cur, identifier: cur.email, password: "", confirm: "", token: "" })); setMsg({ ok: true, text: "Đã kích hoạt tài khoản. Hãy đăng nhập; lần đầu bạn sẽ thiết lập xác thực hai bước." }); }
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

  const needsPassword = mode !== "forgot" && mode !== "verify";
  const needsConfirm = mode === "register" || mode === "reset" || mode === "creator" || mode === "activate";

  return (
    <div className="login-wrap">
      <PondBackdrop />
      {onHome && <button type="button" className="btn btn-g login-home" onClick={onHome}>← Trang giới thiệu</button>}
      <form ref={cardRef} className="login-card" onSubmit={submit}>
        <span className="login-frog"><Frog size={110} mood="happy" /></span>
        <h1 className="display">{TITLES[mode]}</h1>
        <p className="sub">Nền tảng kể chuyện AI an toàn cho trẻ em, có phụ huynh đồng hành.</p>

        {(mode === "register" || mode === "creator") && (
          <label className="field"><span className="lbl">Họ và tên</span><input className="inp" required value={f.fullName} onChange={set("fullName")} autoComplete="name" /></label>
        )}
        {(mode === "register" || mode === "creator") && (
          <label className="field"><span className="lbl">Tên đăng nhập</span><input className="inp" required value={f.username} onChange={set("username")} autoComplete="username" /></label>
        )}
        {mode === "login"
          ? <label className="field"><span className="lbl">Email hoặc tên đăng nhập</span><input className="inp" required value={f.identifier} onChange={set("identifier")} autoComplete="username" /></label>
          : <label className="field"><span className="lbl">Email</span><input className="inp" type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>}
        {mode === "creator" && (
          <>
            <label className="field"><span className="lbl">Giới thiệu bản thân ({cr.intro.length}/1000)</span><textarea className="inp" rows={4} minLength={20} maxLength={1000} required value={cr.intro} onChange={(e) => setCr({ ...cr, intro: e.target.value })} placeholder="Kinh nghiệm viết, biên tập hoặc dạy học cho trẻ em (ít nhất 20 ký tự)" /></label>
            <label className="field"><span className="lbl">Link hồ sơ năng lực (không bắt buộc)</span><input className="inp" type="url" maxLength={500} value={cr.portfolio} onChange={(e) => setCr({ ...cr, portfolio: e.target.value })} placeholder="https://" /></label>
          </>
        )}
        {needsPassword && (
          <>
            <label className="field"><span className="lbl">{mode === "reset" || mode === "activate" ? "Mật khẩu mới" : "Mật khẩu"}</span>
              <PasswordInput className="inp" required value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
            {mode === "login" && <button type="button" className="login-forgot" onClick={() => go("forgot")}>Quên mật khẩu?</button>}
          </>
        )}
        {needsConfirm && (
          <label className="field"><span className="lbl">Nhập lại mật khẩu</span><PasswordInput className="inp" required value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></label>
        )}
        {needsConfirm && <p className="sub">Ít nhất 8 ký tự, có cả chữ và số.</p>}
        {mode === "verify" && (
          <label className="field"><span className="lbl">Mã xác thực trong email</span><input className="inp" required value={f.token} onChange={set("token")} autoComplete="one-time-code" inputMode="numeric" /></label>
        )}
        {mode === "activate" && (
          <>
            <label className="field"><span className="lbl">Mã mời trong email</span><input className="inp" required value={f.token} onChange={set("token")} autoComplete="off" spellCheck={false} /></label>
            <p className="sub">Mã có hiệu lực 72 giờ và chỉ dùng được một lần. Hết hạn thì nhờ quản trị viên gửi lại lời mời.</p>
            <label className="row" style={{ alignItems: "flex-start", fontSize: "var(--fs-sm)" }}>
              <input type="checkbox" checked={cr.commit} onChange={(e) => setCr({ ...cr, commit: e.target.checked })} style={{ marginTop: 3 }} />
              <span>Tôi cam kết bảo mật dữ liệu trẻ em và tuân thủ quy tắc kiểm duyệt nội dung của nền tảng.</span>
            </label>
          </>
        )}

        {mode === "creator" && (
          <label className="row" style={{ alignItems: "flex-start", fontSize: "var(--fs-sm)" }}>
            <input type="checkbox" checked={cr.commit} onChange={(e) => setCr({ ...cr, commit: e.target.checked })} style={{ marginTop: 3 }} />
            <span>Tôi cam kết bảo mật dữ liệu trẻ em, chỉ đăng nội dung do tôi sáng tác hoặc có quyền phát hành, và tuân thủ quy tắc nội dung của nền tảng.</span>
          </label>
        )}
        {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} role="alert">{msg.text}</div>}
        {backendOnline === false && <div className="notice err" role="status">{backendStatusMessage}</div>}

        <button className="btn btn-p btn-c" style={{ padding: 10 }} disabled={busy}>{busy ? "Đang xử lý…" : SUBMIT_LABELS[mode]}</button>

        {mode === "login" ? (
          <>
            <p className="login-alt">Chưa có tài khoản? <button type="button" onClick={() => go("register")}>Tạo tài khoản</button></p>
            <p className="login-alt small">Đã đăng ký nhưng chưa nhận mã? <button type="button" onClick={() => go("verify")}>Xác thực email</button></p>
            {onKidCode && <p className="login-alt">Bé vào đọc truyện? <button type="button" onClick={() => setScan(true)}>Quét mã QR của bé</button></p>}
            {/* Lối vào của đội ngũ: tách riêng, nhỏ hơn, để phụ huynh không bị rối. */}
            <div className="login-staff">
              <span>Dành cho đội ngũ nội dung</span>
              <div>
                <button type="button" onClick={() => go("creator")}>Đăng ký làm nhà sáng tạo nội dung</button>
                <button type="button" onClick={() => go("activate")}>Kích hoạt tài khoản vận hành</button>
              </div>
            </div>
          </>
        ) : (
          <div className="login-links">
            {mode === "verify" && <button type="button" disabled={busy} onClick={() => void resend()}>Gửi lại mã</button>}
            {mode === "register" && <button type="button" onClick={() => go("creator")}>Đăng ký làm nhà sáng tạo nội dung</button>}
            {mode === "creator" && <button type="button" onClick={() => go("register")}>Đăng ký tài khoản phụ huynh</button>}
            <button type="button" onClick={() => go("login")}>Quay lại đăng nhập</button>
          </div>
        )}
      </form>
      {scan && onKidCode && <KidQrScanner onCode={(code) => { setScan(false); onKidCode(code); }} onClose={() => setScan(false)} />}
    </div>
  );
}
