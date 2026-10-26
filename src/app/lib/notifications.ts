import type { WorkspaceId } from "@/app/components/shell/nav";
import type { AppNotification } from "@/app/types/progress";

/**
 * Luồng 1 Phụ lục A — thông báo trong app.
 * Chuẩn hóa tên loại thông báo từ backend:
 * mọi chỗ so sánh đều đi qua `notificationKey`.
 */
export const notificationKey = (type: string) => type.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

const TEXT: Record<string, string> = {
  supervision_invite: "Bạn được mời cùng giám sát một bé",
  supervision_invite_result: "Lời mời giám sát đã được trả lời",
  supervision_revoked: "Bạn đã bị gỡ khỏi hồ sơ một bé",
  permission_request: "Có yêu cầu cấp thêm quyền",
  permission_request_result: "Yêu cầu cấp quyền đã được xử lý",
  ownership_transfer_request: "Có đề nghị chuyển quyền quản lý chính",
  ownership_transfer_result: "Đề nghị chuyển quyền đã được xử lý",
  account_security_changed: "Bảo mật tài khoản vừa thay đổi",
  admin_role_changed: "Quyền quản trị của bạn vừa thay đổi",
  totp_reset: "Mã xác thực hai lớp đã được đặt lại",
  staff_invite: "Bạn được mời làm thành viên vận hành",
  story_awaiting_approval: "Có truyện chờ bạn duyệt",
  story_wish_submitted: "Bé vừa gửi một điều ước",
  story_wish_expiring: "Điều ước của bé sắp hết hạn",
  story_moderation_result: "Truyện đã được kiểm duyệt an toàn",
  content_moderation_result: "Nội dung đã được kiểm duyệt",
  story_archived_by_moderation: "Một truyện đã bị lưu trữ sau kiểm duyệt",
  story_shared: "Có truyện mới được chia sẻ với bạn",
  roadmap_story_added: "Có truyện mới trong lộ trình của con",
  roadmap_story_removed: "Một truyện đã được gỡ khỏi lộ trình",
  roadmap_completed: "Con đã đọc hết truyện trong lộ trình",
  assignment_cancelled: "Một bài đọc đã được huỷ",
  hold_mode_alert: "Thư viện của bé tạm khoá vì gặp khó ở câu đố",
  hold_mode_unlocked: "Thư viện của bé đã mở lại",
  hold_mode_needs_attention: "Bé cần bạn hỗ trợ để mở khoá thư viện",
  progress_report_ready: "Báo cáo tuần đã sẵn sàng",
  recommendation_awaiting_review: "Có đề xuất điều chỉnh học tập cho bé",
  content_reported: "Báo cáo nội dung đã được gửi",
  content_report_resolved: "Báo cáo nội dung đã được xử lý",
  content_report_escalated: "Một báo cáo nội dung được chuyển lên quản trị viên",
  community_library_reviewed: "Truyện nộp thư viện cộng đồng đã được duyệt",
  creator_content_flagged: "Nội dung bạn tạo vừa bị gắn cờ",
  moderation_sla_warning: "Có mục kiểm duyệt sắp quá hạn xử lý",
  data_request_sla_warning: "Có yêu cầu dữ liệu sắp quá hạn xử lý",
  data_request_completed: "Yêu cầu xuất / xoá dữ liệu đã xử lý xong",
  payment_confirmed: "Thanh toán thành công",
};

export const notificationText = (n: AppNotification) => TEXT[notificationKey(n.type)] ?? "Bạn có thông báo mới";

/** Backend dùng trạng thái `Unread` / `Read`. */
export const isUnread = (n: AppNotification) => !n.readAt && n.status.toLowerCase() !== "read";

/** Màn mở khi bấm vào thông báo (khu phụ huynh). Nhóm theo `NotificationGroups` và loại thông báo của backend. */
export function notificationTarget(n: AppNotification): WorkspaceId | null {
  const key = notificationKey(n.type);
  if (key.startsWith("roadmap_") || key.startsWith("hold_mode_") || key === "assignment_cancelled") return "roadmap";
  if (key === "story_awaiting_approval") return "review";
  if (key === "progress_report_ready" || key === "recommendation_awaiting_review" || key.startsWith("story_wish_")) return "home";
  switch (n.group) {
    case "supervisors":
    case "children": return "children";
    case "stories": return "library";
    case "account": return "account";
    default: return null;
  }
}
