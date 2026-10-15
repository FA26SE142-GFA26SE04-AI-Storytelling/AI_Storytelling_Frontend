"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { guardianService } from "@/app/services/guardianService";
import type { AppNotification } from "@/app/types/progress";
import { fmtDateTime } from "@/app/lib/guardian";

/** Luồng 1 Phụ lục A — tên hiển thị của các loại thông báo. */
const TEXT: Record<string, string> = {
  supervision_invite: "Bạn được mời cùng giám sát một bé",
  supervision_revoked: "Bạn đã bị gỡ khỏi hồ sơ một bé",
  permission_request: "Có yêu cầu cấp thêm quyền",
  permission_request_result: "Yêu cầu cấp quyền đã được xử lý",
  ownership_transfer_request: "Có đề nghị chuyển quyền quản lý chính",
  ownership_transfer_result: "Đề nghị chuyển quyền đã được xử lý",
  story_awaiting_approval: "Có truyện chờ bạn duyệt",
  story_wish_submitted: "Bé vừa gửi một điều ước",
  story_wish_expiring: "Điều ước của bé sắp hết hạn",
  story_moderation_result: "Truyện đã được kiểm duyệt an toàn",
  roadmap_story_added: "Có truyện mới trong lộ trình của con",
  roadmap_story_removed: "Một truyện đã được gỡ khỏi lộ trình",
  roadmap_completed: "Con đã đọc hết truyện trong lộ trình",
  hold_mode_alert: "Thư viện của bé tạm khoá vì gặp khó ở câu đố",
  hold_mode_unlocked: "Thư viện của bé đã mở lại",
  hold_mode_needs_attention: "Bé cần bạn hỗ trợ để mở khoá thư viện",
  progress_report_ready: "Báo cáo tuần đã sẵn sàng",
  content_reported: "Báo cáo nội dung đã được gửi",
  content_report_resolved: "Báo cáo nội dung đã được xử lý",
  community_library_reviewed: "Truyện nộp thư viện cộng đồng đã được duyệt",
  recommendation_awaiting_review: "Có đề xuất điều chỉnh học tập cho bé",
  account_security_changed: "Bảo mật tài khoản vừa thay đổi",
  payment_confirmed: "Thanh toán thành công",
};

export default function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await guardianService.notifications();
    if (r.success) setItems(r.data ?? []);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const unread = items.filter((n) => n.status !== "read" && !n.readAt).length;

  return (
    <div className="notif" ref={boxRef}>
      <button className="btn btn-g" aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ""}`} aria-expanded={open} onClick={() => { setOpen(!open); if (!open) void load(); }}>
        <Bell className="ic" />{unread > 0 && <span className="notif-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Thông báo">
          <div className="row"><b className="grow">Thông báo</b>{unread > 0 && <button className="btn btn-g" onClick={() => void guardianService.markAllNotificationsRead().then(load)}>Đọc hết</button>}</div>
          {items.length === 0 && <p className="sub">Chưa có thông báo.</p>}
          <ul>
            {items.slice(0, 30).map((n) => (
              <li key={`${n.id}-${n.createdAt}`} className={n.status !== "read" && !n.readAt ? "unread" : ""}>
                <button onClick={() => void guardianService.markNotificationRead(n).then(load)}>
                  <span>{TEXT[n.type] ?? n.type}</span><small>{fmtDateTime(n.createdAt)}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
