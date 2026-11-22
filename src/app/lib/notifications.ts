import type { WorkspaceId } from "@/app/components/shell/nav";
import type { AppNotification } from "@/app/types/progress";

/**
 * Luồng 1 Phụ lục A — thông báo trong app.
 * Chuẩn hóa tên loại thông báo từ backend:
 * mọi chỗ so sánh đều đi qua `notificationKey`.
 */
export const notificationKey = (type: string) => type.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

/** Theo enum NotificationType của backend. Các loại giám sát cũ không còn được tạo mới nhưng giữ chữ để thông báo cũ vẫn đọc được. */
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
  staff_invite: "Bạn được mời làm thành viên vận hành",
  story_wish_submitted: "Bé vừa gửi một điều ước",
  story_wish_expiring: "Điều ước của bé sắp hết hạn",
  story_summary_sent: "Bé vừa gửi tóm tắt sau khi đọc truyện",
  story_moderation_result: "Truyện đã được kiểm duyệt an toàn",
  content_moderation_result: "Nội dung đã được kiểm duyệt",
  story_archived_by_moderation: "Một truyện đã bị lưu trữ sau kiểm duyệt",
  roadmap_story_added: "Có truyện mới trong lộ trình của con",
  roadmap_story_removed: "Một truyện đã được gỡ khỏi lộ trình",
  roadmap_completed: "Con đã đọc hết truyện trong lộ trình",
  content_reported: "Báo cáo nội dung đã được gửi",
  content_report_resolved: "Báo cáo nội dung đã được xử lý",
  content_report_escalated: "Một báo cáo nội dung được chuyển lên quản trị viên",
  community_library_reviewed: "Truyện nộp thư viện cộng đồng đã được duyệt",
  creator_content_flagged: "Nội dung bạn tạo vừa bị gắn cờ",
  moderation_sla_warning: "Có mục kiểm duyệt sắp quá hạn xử lý",
  payment_confirmed: "Thanh toán thành công, gói đã được áp",
  subscription_expiring: "Gói của bạn sắp hết hạn, hãy gia hạn để không gián đoạn",
  creator_application_approved: "Đơn nhà sáng tạo đã được duyệt",
  creator_application_rejected: "Đơn nhà sáng tạo bị từ chối",
  creator_tier_changed: "Cấp nhà sáng tạo của bạn vừa thay đổi",
  creator_payout_paid: "Bạn vừa được chi trả thu nhập",
  creator_payout_cancelled: "Một lần chi trả đã bị huỷ, số dư được cộng lại",
  story_credit_released: "Lượt AI giữ cho một truyện bỏ dở đã được trả lại",
  story_rating_published: "Truyện của bạn vừa có đánh giá mới từ phụ huynh",
  story_rating_moderated: "Đánh giá của bạn đã được kiểm duyệt",
};

const vnd = (value: unknown) => (typeof value === "number" ? `${value.toLocaleString("vi-VN")} đ` : "");
const quoted = (value: unknown) => (typeof value === "string" && value.trim() ? ` “${value.trim()}”` : "");

/** Câu chi tiết cho các thông báo có payload (Luồng 2, Luồng 5); trả null thì dùng câu chung. */
function detailedText(key: string, p: Record<string, unknown>): string | null {
  switch (key) {
    case "creator_tier_changed":
      if (p.tier === "Partner") return "Chúc mừng! Bạn đã lên nhà sáng tạo đối tác";
      if (p.reason === "revoked_by_admin") return "Quản trị viên đã thu hồi cấp nhà sáng tạo đối tác của bạn";
      if (p.reason === "story_removed_for_violation") return "Bạn mất cấp nhà sáng tạo đối tác vì có truyện bị gỡ do vi phạm";
      return "Bạn đã về cấp nhà sáng tạo thường vì chưa đạt tiêu chí đối tác 2 tháng liên tiếp";
    case "creator_payout_paid":
      return p.amountVnd != null ? `Bạn vừa được chi trả ${vnd(p.amountVnd)}` : null;
    case "creator_payout_cancelled":
      return p.amountVnd != null ? `Lần chi ${vnd(p.amountVnd)} đã bị huỷ, số dư được cộng lại` : null;
    case "story_credit_released":
      return `Đã trả lại ${typeof p.credits === "number" ? p.credits : 1} lượt AI của truyện${quoted(p.title)} vì bị bỏ dở; làm tiếp truyện sẽ giữ lại lượt`;
    case "story_rating_published":
      return typeof p.rating === "number" ? `Truyện của bạn vừa nhận đánh giá ${p.rating} sao từ phụ huynh` : null;
    case "story_rating_moderated":
      if (p.decision === "Hidden") return `Đánh giá của bạn đã bị ẩn${typeof p.reason === "string" && p.reason.trim() ? `. Lý do: ${p.reason.trim()}` : ""}`;
      return p.decision === "Approved" ? "Đánh giá của bạn đã được duyệt và đang hiển thị" : null;
    default:
      return null;
  }
}

export const notificationText = (n: AppNotification) => {
  if (notificationKey(n.type) === 'content_moderation_result' && n.payload) {
    try {
      const p = JSON.parse(n.payload);
      if (p?.itemType === 'PublicStoryRemoval') {
        const title = typeof p.storyTitle === 'string' && p.storyTitle.trim() ? ` “${p.storyTitle.trim()}”` : '';
        if (p.decision === 'approved') return `Yêu cầu gỡ truyện${title} đã được chấp thuận`;
        if (p.decision === 'rejected') return `Yêu cầu gỡ truyện${title} đã bị từ chối`;
      }
    } catch { /* Keep generic text for older or invalid payloads. */ }
  }
  const key = notificationKey(n.type);
  if (n.payload) {
    try {
      const p: unknown = JSON.parse(n.payload);
      if (p && typeof p === "object") {
        const text = detailedText(key, p as Record<string, unknown>);
        if (text) return text;
      }
    } catch { /* Payload cũ hoặc sai định dạng: dùng câu chung. */ }
  }
  return TEXT[key] ?? "Bạn có thông báo mới";
};

/** Backend dùng trạng thái `Unread` / `Read`. */
export const isUnread = (n: AppNotification) => !n.readAt && n.status.toLowerCase() !== "read";

/** Màn mở khi bấm vào thông báo (khu phụ huynh). Nhóm theo `NotificationGroups` và loại thông báo của backend. */
export function notificationTarget(n: AppNotification): WorkspaceId | null {
  const key = notificationKey(n.type);
  if (key.startsWith("roadmap_") || key === "story_summary_sent") return "roadmap";
  if (key.startsWith("story_wish_")) return "library";
  if (key === "payment_confirmed" || key === "subscription_expiring" || key === "story_credit_released") return "account-payment";
  switch (n.group) {
    case "supervisors":
    case "children": return "children";
    case "stories": return "library";
    case "account": return "account";
    default: return null;
  }
}
