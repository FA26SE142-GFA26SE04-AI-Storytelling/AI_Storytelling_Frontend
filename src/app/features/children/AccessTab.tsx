"use client";
import { confirmDialog } from "@/app/lib/confirm";

import { useCallback, useEffect, useState } from "react";
import { Download, QrCode as QrIcon, RefreshCw, ShieldOff } from "lucide-react";
import { childAccessService as api } from "@/app/services/childAccessService";
import { downloadBlob } from "@/app/services/staffService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ChildAccessCredential, EasyLoginSecret } from "@/app/types/supervision";
import { avatarOf, fmtDateTime } from "@/app/lib/guardian";
import QrCode from "@/app/components/QrCode";
import { drawQrPng, qrFileName } from "./qrImage";

/** Link bé mở bằng cách quét QR: trang chủ nhận ?kid=<mã> và mở phiên của bé. */
const kidLink = (secret: string) => `${window.location.origin}${window.location.pathname}?kid=${encodeURIComponent(secret)}`;

/**
 * Bước 1.10 — Owner hoặc người có quyền "Sửa cài đặt an toàn" quản lý mã QR đăng nhập của bé.
 * Mã dùng lâu dài (BR-1.15) và luôn hiện lại cho chủ hồ sơ tới khi tạo mã mới hoặc thu hồi; avatar của bé sửa ở tab Hồ sơ.
 */
export default function AccessTab({ child }: { child: ChildProfile }) {
  const [cred, setCred] = useState<ChildAccessCredential | null | undefined>(undefined);
  const [fresh, setFresh] = useState<EasyLoginSecret | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const active = child.status === "Active";
  const av = avatarOf(child.avatarId);
  // Mã vừa tạo, hoặc mã đang dùng backend trả về khi mở lại trang.
  const secret = fresh?.secret ?? cred?.secret ?? null;

  const load = useCallback(async () => {
    const r = await api.getCredential(child.id);
    setCred(r.success ? r.data : null);
    if (!r.success) setNote({ ok: false, text: r.message });
  }, [child.id]);

  useEffect(() => { setFresh(null); setCred(undefined); setNote(null); void load(); }, [load]);

  const makeQr = async () => {
    if (cred?.hasEasyLogin && !await confirmDialog("Tạo mã mới? Mã QR cũ sẽ hết hiệu lực và phiên của bé đang mở bằng mã cũ bị đóng.")) return;
    setBusy(true);
    setNote(null);
    const r = await api.generateEasyLogin(child.id);
    setBusy(false);
    if (r.success && r.data) { setFresh(r.data); await load(); }
    else setNote({ ok: false, text: r.message || "Không tạo được mã." });
  };

  /** Lưu mã QR đang dùng thành ảnh PNG về máy phụ huynh, để bé quét trên máy khác hoặc in ra. */
  const saveQr = async () => {
    if (!secret) return;
    try {
      const png = await drawQrPng(kidLink(secret), `Mã vào đọc của ${child.nickname}`, "Mở camera hoặc nút Bé vào đọc rồi quét mã này");
      downloadBlob(png, qrFileName(child.nickname));
      setNote({ ok: true, text: "Đã lưu ảnh mã QR. Ai có ảnh này đều vào được góc đọc của bé, hãy cất cẩn thận." });
    } catch {
      setNote({ ok: false, text: "Chưa lưu được ảnh mã QR. Bạn có thể chụp màn hình mã thay thế." });
    }
  };

  const revoke = async () => {
    if (!await confirmDialog(`Thu hồi mã QR của ${child.nickname}? Mã hiện tại hết hiệu lực ngay và phiên của bé đang mở bằng mã này bị đóng.`)) return;
    setBusy(true);
    setNote(null);
    const r = await api.revokeCredential(child.id);
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? "Đã thu hồi. Tạo mã mới khi bé cần đăng nhập lại." : r.message || "Không thu hồi được." });
    if (r.success) { setFresh(null); await load(); }
  };

  if (cred === undefined) return <p className="sub">Đang tải…</p>;

  return (
    <div className="sec" style={{ gap: 24 }}>
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}

      <section className="sec" style={{ gap: 12 }}>
        <div>
        </div>
        {!active && <div className="notice err">Hồ sơ cần đang hoạt động thì bé mới đăng nhập được.</div>}
        {secret ? (
          <div className="qr-card">
            <QrCode value={kidLink(secret)} label={`Mã QR đăng nhập của ${child.nickname}`} />
            <div className="sec" style={{ gap: 6 }}>
              <b className="display" style={{ fontSize: "var(--fs-lg)" }}>{av.emoji} {child.nickname}</b>
              {(fresh?.createdAt ?? cred?.easyLoginCreatedAt) && <span className="sub">Tạo lúc {fmtDateTime(fresh?.createdAt ?? cred?.easyLoginCreatedAt)}</span>}
              <span className="sub">Mã dùng được cho tới khi bạn tạo mã mới hoặc thu hồi. Ai có mã này đều vào được góc đọc của bé, hãy cất cẩn thận.</span>
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                <button className="btn btn-p" disabled={busy} onClick={() => void saveQr()}><Download className="ic" />Lưu ảnh QR</button>
                <button className="btn btn-s" disabled={busy} onClick={() => void makeQr()}><RefreshCw className="ic" />Tạo mã mới</button>
              </div>
            </div>
          </div>
        ) : cred?.hasEasyLogin ? (
          <div className="sec" style={{ gap: 8 }}>
            <p className="sub">Đã có mã QR, tạo lúc {fmtDateTime(cred.easyLoginCreatedAt)}. Mã này tạo trước khi có tính năng xem lại nên chưa hiện được; bé vẫn dùng được mã cũ. Muốn xem QR thì tạo mã mới (mã cũ sẽ hết hiệu lực).</p>
            <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy} onClick={() => void makeQr()}><RefreshCw className="ic" />Tạo mã mới</button>
          </div>
        ) : (
          <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy} onClick={() => void makeQr()}><QrIcon className="ic" />Tạo mã QR</button>
        )}
      </section>

      {cred?.hasEasyLogin && (
        <section className="sec" style={{ gap: 8 }}>
          <h3 className="display" style={{ margin: 0 }}>Thu hồi mã QR</h3>
          <button className="btn btn-no" style={{ width: "fit-content" }} disabled={busy} onClick={() => void revoke()}><ShieldOff className="ic" />Thu hồi</button>
        </section>
      )}
    </div>
  );
}
