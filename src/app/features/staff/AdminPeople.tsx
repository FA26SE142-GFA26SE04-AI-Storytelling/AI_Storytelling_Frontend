"use client";
import UnavailableFeature from "./UnavailableFeature";

import { useCallback, useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { staffService } from "@/app/services/staffService";
import type { StaffAccount } from "@/app/types/staff";
import { Notice, Page, Pill, fmtDay, useAction } from "./ui";
import { AdminGrant } from "./AdminSystem";

const ROLE: Record<string, string> = { Administrator: "Administrator", Moderator: "Moderator", ContentCreator: "Content Creator" };

/** Luồng 5 Bước 5.1b, 5.1d — tài khoản vận hành: mời Administrator/Moderator, duyệt đơn Content Creator, vô hiệu hoá. */
export function AdminStaff() {
  const { user } = useAuth();
  const me = user?.id ?? -1;
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [inv, setInv] = useState({ email: "", fullName: "", expertise: "", note: "" });
  const load = useCallback(async () => {
    const s = await staffService.staff();
    setStaff(s.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);

  return (
    <Page title="Tài khoản vận hành" sub="Moderator được mời qua email: email chứa mã mời 72 giờ, dùng 1 lần; người được mời mở trang đăng nhập → “Kích hoạt tài khoản vận hành” để đặt mật khẩu, xác nhận cam kết, rồi thiết lập TOTP lần đăng nhập đầu. Administrator được cấp cho một email đã có tài khoản (mục cuối trang). Content Creator tự đăng ký, Administrator duyệt.">
      <Notice note={note} />
      <div className="st-card">
        <h3>Mời Moderator</h3>
        <div className="st-form">
          <label className="field"><span className="lbl">Họ tên</span><input className="inp" value={inv.fullName} onChange={(e) => setInv({ ...inv, fullName: e.target.value })} /></label>
          <label className="field"><span className="lbl">Email</span><input className="inp" type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></label>
          <label className="field"><span className="lbl">Chuyên môn</span><input className="inp" value={inv.expertise} onChange={(e) => setInv({ ...inv, expertise: e.target.value })} placeholder="VD: Giáo viên tiểu học" /></label>
          <label className="field"><span className="lbl">Ghi chú (không bắt buộc)</span><input className="inp" value={inv.note} onChange={(e) => setInv({ ...inv, note: e.target.value })} /></label>
          <button className="btn btn-p" disabled={busy || !/^\S+@\S+\.\S+$/.test(inv.email) || !inv.fullName.trim() || !inv.expertise.trim()}
            onClick={() => void run(() => staffService.inviteModerator(inv.email.trim(), inv.fullName.trim(), inv.expertise.trim(), inv.note.trim()), `Đã gửi mã mời tới ${inv.email.trim()}.`)
              .then((ok) => ok && setInv({ email: "", fullName: "", expertise: "", note: "" }))}><Mail className="ic" />Gửi lời mời</button>
        </div>
      </div>

      <p className="notice">Backend chưa cung cấp API đăng ký và duyệt đơn Content Creator.</p>
      <div className="st-card st-scroll">
        <h3>Moderator</h3>
        <p className="sub">Backend chưa có API liệt kê Administrator; quản lý Administrator ở mục cuối trang.</p>
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
                  {s.status === "invited" && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.resendInvite(s.userId), "Đã gửi lại mã mời (mã cũ hết hiệu lực).")}>Gửi lại lời mời</button>}
                  {s.status === "active" && s.userId !== me && <button className="btn btn-g" disabled={busy} onClick={() => {
                    const reason = prompt(`Lý do vô hiệu hoá ${s.fullName} (ít nhất 3 ký tự). Tài khoản bị đăng xuất khỏi mọi thiết bị; mục kiểm duyệt đang nhận trả về hàng đợi.`)?.trim();
                    if (reason) void run(() => staffService.deactivateModerator(s.userId, reason), "Đã vô hiệu hoá.");
                  }}>Vô hiệu hoá</button>}
                  {s.status === "deactivated" && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.reactivateModerator(s.userId), "Đã kích hoạt lại.")}>Kích hoạt lại</button>}
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


/** Luồng 5 Bước 5.1e — quản lý tài khoản Parent ở mức tài khoản; không xem dữ liệu của trẻ (BR-5.1g). */
export function AdminParents(){return <UnavailableFeature title="Quản lý tài khoản phụ huynh"/>;}
