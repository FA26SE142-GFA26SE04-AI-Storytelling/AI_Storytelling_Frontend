"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, QrCode as QrIcon, RefreshCw, ShieldOff } from "lucide-react";
import { childAccessService as api } from "@/app/services/childAccessService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ChildAccessCredential, EasyLoginCode } from "@/app/types/supervision";
import { AVATARS, avatarOf } from "@/app/lib/guardian";
import QrCode from "@/app/components/QrCode";

/** Link bé mở bằng cách quét QR: trang chủ nhận ?kid=<mã> và mở phiên của bé. */
const kidLink = (code: string) => `${window.location.origin}${window.location.pathname}?kid=${encodeURIComponent(code)}`;

function useCountdown(until: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  return until ? Math.max(0, Math.round((until - now) / 1000)) : 0;
}

/** Bước 1.10 — Owner hoặc người có quyền "Sửa cài đặt an toàn" quản lý cách bé đăng nhập. */
export default function AccessTab({ child }: { child: ChildProfile }) {
  const [cred, setCred] = useState<ChildAccessCredential | null | undefined>(undefined);
  const [avatar, setAvatar] = useState("frog");
  const [pin, setPin] = useState("");
  const [code, setCode] = useState<EasyLoginCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const left = useCountdown(code ? Date.parse(code.expiresAt) : null);
  const active = child.status === "Active";

  const load = useCallback(async () => {
    const r = await api.getCredential(child.id);
    setCred(r.success ? r.data : null);
    if (r.data) setAvatar(r.data.avatarId);
  }, [child.id]);

  useEffect(() => { setCode(null); setCred(undefined); void load(); }, [load]);

  const run = async (fn: () => Promise<{ success: boolean; message: string }>, okText: string) => {
    setBusy(true);
    setNote(null);
    const r = await fn();
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? okText : r.message || "Không thực hiện được." });
    return r.success;
  };

  const saveCred = async () => {
    if (!/^\d{4}$/.test(pin)) { setNote({ ok: false, text: "Mã PIN gồm đúng 4 chữ số." }); return; }
    if (await run(() => api.setCredential(child.id, avatar, pin), "Đã lưu avatar và mã PIN.")) { setPin(""); await load(); }
  };

  const makeQr = async () => {
    setBusy(true);
    setNote(null);
    const r = await api.generateEasyLogin(child.id);
    setBusy(false);
    if (r.success && r.data) setCode(r.data);
    else setNote({ ok: false, text: r.message || "Không tạo được mã." });
  };

  const revoke = async () => {
    if (!confirm(`Thu hồi truy cập của ${child.nickname}? Mã QR và mã PIN hiện tại sẽ hết hiệu lực ngay.`)) return;
    if (await run(() => api.revokeCredential(child.id), "Đã thu hồi. Hãy đặt mã PIN mới khi bé cần đăng nhập lại.")) { setCode(null); await load(); }
  };

  if (cred === undefined) return <p className="sub">Đang tải…</p>;
  const av = avatarOf(avatar);

  return (
    <div className="sec" style={{ gap: 24, maxWidth: 620 }}>
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}

      <section className="sec" style={{ gap: 12 }}>
        <div>
          <h3 className="display" style={{ margin: 0 }}>Avatar và mã PIN</h3>
          <p className="sub">Avatar giúp bé nhận ra hồ sơ của mình. {cred ? "Đã thiết lập — nhập mã PIN mới nếu muốn đổi." : "Cần thiết lập trước khi tạo mã QR."}</p>
        </div>
        <div className="avatars" role="radiogroup" aria-label="Avatar của bé">
          {AVATARS.map((a) => (
            <button key={a.id} type="button" role="radio" aria-checked={avatar === a.id} aria-label={a.label} className={`avatar${avatar === a.id ? " on" : ""}`} onClick={() => setAvatar(a.id)}>{a.emoji}</button>
          ))}
        </div>
        <div className="row">
          <input className="inp" style={{ maxWidth: 160, letterSpacing: 6, textAlign: "center" }} inputMode="numeric" maxLength={4} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" aria-label="Mã PIN 4 số" />
          <button className="btn btn-s" disabled={busy || pin.length !== 4} onClick={() => void saveCred()}><KeyRound className="ic" />{cred ? "Đổi mã PIN" : "Lưu"}</button>
        </div>
        {cred?.isLocked && <div className="notice err">Đăng nhập của bé đang bị khóa tạm do nhập sai nhiều lần.</div>}
      </section>

      <section className="sec" style={{ gap: 12 }}>
        <div>
          <h3 className="display" style={{ margin: 0 }}>Đăng nhập bằng mã QR</h3>
          <p className="sub">Mở máy của bé, dùng camera quét mã để vào thẳng khu đọc truyện của {child.nickname}. Tạo mã mới thì mã cũ hết hiệu lực ngay.</p>
        </div>
        {!active && <div className="notice err">Hồ sơ cần được kích hoạt trước khi bé đăng nhập.</div>}
        {code && left > 0 ? (
          <div className="qr-card">
            <QrCode value={kidLink(code.code)} label={`Mã QR đăng nhập của ${child.nickname}`} />
            <div className="sec" style={{ gap: 6 }}>
              <b className="display" style={{ fontSize: 18 }}>{av.emoji} {child.nickname}</b>
              <span className="sub">Mã còn hiệu lực {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} và chỉ dùng được một lần.</span>
              <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy} onClick={() => void makeQr()}><RefreshCw className="ic" />Tạo mã mới</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy || !cred || !active} onClick={() => void makeQr()}><QrIcon className="ic" />{code ? "Mã đã hết hạn — tạo mã mới" : "Tạo mã QR"}</button>
        )}
      </section>

      {cred && (
        <section className="sec" style={{ gap: 8 }}>
          <h3 className="display" style={{ margin: 0 }}>Thu hồi truy cập</h3>
          <p className="sub">Dùng khi mất thiết bị hoặc lộ mã. Phiên của bé đang mở bằng thông tin cũ sẽ bị đóng.</p>
          <button className="btn btn-no" style={{ width: "fit-content" }} disabled={busy} onClick={() => void revoke()}><ShieldOff className="ic" />Thu hồi</button>
        </section>
      )}
    </div>
  );
}
