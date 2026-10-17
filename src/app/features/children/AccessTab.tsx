"use client";

import { useCallback, useEffect, useState } from "react";
import { QrCode as QrIcon, RefreshCw, ShieldOff } from "lucide-react";
import { childAccessService as api } from "@/app/services/childAccessService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ChildAccessCredential, EasyLoginSecret } from "@/app/types/supervision";
import { avatarOf, fmtDateTime } from "@/app/lib/guardian";
import QrCode from "@/app/components/QrCode";

/** Link bé mở bằng cách quét QR: trang chủ nhận ?kid=<mã> và mở phiên của bé. */
const kidLink = (secret: string) => `${window.location.origin}${window.location.pathname}?kid=${encodeURIComponent(secret)}`;

/**
 * Bước 1.10 — Owner hoặc người có quyền "Sửa cài đặt an toàn" quản lý mã QR đăng nhập của bé.
 * Mã dùng lâu dài (BR-1.15) và chỉ hiện một lần lúc tạo; avatar của bé sửa ở tab Hồ sơ.
 */
export default function AccessTab({ child }: { child: ChildProfile }) {
  const [cred, setCred] = useState<ChildAccessCredential | null | undefined>(undefined);
  const [fresh, setFresh] = useState<EasyLoginSecret | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const active = child.status === "Active";
  const av = avatarOf(child.avatarId);

  const load = useCallback(async () => {
    const r = await api.getCredential(child.id);
    setCred(r.success ? r.data : null);
    if (!r.success) setNote({ ok: false, text: r.message });
  }, [child.id]);

  useEffect(() => { setFresh(null); setCred(undefined); setNote(null); void load(); }, [load]);

  const makeQr = async () => {
    if (cred?.hasEasyLogin && !confirm("Tạo mã mới? Mã QR cũ sẽ hết hiệu lực và phiên của bé đang mở bằng mã cũ bị đóng.")) return;
    setBusy(true);
    setNote(null);
    const r = await api.generateEasyLogin(child.id);
    setBusy(false);
    if (r.success && r.data) { setFresh(r.data); await load(); }
    else setNote({ ok: false, text: r.message || "Không tạo được mã." });
  };

  const revoke = async () => {
    if (!confirm(`Thu hồi mã QR của ${child.nickname}? Mã hiện tại hết hiệu lực ngay và phiên của bé đang mở bằng mã này bị đóng.`)) return;
    setBusy(true);
    setNote(null);
    const r = await api.revokeCredential(child.id);
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? "Đã thu hồi. Tạo mã mới khi bé cần đăng nhập lại." : r.message || "Không thu hồi được." });
    if (r.success) { setFresh(null); await load(); }
  };

  if (cred === undefined) return <p className="sub">Đang tải…</p>;

  return (
    <div className="sec" style={{ gap: 24, maxWidth: 620 }}>
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}

      <section className="sec" style={{ gap: 12 }}>
        <div>
          <h3 className="display" style={{ margin: 0 }}>Đăng nhập bằng mã QR</h3>
          <p className="sub">Mở máy của bé, dùng camera quét mã để vào thẳng khu đọc truyện của {child.nickname}. Mã dùng lâu dài cho tới khi bạn tạo mã mới hoặc thu hồi.</p>
        </div>
        {!active && <div className="notice err">Hồ sơ cần đang hoạt động thì bé mới đăng nhập được.</div>}
        {fresh ? (
          <div className="qr-card">
            <QrCode value={kidLink(fresh.secret)} label={`Mã QR đăng nhập của ${child.nickname}`} />
            <div className="sec" style={{ gap: 6 }}>
              <b className="display" style={{ fontSize: 18 }}>{av.emoji} {child.nickname}</b>
              <span className="sub">Vì an toàn, mã chỉ hiện một lần. Hãy quét ngay trên máy của bé, hoặc in / chụp lại và cất cẩn thận.</span>
              <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy} onClick={() => void makeQr()}><RefreshCw className="ic" />Tạo mã mới</button>
            </div>
          </div>
        ) : cred?.hasEasyLogin ? (
          <div className="sec" style={{ gap: 8 }}>
            <p className="sub">Đã có mã QR, tạo lúc {fmtDateTime(cred.easyLoginCreatedAt)}. Mã không xem lại được; nếu bé làm mất mã, hãy tạo mã mới.</p>
            <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy} onClick={() => void makeQr()}><RefreshCw className="ic" />Tạo mã mới</button>
          </div>
        ) : (
          <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy} onClick={() => void makeQr()}><QrIcon className="ic" />Tạo mã QR</button>
        )}
      </section>

      {cred?.hasEasyLogin && (
        <section className="sec" style={{ gap: 8 }}>
          <h3 className="display" style={{ margin: 0 }}>Thu hồi mã QR</h3>
          <p className="sub">Dùng khi mất thiết bị hoặc lộ mã. Phiên của bé đang mở bằng mã này sẽ bị đóng.</p>
          <button className="btn btn-no" style={{ width: "fit-content" }} disabled={busy} onClick={() => void revoke()}><ShieldOff className="ic" />Thu hồi</button>
        </section>
      )}
    </div>
  );
}
