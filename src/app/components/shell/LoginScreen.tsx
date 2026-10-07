"use client";

import { useState, type FormEvent } from "react";
import Frog from "../brand/Frog";
import PondBackdrop from "../brand/PondBackdrop";
import { useAuth } from "../../context/AuthContext";
import { useRiseIn } from "../../utils/motion";

type Mode = "login" | "register" | "forgot";

export default function LoginScreen() {
  const cardRef = useRiseIn<HTMLFormElement>(":scope > *", []);
  const { login, register, forgotPassword, backendOnline, backendStatusMessage } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ identifier: "", password: "", username: "", email: "", fullName: "", confirm: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

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
        setMsg({ ok: r.success, text: r.success ? "Đăng ký thành công. Hãy kiểm tra email để xác thực rồi đăng nhập." : r.message });
        if (r.success) setMode("login");
      } else {
        const r = await forgotPassword({ email: f.email.trim() });
        setMsg({ ok: r.success, text: r.success ? "Đã gửi hướng dẫn đặt lại mật khẩu qua email." : r.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<Mode, string> = { login: "Chào mừng trở lại", register: "Tạo tài khoản Taletale", forgot: "Quên mật khẩu" };

  return (
    <div className="login-wrap">
      <PondBackdrop />
      <form ref={cardRef} className="login-card" onSubmit={submit}>
        <span className="login-frog"><Frog size={110} mood="happy" /></span>
        <h1 className="display">{titles[mode]}</h1>
        <p className="sub">Nền tảng kể chuyện AI an toàn cho trẻ em, có phụ huynh đồng hành.</p>

        {mode === "register" && (
          <>
            <label className="field"><span className="lbl">Họ và tên</span><input className="inp" required value={f.fullName} onChange={set("fullName")} autoComplete="name" /></label>
            <label className="field"><span className="lbl">Tên đăng nhập</span><input className="inp" required value={f.username} onChange={set("username")} autoComplete="username" /></label>
          </>
        )}
        {mode === "login" && (
          <label className="field"><span className="lbl">Email hoặc tên đăng nhập</span><input className="inp" required value={f.identifier} onChange={set("identifier")} autoComplete="username" /></label>
        )}
        {mode !== "login" && (
          <label className="field"><span className="lbl">Email</span><input className="inp" type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>
        )}
        {mode !== "forgot" && (
          <label className="field"><span className="lbl">Mật khẩu</span><input className="inp" type="password" required value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        )}
        {mode === "register" && (
          <label className="field"><span className="lbl">Nhập lại mật khẩu</span><input className="inp" type="password" required value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></label>
        )}

        {msg && <div className={`login-msg ${msg.ok ? "ok" : "err"}`} role="alert">{msg.text}</div>}
        {backendOnline === false && <div className="login-msg err" role="status">{backendStatusMessage}</div>}

        <button className="btn btn-p btn-c" style={{ padding: 10 }} disabled={busy}>
          {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : mode === "register" ? "Đăng ký" : "Gửi hướng dẫn"}
        </button>

        <div className="login-links">
          {mode !== "login" && <button type="button" onClick={() => { setMode("login"); setMsg(null); }}>Quay lại đăng nhập</button>}
          {mode === "login" && <button type="button" onClick={() => { setMode("register"); setMsg(null); }}>Tạo tài khoản</button>}
          {mode === "login" && <button type="button" onClick={() => { setMode("forgot"); setMsg(null); }}>Quên mật khẩu?</button>}
        </div>
      </form>
    </div>
  );
}
