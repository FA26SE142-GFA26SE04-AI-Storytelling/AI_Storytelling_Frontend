"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Search } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { staffService } from "@/app/services/staffService";
import type { CreatorApplication, ParentAccount, StaffAccount } from "@/app/types/staff";
import { Notice, Page, Pill, fmt, fmtDay, useAction } from "./ui";
import { AdminGrant } from "./AdminSystem";

const ROLE: Record<string, string> = { Administrator: "Administrator", Moderator: "Moderator", ContentCreator: "Content Creator" };

/** Luồng 5 Bước 5.1b, 5.1d — tài khoản vận hành: mời Administrator/Moderator, duyệt đơn Content Creator, vô hiệu hoá. */
export function AdminStaff() {
  const { user } = useAuth();
  const me = user?.id ?? -1;
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [apps, setApps] = useState<CreatorApplication[]>([]);
  const [inv, setInv] = useState({ role: "Moderator" as "Administrator" | "Moderator", email: "", fullName: "", expertise: "" });
  const [review, setReview] = useState<Record<number, string>>({});
  const load = useCallback(async () => {
    const [s, a] = await Promise.all([staffService.staff(), staffService.applications()]);
    setStaff(s.data ?? []);
    setApps(a.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);
  const pending = apps.filter((a) => a.status === "pending");

  return (
    <Page title="Tài khoản vận hành" sub="Administrator và Moderator được mời qua email (link 72 giờ, dùng 1 lần), tự đặt mật khẩu và thiết lập TOTP. Content Creator tự đăng ký, Administrator duyệt. Mỗi vai trò dùng một email riêng; không đổi vai trò của tài khoản có sẵn.">
      <Notice note={note} />
      <div className="st-card">
        <h3>Mời tài khoản mới</h3>
        <div className="st-form">
          <label className="field"><span className="lbl">Vai trò</span>
            <select className="inp" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value as "Administrator" | "Moderator" })}><option value="Moderator">Moderator</option><option value="Administrator">Administrator</option></select></label>
          <label className="field"><span className="lbl">Họ tên</span><input className="inp" value={inv.fullName} onChange={(e) => setInv({ ...inv, fullName: e.target.value })} /></label>
          <label className="field"><span className="lbl">Email</span><input className="inp" type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></label>
          {inv.role === "Moderator" && <label className="field"><span className="lbl">Chuyên môn</span><input className="inp" value={inv.expertise} onChange={(e) => setInv({ ...inv, expertise: e.target.value })} placeholder="VD: Giáo viên tiểu học" /></label>}
          <button className="btn btn-p" disabled={busy || !/^\S+@\S+\.\S+$/.test(inv.email) || !inv.fullName.trim()}
            onClick={() => void run(() => staffService.invite(inv.role, inv.email.trim(), inv.fullName.trim(), inv.expertise.trim())).then((ok) => ok && setInv({ ...inv, email: "", fullName: "", expertise: "" }))}><Mail className="ic" />Gửi lời mời</button>
        </div>
      </div>

      <div className="st-card">
        <h3>Đơn đăng ký Content Creator <span className="pill wait">{pending.length} chờ duyệt</span></h3>
        {pending.length === 0 && <p className="sub">Không có đơn nào đang chờ.</p>}
        {pending.map((a) => {
          const old = Date.now() - Date.parse(a.createdAt) > 7 * 86_400_000;
          return (
            <div key={a.id} className="st-item">
              <span className="row"><b className="grow">{a.fullName} · {a.email}</b>{old && <span className="pill flag">Chờ quá 7 ngày</span>}</span>
              <small>{a.expertise} · {a.yearsExperience} năm kinh nghiệm · nộp {fmtDay(a.createdAt)}</small>
              <span style={{ fontSize: 13 }}>{a.experienceNote}</span>
              {a.portfolioUrl && <a className="link-btn" href={a.portfolioUrl} target="_blank" rel="noreferrer">Xem portfolio</a>}
              <div className="row">
                <input className="inp" value={review[a.id] ?? ""} onChange={(e) => setReview({ ...review, [a.id]: e.target.value })} placeholder="Nhận xét (khi duyệt) hoặc lý do (khi từ chối) — bắt buộc" aria-label="Nhận xét" />
                <button className="btn btn-ok" disabled={busy} onClick={() => void run(() => staffService.reviewApplication(a.id, true, review[a.id] ?? ""))}>Duyệt</button>
                <button className="btn btn-no" disabled={busy} onClick={() => void run(() => staffService.reviewApplication(a.id, false, review[a.id] ?? ""))}>Từ chối</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="st-card st-scroll">
        <h3>Tất cả tài khoản vận hành</h3>
        <table className="st-table">
          <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Chuyên môn</th><th>Trạng thái</th><th>Tạo ngày</th><th /></tr></thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.userId}>
                <td>{s.fullName}{s.userId === me && <small className="sub"> (bạn)</small>}</td>
                <td>{s.email}</td>
                <td>{ROLE[s.role]}</td>
                <td>{s.expertise ?? "—"}</td>
                <td><Pill status={s.status} /></td>
                <td>{fmtDay(s.createdAt)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {s.status === "invited" && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.cancelInvite(s.userId))}>Huỷ lời mời</button>}
                  {s.status === "active" && s.userId !== me && <button className="btn btn-g" disabled={busy} onClick={() => { if (confirm(`Vô hiệu hoá ${s.fullName}? Tài khoản bị đăng xuất khỏi mọi thiết bị.`)) void run(() => staffService.setStaffActive(s.userId, false, me)); }}>Vô hiệu hoá</button>}
                  {s.status === "deactivated" && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.setStaffActive(s.userId, true, me))}>Kích hoạt lại</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminGrant />
    </Page>
  );
}

const SUSPEND_REASONS = ["Spam báo cáo", "Cố tình tạo nội dung không phù hợp", "Gian lận thanh toán", "Theo kết quả xử lý báo cáo", "Khác"];

/** Luồng 5 Bước 5.1e — quản lý tài khoản Parent ở mức tài khoản; không xem dữ liệu của trẻ (BR-5.1g). */
export function AdminParents() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [list, setList] = useState<ParentAccount[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [reason, setReason] = useState(SUSPEND_REASONS[0]);
  const [noteText, setNoteText] = useState("");
  const load = useCallback(async () => { setList((await staffService.parents(q, status)).data ?? []); }, [q, status]);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);
  const cur = list.find((p) => p.userId === sel) ?? null;

  return (
    <Page title="Tài khoản phụ huynh" sub="Chỉ thấy thông tin tài khoản và số liệu đếm; không thấy biệt danh, truyện hay dữ liệu học tập của bé. Tạm khoá phụ huynh không làm bé mất quyền đọc truyện đã duyệt (qua mã QR).">
      <Notice note={note} />
      <div className="row">
        <label className="row grow"><Search className="ic" /><input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo email hoặc họ tên" aria-label="Tìm" /></label>
        <select className="inp" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Trạng thái">
          <option value="all">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="locked">Khoá đăng nhập</option><option value="suspended">Tạm khoá</option><option value="unverified">Chưa xác thực</option>
        </select>
      </div>
      <div className="st-split">
        <div className="st-list">
          {list.map((p) => (
            <button key={p.userId} className={`st-item${cur?.userId === p.userId ? " on" : ""}`} onClick={() => setSel(p.userId)}>
              <span className="row"><b className="grow">{p.fullName}</b><Pill status={p.status} /></span>
              <small>{p.email}</small>
            </button>
          ))}
          {list.length === 0 && <p className="sub">Không tìm thấy tài khoản.</p>}
        </div>
        {cur ? (
          <div className="st-card">
            <h3>{cur.fullName}</h3>
            <div className="kv">
              <div><small>Email</small><b>{cur.email}</b></div>
              <div><small>Trạng thái</small><b><Pill status={cur.status} /></b></div>
              <div><small>Ngày tạo</small><b>{fmtDay(cur.createdAt)}</b></div>
              <div><small>Đăng nhập cuối</small><b>{fmt(cur.lastLoginAt)}</b></div>
              <div><small>Số hồ sơ bé đang giám sát</small><b>{cur.childCount}</b></div>
              <div><small>Lượt tạo truyện đã dùng</small><b>{cur.quotaUsed}</b></div>
              <div><small>Báo cáo đã gửi</small><b>{cur.reportsSent}</b></div>
              <div><small>Báo cáo nhắm vào truyện của họ</small><b>{cur.reportsAgainst}</b></div>
            </div>
            {cur.suspendedReason && <div className="notice err">Lý do tạm khoá: {cur.suspendedReason}</div>}
            {cur.status === "locked" && <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy} onClick={() => void run(() => staffService.unlockParentLogin(cur.userId))}>Mở khoá đăng nhập sớm</button>}
            {cur.status !== "suspended" ? (
              <div className="sec" style={{ gap: 8 }}>
                <span className="lbl">Tạm khoá tài khoản</span>
                <select className="inp" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Lý do">{SUSPEND_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                <input className="inp" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ghi chú" aria-label="Ghi chú" />
                <button className="btn btn-no" style={{ width: "fit-content" }} disabled={busy} onClick={() => { if (confirm(`Tạm khoá ${cur.fullName}?`)) void run(() => staffService.suspendParent(cur.userId, reason, noteText)); }}>Tạm khoá</button>
              </div>
            ) : (
              <div className="sec" style={{ gap: 8 }}>
                <input className="inp" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ghi chú mở khoá (bắt buộc)" aria-label="Ghi chú mở khoá" />
                <button className="btn btn-ok" style={{ width: "fit-content" }} disabled={busy} onClick={() => void run(() => staffService.reinstateParent(cur.userId, noteText))}>Mở khoá tài khoản</button>
              </div>
            )}
          </div>
        ) : <div className="st-card"><p className="sub">Chọn một tài khoản để xem.</p></div>}
      </div>
    </Page>
  );
}
