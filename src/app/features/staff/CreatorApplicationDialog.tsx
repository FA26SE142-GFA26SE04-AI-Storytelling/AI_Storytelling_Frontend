"use client";

import { useState } from "react";
import { Check, ExternalLink, MailWarning, X } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { adminCreatorService as svc, type AdminCreatorApplication } from "@/app/services/adminCreatorService";
import { Pill, ReasonField, fmt } from "./ui";

/** Xem một đơn đăng ký Content Creator; đơn chờ duyệt thì Admin duyệt hoặc từ chối (lý do bắt buộc). */
export function CreatorApplicationDialog({ app, onClose, onDone }: { app: AdminCreatorApplication; onClose: () => void; onDone: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = app.status === "Pending";
  // Backend chặn cả duyệt lẫn từ chối khi Creator chưa xác thực email.
  const unverified = app.applicantStatus === "Registered";
  const portfolio = app.portfolioUrl && /^https?:\/\//i.test(app.portfolioUrl) ? app.portfolioUrl : null;

  const finish = async (call: () => ReturnType<typeof svc.approve>, okText: string) => {
    setBusy(true);
    const r = await call();
    setBusy(false);
    if (!r.success) { showToast(r.message || "Không xử lý được đơn.", "err"); return; }
    showToast(r.message || okText);
    onDone();
  };
  const approve = async () => {
    if (!(await confirmDialog(`Duyệt đơn của ${app.applicantFullName}? Tài khoản được kích hoạt, Creator nhận thông báo và email.`))) return;
    await finish(() => svc.approve(app.id), "Đã duyệt đơn đăng ký.");
  };

  return (
    <Dialog title="Đơn đăng ký Content Creator" onClose={onClose} className="st-dlg" wide>
      <div className="kv">
        <div><small>Họ tên</small><b>{app.applicantFullName}</b></div>
        <div><small>Username</small><b>{app.applicantUsername}</b></div>
        <div><small>Email</small><b>{app.applicantEmail}</b></div>
        <div><small>Nộp lúc</small><b>{fmt(app.createdAt)}</b></div>
        <div><small>Tài khoản</small><Pill status={app.applicantStatus} /></div>
        <div><small>Đơn</small><Pill status={app.status} /></div>
      </div>
      <div className="field">
        <span className="lbl">Giới thiệu bản thân</span>
        <div className="st-content">{app.introduction}</div>
      </div>
      {portfolio && <a className="btn btn-s" href={portfolio} target="_blank" rel="noopener noreferrer"><ExternalLink className="ic" />Mở portfolio</a>}
      {!pending && (
        <div className="kv">
          <div><small>Người xử lý</small><b>{app.reviewedByName ?? "—"}</b></div>
          <div><small>Xử lý lúc</small><b>{fmt(app.reviewedAt)}</b></div>
        </div>
      )}
      {app.rejectionReason && <div className="field"><span className="lbl">Lý do từ chối</span><div className="st-content">{app.rejectionReason}</div></div>}

      {pending && unverified && <div className="notice warn" role="status"><MailWarning className="ic" /> Creator chưa xác thực email nên chưa duyệt được đơn.</div>}
      {pending && !unverified && (rejecting ? <>
        <ReasonField label="Lý do từ chối" value={reason} onChange={setReason} />
        <div className="row">
          <button type="button" className="btn btn-s" disabled={busy} onClick={() => setRejecting(false)}>Huỷ</button>
          <button type="button" className="btn btn-no" disabled={busy || !reason.trim()} onClick={() => void finish(() => svc.reject(app.id, reason.trim()), "Đã từ chối đơn đăng ký.")}><X className="ic" />Gửi từ chối</button>
        </div>
      </> : (
        <div className="row">
          <button type="button" className="btn btn-ok" disabled={busy} onClick={() => void approve()}><Check className="ic" />Duyệt</button>
          <button type="button" className="btn btn-no" disabled={busy} onClick={() => setRejecting(true)}><X className="ic" />Từ chối</button>
        </div>
      ))}
    </Dialog>
  );
}
