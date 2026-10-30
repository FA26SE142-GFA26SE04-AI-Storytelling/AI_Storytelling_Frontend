"use client";
import UnavailableFeature from "./UnavailableFeature";

import { useCallback, useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { confirmDialog } from "@/app/lib/confirm";
import { staffService } from "@/app/services/staffService";
import type { StaffAccount, StaffAccountRole } from "@/app/types/staff";
import { Notice, Page, Pill, fmtDay, useAction } from "./ui";

const ROLE: Record<string, string> = { Administrator: "Administrator", Moderator: "Moderator", ContentCreator: "Content Creator" };
const ROLE_FILTERS: { id: StaffAccountRole | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" }, { id: "Moderator", label: "Moderator" }, { id: "Administrator", label: "Administrator" },
];
const EMPTY_INVITE = { role: "Moderator" as StaffAccountRole, email: "", fullName: "", expertise: "", note: "" };

/** Luồng 5 Bước 5.1b, 5.1d — tài khoản vận hành (API /StaffAccount): mời Moderator/Administrator, huỷ lời mời, vô hiệu hoá. */
export function AdminStaff() {
  const { user } = useAuth();
  const me = user?.id ?? -1;
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [filter, setFilter] = useState<StaffAccountRole | "all">("all");
  const [inv, setInv] = useState(EMPTY_INVITE);
  const load = useCallback(async () => {
    const s = await staffService.staff(filter === "all" ? undefined : filter);
    setStaff(s.data ?? []);
  }, [filter]);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);
  const isModerator = inv.role === "Moderator";
  const canInvite = /^\S+@\S+\.\S+$/.test(inv.email) && !!inv.fullName.trim() && (!isModerator || !!inv.expertise.trim());

  return (
    <Page title="Tài khoản vận hành" sub="Moderator và Administrator được mời qua email: email chứa mã mời 72 giờ, dùng 1 lần; người được mời mở trang đăng nhập → “Kích hoạt tài khoản vận hành” để đặt mật khẩu và xác nhận cam kết. Content Creator tự đăng ký, Administrator duyệt.">
      <Notice note={note} />
      <div className="st-card">
        <h3>Mời tài khoản vận hành</h3>
        <div className="st-form">
          <div className="field">
            <span className="lbl">Vai trò</span>
            <div className="seg" role="radiogroup" aria-label="Vai trò được mời" style={{ maxWidth: 320 }}>
              {(["Moderator", "Administrator"] as const).map((r) => (
                <button key={r} type="button" role="radio" aria-checked={inv.role === r} className={inv.role === r ? "on" : ""} onClick={() => setInv({ ...inv, role: r })}>{ROLE[r]}</button>
              ))}
            </div>
          </div>
          <label className="field"><span className="lbl">Họ tên</span><input className="inp" value={inv.fullName} onChange={(e) => setInv({ ...inv, fullName: e.target.value })} /></label>
          <label className="field"><span className="lbl">Email</span><input className="inp" type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></label>
          {isModerator && <label className="field"><span className="lbl">Chuyên môn</span><input className="inp" value={inv.expertise} onChange={(e) => setInv({ ...inv, expertise: e.target.value })} placeholder="VD: Giáo viên tiểu học" /></label>}
          <label className="field"><span className="lbl">Ghi chú (không bắt buộc)</span><input className="inp" value={inv.note} onChange={(e) => setInv({ ...inv, note: e.target.value })} /></label>
          <button className="btn btn-p" disabled={busy || !canInvite}
            onClick={() => void run(() => staffService.invite({ role: inv.role, email: inv.email.trim(), fullName: inv.fullName.trim(), expertise: inv.expertise.trim(), note: inv.note.trim() }), `Đã gửi mã mời ${ROLE[inv.role]} tới ${inv.email.trim()}.`)
              .then((ok) => ok && setInv({ ...EMPTY_INVITE, role: inv.role }))}><Mail className="ic" />Gửi lời mời</button>
        </div>
      </div>

      <p className="notice">Backend chưa cung cấp API đăng ký và duyệt đơn Content Creator.</p>
      <div className="st-card st-scroll">
        <div className="row">
          <h3 className="grow">Moderator và Administrator</h3>
          <div className="seg" role="radiogroup" aria-label="Lọc theo vai trò" style={{ maxWidth: 360 }}>
            {ROLE_FILTERS.map((r) => (
              <button key={r.id} type="button" role="radio" aria-checked={filter === r.id} className={filter === r.id ? "on" : ""} onClick={() => setFilter(r.id)}>{r.label}</button>
            ))}
          </div>
        </div>
        <table className="st-table">
          <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Chuyên môn</th><th>Trạng thái</th><th>Kích hoạt / hạn mời</th><th /></tr></thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.userId}>
                <td>{s.fullName}{s.userId === me && <small className="sub"> (bạn)</small>}</td>
                <td>{s.email}</td>
                <td>{ROLE[s.role]}</td>
                <td>{s.expertise ?? "—"}</td>
                <td><Pill status={s.status} /></td>
                <td>{s.status === "invited" ? `Mời hết hạn ${fmtDay(s.createdAt)}` : fmtDay(s.createdAt)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {s.status === "invited" && <>
                    <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.resendInvite(s.userId), "Đã gửi lại mã mời (mã cũ hết hiệu lực).")}>Gửi lại lời mời</button>
                    <button className="btn btn-no" disabled={busy} onClick={async () => {
                      if (!(await confirmDialog(`Huỷ lời mời gửi ${s.email}? Mã mời hết hiệu lực và có thể mời lại cùng email.`))) return;
                      void run(() => staffService.cancelInvite(s.userId), "Đã huỷ lời mời.");
                    }}>Huỷ lời mời</button>
                  </>}
                  {s.status === "active" && s.userId !== me && <button className="btn btn-g" disabled={busy} onClick={() => {
                    const reason = prompt(`Lý do vô hiệu hoá ${s.fullName} (ít nhất 3 ký tự). Tài khoản bị đăng xuất khỏi mọi thiết bị; mục kiểm duyệt đang nhận trả về hàng đợi.`)?.trim();
                    if (reason) void run(() => staffService.deactivate(s.userId, reason), "Đã vô hiệu hoá.");
                  }}>Vô hiệu hoá</button>}
                  {s.status === "deactivated" && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.reactivate(s.userId), "Đã kích hoạt lại.")}>Kích hoạt lại</button>}
                </td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={7} className="sub">Chưa có tài khoản vận hành.</td></tr>}
          </tbody>
        </table>
      </div>
    </Page>
  );
}


/** Luồng 5 Bước 5.1e — quản lý tài khoản Parent ở mức tài khoản; không xem dữ liệu của trẻ (BR-5.1g). */
export function AdminParents(){return <UnavailableFeature title="Quản lý tài khoản phụ huynh"/>;}
