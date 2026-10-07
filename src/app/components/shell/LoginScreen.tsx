"use client";

import "./login.css";
import { useEffect, useState, type FormEvent } from "react";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import { useAuth } from "@/app/context/AuthContext";
import { useRiseIn } from "@/app/lib/motion";

type Mode = "login" | "register" | "forgot" | "reset";

const TITLES: Record<Mode, string> = {
  login: "Chào mừng trở lại",
  register: "Tạo tài khoản Taletale",
  forgot: "Quên mật khẩu",
  reset: "Đặt mật khẩu mới",
};
const SUBMIT_LABELS: Record<Mode, string> = { login: "Đăng nhập", register: "Đăng ký", forgot: "Gửi hướng dẫn", reset: "Đổi mật khẩu" };

/**
 * Link trong email được next.config.ts chuyển về "/" kèm tham số:
 * ?auth=reset&token=...&email=...  → đặt mật khẩu mới
 * ?auth=forgot | signup | signin   → mở đúng biểu mẫu
 */
function modeFromUrl(params: URLSearchParams): Mode | null {
  if (params.get("token") || params.get("resetToken") || params.get("auth") === "reset") return "reset";
  const auth = params.get("auth");
  if (auth === "forgot") return "forgot";
  if (auth === "signup") return "register";
  if (auth === "signin") return "login";
  return null;
}

export default function LoginScreen() {
  const cardRef = useRiseIn<HTMLFormElement>(":scope > *", []);
  const { login, register, forgotPassword, resetPassword, backendOnline, backendStatusMessage } = useAuth();
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
        if (!r.success) setMsg({ ok: false, text: r.message });
      } else if (mode === "register") {
        const r = await register({ username: f.username.trim(), email: f.email.trim(), fullName: f.fullName.trim(), password: f.password, confirmPassword: f.confirm });
        if (r.success) { go("login"); setMsg({ ok: true, text: "Đăng ký thành công. Hãy kiểm tra email để xác thực rồi đăng nhập." }); }
        else setMsg({ ok: false, text: r.message });
      } else if (mode === "forgot") {
        const r = await forgotPassword({ email: f.email.trim() });
        setMsg({ ok: r.success, text: r.success ? "Đã gửi hướng dẫn đặt lại mật khẩu qua email." : r.message });
      } else {
        if (!f.token) { setMsg({ ok: false, text: "Link đặt lại mật khẩu không hợp lệ. Hãy mở lại link trong email." }); return; }
        const r = await resetPassword({ email: f.email.trim(), resetToken: f.token, newPassword: f.password, confirmPassword: f.confirm });
        if (r.success) { go("login"); setMsg({ ok: true, text: "Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới." }); }
        else setMsg({ ok: false, text: r.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const needsPassword = mode !== "forgot";
  const needsConfirm = mode === "register" || mode === "reset";

  return (
    <div className="login-wrap">
      <PondBackdrop />
      <form ref={cardRef} className="login-card" onSubmit={submit}>
        <span className="login-frog"><Frog size={110} mood="happy" /></span>
        <h1 className="display">{TITLES[mode]}</h1>
        <p className="sub">Nền tảng kể chuyện AI an toàn cho trẻ em, có phụ huynh đồng hành.</p>

        {mode === "register" && (
          <>
            <label className="field"><span className="lbl">Họ và tên</span><input className="inp" required value={f.fullName} onChange={set("fullName")} autoComplete="name" /></label>
            <label className="field"><span className="lbl">Tên đăng nhập</span><input className="inp" required value={f.username} onChange={set("username")} autoComplete="username" /></label>
          </>
        )}
        {mode === "login"
          ? <label className="field"><span className="lbl">Email hoặc tên đăng nhập</span><input className="inp" required value={f.identifier} onChange={set("identifier")} autoComplete="username" /></label>
          : <label className="field"><span className="lbl">Email</span><input className="inp" type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>}
        {needsPassword && (
          <label className="field"><span className="lbl">{mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}</span>
            <input className="inp" type="password" required value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        )}
        {needsConfirm && (
          <label className="field"><span className="lbl">Nhập lại mật khẩu</span><input className="inp" type="password" required value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></label>
        )}

        {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} role="alert">{msg.text}</div>}
        {backendOnline === false && <div className="notice err" role="status">{backendStatusMessage}</div>}

        <button className="btn btn-p btn-c" style={{ padding: 10 }} disabled={busy}>{busy ? "Đang xử lý…" : SUBMIT_LABELS[mode]}</button>

        <div className="login-links">
          {mode !== "login" && <button type="button" onClick={() => go("login")}>Quay lại đăng nhập</button>}
          {mode === "login" && <button type="button" onClick={() => go("register")}>Tạo tài khoản</button>}
          {mode === "login" && <button type="button" onClick={() => go("forgot")}>Quên mật khẩu?</button>}
        </div>
      </form>
    </div>
  );
}
