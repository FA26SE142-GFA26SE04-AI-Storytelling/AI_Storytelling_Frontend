"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut, RefreshCw, Send } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import { useAuth } from "@/app/context/AuthContext";
import { creatorSelfService } from "@/app/services/creatorAdminService";
import type { CreatorApplication } from "@/app/types/creatorAdmin";
import { fmt } from "./ui";

/**
 * Creator tự đăng ký đang chờ Administrator duyệt (Luồng 5, M5): đăng nhập được nhưng chỉ xem trạng thái đơn.
 * Bị từ chối thì thấy lý do và nộp lại phần giới thiệu. Được duyệt thì phiên cũ hết hiệu lực, đăng nhập lại để vào khu Creator.
 */
export default function CreatorApplicationPending() {
  const { user, logout } = useAuth();
  const [app, setApp] = useState<CreatorApplication | null>(null);
  const [error, setError] = useState("");
  const [intro, setIntro] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const r = await creatorSelfService.myApplication();
    if (r.success && r.data) {
      setApp(r.data);
      setIntro(r.data.introduction);
      setPortfolio(r.data.portfolioUrl ?? "");
      setError("");
    } else {
      // Đơn vừa được duyệt: token vai trò tạm bị thu hồi.
      setError(r.status === 401 ? "Phiên đăng nhập đã hết hiệu lực. Nếu đơn đã được duyệt, hãy đăng nhập lại." : r.message);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const resubmit = async () => {
    const text = intro.trim();
    if (text.length < 20 || text.length > 1000) { setMsg({ ok: false, text: "Phần giới thiệu từ 20 đến 1000 ký tự." }); return; }
    setBusy(true);
    const r = await creatorSelfService.resubmit(text, portfolio.trim() || null);
    setBusy(false);
    setMsg({ ok: r.success, text: r.success ? "Đã nộp lại đơn. Administrator sẽ xem xét." : r.message });
    if (r.success && r.data) setApp(r.data);
  };

  const status = app?.status;
  return (
    <div className="login-wrap">
      <PondBackdrop />
      <div className="login-card" role="region" aria-label="Đơn đăng ký Content Creator">
        <span className="login-frog"><Frog size={110} mood={status === "Rejected" ? "think" : "happy"} /></span>
        <h1 className="display">{status === "Rejected" ? "Đơn chưa được duyệt" : "Đơn đang chờ duyệt"}</h1>
        <p className="sub">Xin chào {user?.fullName}. Tài khoản Content Creator cần Administrator duyệt trước khi dùng được khu sáng tác.</p>

        {error && <div className="notice err" role="status">{error}</div>}
        {app && <>
          <p className="sub">Nộp lúc {fmt(app.createdAt)}{app.reviewedAt ? ` · xử lý lúc ${fmt(app.reviewedAt)}` : ""}</p>
          {status === "Pending" && <div className="notice">Đơn của bạn đang chờ xử lý. Bạn sẽ nhận email khi có kết quả.</div>}
          {status === "Approved" && <div className="notice ok">Đơn đã được duyệt. Hãy đăng xuất rồi đăng nhập lại để vào khu Content Creator.</div>}
          {status === "Rejected" && <>
            <div className="notice err">Lý do: {app.rejectionReason ?? "Không có"}</div>
            <label className="field"><span className="lbl">Giới thiệu bản thân ({intro.trim().length}/1000)</span>
              <textarea className="inp" rows={5} maxLength={1000} value={intro} onChange={(e) => setIntro(e.target.value)} />
            </label>
            <label className="field"><span className="lbl">Link portfolio (không bắt buộc)</span>
              <input className="inp" type="url" maxLength={500} value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
            </label>
            <button type="button" className="btn btn-p btn-c" disabled={busy} onClick={() => void resubmit()}><Send className="ic" />Nộp lại đơn</button>
          </>}
        </>}
        {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} role="alert">{msg.text}</div>}

        <div className="login-links">
          <button type="button" onClick={() => void load()}><RefreshCw className="ic" />Tải lại trạng thái</button>
          <button type="button" onClick={() => void logout()}><LogOut className="ic" />Đăng xuất</button>
        </div>
      </div>
    </div>
  );
}
