"use client";

import { useState } from "react";
import { supervisionService as api } from "@/app/services/supervisionService";
import type { InvitationClaim, InvitationPreview } from "@/app/types/supervision";
import { ageLabel } from "@/app/lib/storyView";
import { fmtDateTime } from "@/app/lib/guardian";

type Step = { kind: "code" } | { kind: "otp"; claim: InvitationClaim } | { kind: "preview"; preview: InvitationPreview };

/**
 * Bước 1.6, BR-1.4 — nhận lời mời giám sát: nhập mã mời → nhập OTP gửi tới email được mời
 * → xem hồ sơ bé rồi Nhận hoặc Từ chối.
 */
export default function JoinInvitation({ onJoined, onCancel }: { onJoined: (childId: number) => void; onCancel: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "code" });
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // Mã mời phân biệt chữ hoa / thường: giữ nguyên, chỉ bỏ khoảng trắng.
  const invitationCode = code.trim();

  const call = async <T,>(fn: () => Promise<{ success: boolean; message: string; data: T | null }>) => {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    setBusy(false);
    if (!r.success) setMsg({ ok: false, text: r.message || "Không thực hiện được." });
    return r.success ? r.data : null;
  };

  const claim = async (resend = false) => {
    const data = await call(() => api.claimInvitation(invitationCode));
    if (data) { setStep({ kind: "otp", claim: data }); setOtp(""); if (resend) setMsg({ ok: true, text: "Đã gửi lại mã xác thực." }); }
  };

  const verify = async () => {
    const data = await call(() => api.verifyInvitationOtp(invitationCode, otp.trim()));
    if (data) setStep({ kind: "preview", preview: data });
  };

  const accept = async () => {
    const data = await call(() => api.acceptInvitation(invitationCode));
    if (data) onJoined(data.childProfileId);
  };

  const reject = async () => {
    if (!confirm("Từ chối lời mời này? Mã mời sẽ không dùng được nữa.")) return;
    setBusy(true);
    setMsg(null);
    const r = await api.rejectInvitation(invitationCode);
    setBusy(false);
    if (r.success) onCancel();
    else setMsg({ ok: false, text: r.message || "Chưa từ chối được lời mời." });
  };

  return (
    <div className="sec" style={{ gap: 12, maxWidth: 460 }}>
      <h3 className="display" style={{ margin: 0 }}>Nhận lời mời giám sát</h3>

      {step.kind === "code" && (
        <form className="sec" style={{ gap: 12 }} onSubmit={(e) => { e.preventDefault(); void claim(); }}>
          <p className="sub">Người quản lý chính của bé gửi mã mời tới email của bạn. Nhập mã, sau đó nhập mã xác thực gửi tới chính email đó.</p>
          <input className="inp" autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="Dán mã mời từ email" aria-label="Mã mời" autoComplete="off" spellCheck={false} />
          <div className="row">
            <button type="button" className="btn btn-g" onClick={onCancel}>Hủy</button>
            <button className="btn btn-p" disabled={busy || !invitationCode}>{busy ? "Đang kiểm tra…" : "Tiếp tục"}</button>
          </div>
        </form>
      )}

      {step.kind === "otp" && (
        <form className="sec" style={{ gap: 12 }} onSubmit={(e) => { e.preventDefault(); void verify(); }}>
          <p className="sub">Đã gửi mã xác thực 6 số tới <b>{step.claim.maskedEmail}</b>. Mã hết hạn lúc {fmtDateTime(step.claim.otpExpiresAt)}.</p>
          <input className="inp" autoFocus inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••" aria-label="Mã xác thực" style={{ letterSpacing: 6, textAlign: "center", maxWidth: 200 }} />
          <div className="row">
            <button type="button" className="btn btn-g" disabled={busy} onClick={() => { setStep({ kind: "code" }); setMsg(null); }}>Quay lại</button>
            <button type="button" className="btn btn-s" disabled={busy} onClick={() => void claim(true)}>Gửi lại mã</button>
            <button className="btn btn-p" disabled={busy || otp.length !== 6}>{busy ? "Đang xác thực…" : "Xác thực"}</button>
          </div>
        </form>
      )}

      {step.kind === "preview" && (
        <div className="sec" style={{ gap: 12 }}>
          <div className="kv">
            <div><small>Người mời</small><b>{step.preview.inviterName || "—"}</b></div>
            <div><small>Bé</small><b>{step.preview.childNickname}</b></div>
            <div><small>Nhóm tuổi</small><b>{ageLabel(step.preview.childAgeBand)}</b></div>
          </div>
          <p className="sub">Nhận lời mời, bạn sẽ có 4 quyền cơ bản: xem tiến độ, xem kết quả, nhận báo cáo và duyệt truyện. Người quản lý chính có thể cấp thêm hoặc thu hồi quyền.</p>
          <div className="row">
            <button className="btn btn-s" disabled={busy} onClick={() => void reject()}>Từ chối</button>
            <button className="btn btn-p" disabled={busy} onClick={() => void accept()}>{busy ? "Đang xử lý…" : "Nhận lời mời"}</button>
          </div>
        </div>
      )}

      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} role={msg.ok ? "status" : "alert"}>{msg.text}</div>}
    </div>
  );
}
