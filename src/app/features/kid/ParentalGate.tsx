"use client";

import "../children/children.css";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { childAccessService } from "@/app/services/childAccessService";
import { useDialog } from "./useDialog";

/** Luồng 1 Bước 1.4 — người lớn nhập lại mật khẩu trước khi rời chế độ của bé. */
export default function ParentalGate({ email, onPass, onCancel }: { email: string; onPass: () => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const boxRef = useDialog<HTMLFormElement>(onCancel);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await childAccessService.verifyParentalGate(email, password);
    setBusy(false);
    if (r.success) onPass();
    else setErr(r.message || "Mật khẩu chưa đúng.");
  };

  return (
    <div className="parental-gate-backdrop" role="dialog" aria-modal="true" aria-labelledby="parental-gate-title">
      <form ref={boxRef} className="parental-gate" onSubmit={submit}>
        <b id="parental-gate-title" className="display row" style={{ fontSize: 18 }}><Lock className="ic" />Dành cho bố mẹ</b>
        <p className="sub">Nhập mật khẩu tài khoản {email} để quay về khu người lớn.</p>
        {/* Ô ẩn để trình quản lý mật khẩu biết đang điền cho tài khoản nào. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <input className="inp" type="password" name="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Mật khẩu" />
        {err && <div className="notice err" role="alert">{err}</div>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-g" onClick={onCancel}>Ở lại với bé</button>
          <button className="btn btn-p" disabled={busy || !password}>{busy ? "Đang kiểm tra…" : "Xác nhận"}</button>
        </div>
      </form>
    </div>
  );
}
