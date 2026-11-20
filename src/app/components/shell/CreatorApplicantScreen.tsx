"use client";

import "@/app/styles/components/shell/login.css";
import "@/app/styles/components/shell/applicant.css";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ExternalLink, LogOut, RefreshCw, Send } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import Dialog from "@/app/components/Dialog";
import IconButton from "@/app/components/IconButton";
import { useAuth } from "@/app/context/AuthContext";
import { useRiseIn } from "@/app/lib/motion";
import { fmtDate } from "@/app/lib/guardian";
import { showToast } from "@/app/lib/toast";
import { authService } from "@/app/services/authService";
import { creatorApplicationService } from "@/app/services/creatorApplicationService";
import type { CreatorApplication } from "@/app/types/creatorApplication";

const isWebLink = (url?: string | null): url is string => !!url && /^https?:\/\//i.test(url);

/**
 * Content Creator tự đăng ký, đã xác thực email, đang chờ Administrator duyệt (status AwaitingApproval).
 * Token mang role tạm CreatorApplicant nên chỉ gọi được API đơn đăng ký; màn này thay cho StaffApp.
 */
export default function CreatorApplicantScreen() {
  const { logout } = useAuth();
  const [app, setApp] = useState<CreatorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const cardRef = useRiseIn<HTMLDivElement>(":scope > *", [app?.status]);

  const check = useCallback(async (manual: boolean) => {
    setLoading(true);
    const r = await creatorApplicationService.mine();
    if (!r.success || !r.data) {
      setLoading(false);
      // 401: phiên đã hết, authService tự đăng xuất về màn đăng nhập.
      if (r.status !== 401) showToast(r.message || "Chưa tải được đơn đăng ký của bạn.", "err");
      return;
    }
    if (r.data.status === "Approved" || r.data.applicantStatus === "Active") {
      // Token role tạm bị thu hồi sau khi duyệt; nếu lần gọi trên đã tự làm mới phiên thì không làm lại.
      if (authService.getStoredUser()?.status === "AwaitingApproval") {
        // Gọi thẳng authService (hàm ổn định): AuthContext nhận user mới qua onAuthStateChange.
        const s = await authService.refreshToken();
        if (!s.success || s.data?.user.status === "AwaitingApproval") {
          showToast("Đơn đã được duyệt, hãy đăng nhập lại.", "warn");
          await authService.logout();
          return;
        }
      }
      showToast("Đơn của bạn đã được duyệt. Chào mừng đến khu Content Creator!", "ok");
      return;
    }
    setApp(r.data);
    setLoading(false);
    if (manual) showToast(r.data.status === "Pending" ? "Đơn vẫn đang chờ quản trị viên duyệt." : "Đơn chưa được duyệt, bạn có thể nộp lại.", "info");
  }, []);

  useEffect(() => { void check(false); }, [check]);

  const rejected = app?.status === "Rejected";
  return (
    <div className="login-wrap">
      <PondBackdrop />
      <div ref={cardRef} className="login-card cap-card">
        <span className="login-frog"><Frog size={110} mood={rejected ? "idle" : "think"} /></span>
        <div className="cap-tools">
          <IconButton icon={RefreshCw} label="Kiểm tra lại" className="btn btn-g" iconClassName={loading ? "ic cap-spin" : "ic"} disabled={loading} onClick={() => void check(true)} />
          <IconButton icon={LogOut} label="Đăng xuất" className="btn btn-g" onClick={() => void logout()} />
        </div>
        <h1 className="display">{!app ? "Đơn đăng ký Content Creator" : rejected ? "Đơn chưa được duyệt" : "Đơn của bạn đang chờ duyệt"}</h1>
        {!app ? (
          <p className="sub">{loading ? "Đang tải đơn đăng ký…" : "Chưa tải được đơn. Bấm Kiểm tra lại để thử lần nữa."}</p>
        ) : (
          <>
            <div className="cap-meta">
              <span className={`pill ${rejected ? "flag" : "wait"}`}>{rejected ? "Chưa được duyệt" : "Chờ duyệt"}</span>
              <span>Nộp ngày {fmtDate(app.createdAt)}</span>
              {rejected && app.reviewedAt && <span>Xét ngày {fmtDate(app.reviewedAt)}</span>}
            </div>
            {rejected && (
              <div className="cap-box cap-reason">
                <span className="lbl">Lý do</span>
                <p>{app.rejectionReason || "Quản trị viên chưa ghi lý do."}</p>
              </div>
            )}
            <div className="cap-box">
              <span className="lbl">Giới thiệu bản thân</span>
              <p className="cap-intro">{app.introduction}</p>
              {isWebLink(app.portfolioUrl) && (
                <a className="cap-link" href={app.portfolioUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="ic" aria-hidden />Xem portfolio</a>
              )}
            </div>
            {rejected
              ? <button type="button" className="btn btn-p btn-c" onClick={() => setEditing(true)}><Send className="ic" aria-hidden />Nộp lại đơn</button>
              : <p className="sub">Quản trị viên sẽ xem đơn và báo kết quả qua email.</p>}
          </>
        )}
      </div>
      {editing && app && <ResubmitDialog app={app} onClose={() => setEditing(false)} onDone={(next) => { setApp(next); setEditing(false); }} />}
    </div>
  );
}

function ResubmitDialog({ app, onClose, onDone }: { app: CreatorApplication; onClose: () => void; onDone: (next: CreatorApplication) => void }) {
  const [intro, setIntro] = useState(app.introduction);
  const [portfolio, setPortfolio] = useState(app.portfolioUrl ?? "");
  const [busy, setBusy] = useState(false);
  const length = intro.trim().length;
  const valid = length >= 20 && length <= 1000 && portfolio.trim().length <= 500;
  const dirty = intro.trim() !== app.introduction.trim() || portfolio.trim() !== (app.portfolioUrl ?? "").trim();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || !dirty || busy) return;
    setBusy(true);
    const r = await creatorApplicationService.resubmit({ introduction: intro.trim(), portfolioUrl: portfolio.trim() || null });
    setBusy(false);
    if (r.success && r.data) {
      showToast("Đã nộp lại đơn. Quản trị viên sẽ xét duyệt sớm.", "ok");
      onDone(r.data);
    } else showToast(r.errors?.[0] ?? r.message, "err");
  };

  return (
    <Dialog title="Nộp lại đơn" onClose={onClose}>
      <form className="cap-form" onSubmit={submit}>
        <label className="field"><span className="lbl">Giới thiệu bản thân ({intro.length}/1000)</span>
          <textarea className="inp" rows={6} minLength={20} maxLength={1000} required autoFocus value={intro} onChange={(e) => setIntro(e.target.value)} /></label>
        <label className="field"><span className="lbl">Link portfolio (không bắt buộc)</span>
          <input className="inp" type="url" maxLength={500} placeholder="https://" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} /></label>
        <button className="btn btn-p btn-c" disabled={!valid || !dirty || busy}><Send className="ic" aria-hidden />{busy ? "Đang gửi…" : "Gửi"}</button>
      </form>
    </Dialog>
  );
}
