"use client";

import "../children/children.css";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { childAccessService } from "@/app/services/childAccessService";

/** Luồng 1 Bước 1.4 — người lớn nhập lại mật khẩu trước khi rời chế độ của bé. */
export default function ParentalGate({ email, onPass, onCancel }: { email: string; onPass: () => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    <div className="parental-gate-backdrop" role="dialog" aria-modal="true" aria-label="Xác nhận người lớn">
      <form className="parental-gate" onSubmit={submit}>
        <b className="display row" style={{ fontSize: 18 }}><Lock className="ic" />Dành cho bố mẹ</b>
        <p className="sub">Nhập mật khẩu tài khoản {email} để quay về khu người lớn.</p>
        <input className="inp" type="password" autoFocus required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Mật khẩu" />
        {err && <div className="notice err" role="alert">{err}</div>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-g" onClick={onCancel}>Ở lại với bé</button>
          <button className="btn btn-p" disabled={busy || !password}>{busy ? "Đang kiểm tra…" : "Xác nhận"}</button>
        </div>
      </form>
    </div>
  );
}
