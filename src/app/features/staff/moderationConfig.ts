import type { QueueItem, QueueItemStatus, QueueItemType } from '@/app/types/staff';

export type PillTone = 'ok' | 'wait' | 'draft' | 'flag';

export type ModerationSectionDef = {
  status: QueueItemStatus;
  label: string;
  group: 'work' | 'waiting' | 'results';
  hint: string;
};

export const MODERATION_TYPE_LABELS: Record<QueueItemType, string> = {
  PublicStoryReview: 'Truyện công khai',
  CommunitySubmission: 'Truyện chia sẻ',
  GrayZoneStory: 'Vùng xám',
  ContentReport: 'Báo cáo nội dung',
  PublicStoryRemoval: 'Yêu cầu gỡ truyện',
  RoadmapTemplateReview: 'Lộ trình mẫu',
};

export const STATUS_LABELS_BY_TYPE: Record<QueueItemType, Partial<Record<QueueItemStatus, string>>> = {
  PublicStoryReview: {
    Pending: 'Chờ tiếp nhận',
    Claimed: 'Đang xử lý',
    ChangesRequested: 'Chờ Creator sửa',
    Approved: 'Đã duyệt',
    Rejected: 'Từ chối',
    Withdrawn: 'Đã rút',
    Closed: 'Đã đóng',
  },
  CommunitySubmission: {
    Pending: 'Chờ tiếp nhận',
    Claimed: 'Đang xử lý',
    Approved: 'Đã duyệt chia sẻ',
    Rejected: 'Từ chối chia sẻ',
    Withdrawn: 'Đã rút yêu cầu',
    Removed: 'Đã gỡ chia sẻ',
    Closed: 'Hồ sơ đã đóng',
  },
  GrayZoneStory: {
    Pending: 'Chờ tiếp nhận',
    Claimed: 'Đang kiểm tra',
    Cleared: 'Đã cho phép tiếp tục',
    Blocked: 'Đã chặn',
    Closed: 'Đã đóng',
  },
  ContentReport: {
    Pending: 'Chờ tiếp nhận',
    Claimed: 'Đang xử lý',
    Escalated: 'Đã chuyển Admin',
    Dismissed: 'Đã bác báo cáo',
    Archived: 'Đã xử lý gỡ vi phạm',
    Closed: 'Hồ sơ đã đóng',
  },
  PublicStoryRemoval: {
    Pending: 'Chờ tiếp nhận',
    Claimed: 'Đang xử lý',
    Approved: 'Đã chấp thuận gỡ',
    Rejected: 'Đã từ chối yêu cầu gỡ',
    Closed: 'Đã đóng',
  },
  RoadmapTemplateReview: {
    Pending: 'Chờ tiếp nhận',
    Claimed: 'Đang xử lý',
    ChangesRequested: 'Yêu cầu sửa',
    Approved: 'Đã duyệt',
    Rejected: 'Từ chối',
    Withdrawn: 'Đã rút',
    Closed: 'Đã đóng',
  },
};

const FALLBACK_STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ tiếp nhận',
  Claimed: 'Đang xử lý',
  Escalated: 'Chuyển lên Admin',
  Approved: 'Đã duyệt',
  ChangesRequested: 'Yêu cầu sửa',
  Rejected: 'Từ chối',
  Cleared: 'Cho phép tiếp tục',
  Blocked: 'Bị chặn',
  Dismissed: 'Bỏ qua',
  Archived: 'Đã lưu trữ',
  Withdrawn: 'Đã rút',
  Removed: 'Đã gỡ',
  Closed: 'Đã đóng',
};

export const PUBLIC_STORY_SECTIONS: ModerationSectionDef[] = [
  { status: 'Pending', label: 'Chờ tiếp nhận', group: 'work', hint: 'Hồ sơ Creator mới gửi, chưa có người nhận duyệt.' },
  { status: 'Claimed', label: 'Đang xử lý', group: 'work', hint: 'Hồ sơ đang được giữ xử lý (tối đa 2 giờ).' },
  { status: 'ChangesRequested', label: 'Chờ Creator sửa', group: 'waiting', hint: 'Đã gửi yêu cầu chỉnh sửa cho Creator; chỉ xem tóm tắt.' },
  { status: 'Approved', label: 'Đã duyệt', group: 'results', hint: 'Hồ sơ đã được duyệt công khai.' },
  { status: 'Rejected', label: 'Từ chối', group: 'results', hint: 'Hồ sơ đã bị từ chối.' },
  { status: 'Withdrawn', label: 'Đã rút', group: 'results', hint: 'Creator đã rút yêu cầu khi đang chờ.' },
  { status: 'Closed', label: 'Đã đóng', group: 'results', hint: 'Hồ sơ đã được hệ thống đóng.' },
];

export const GRAY_ZONE_SECTIONS: ModerationSectionDef[] = [
  { status: 'Pending', label: 'Chờ tiếp nhận', group: 'work', hint: 'Hồ sơ vùng xám mới vào hàng đợi, chưa có Moderator nhận kiểm tra.' },
  { status: 'Claimed', label: 'Đang kiểm tra', group: 'work', hint: 'Hồ sơ đang được giữ kiểm tra (tối đa 2 giờ). Hiển thị tất cả hồ sơ kèm người giữ.' },
  { status: 'Cleared', label: 'Đã cho phép tiếp tục', group: 'results', hint: 'Đã cho phép quy trình nguồn tiếp tục; quyết định này KHÔNG tự động xuất bản lên thư viện công khai.' },
  { status: 'Blocked', label: 'Đã chặn', group: 'results', hint: 'Nội dung vùng xám đã bị chặn theo quyết định kiểm duyệt.' },
  { status: 'Closed', label: 'Đã đóng', group: 'results', hint: 'Hồ sơ vùng xám đã đóng khi nguồn gốc thay đổi hoặc hết hiệu lực.' },
];

export const CONTENT_REPORT_SECTIONS: ModerationSectionDef[] = [
  { status: 'Pending', label: 'Chờ tiếp nhận', group: 'work', hint: 'Báo cáo nội dung mới, chưa có Moderator nhận xử lý.' },
  { status: 'Claimed', label: 'Đang xử lý', group: 'work', hint: 'Hồ sơ báo cáo đang được giữ xử lý. Chỉ người đang giữ mới mở được chi tiết.' },
  { status: 'Escalated', label: 'Đã chuyển Admin', group: 'waiting', hint: 'Dữ liệu cũ: ca đã chuyển lên Administrator trước đây; không còn tạo ca mới.' },
  { status: 'Dismissed', label: 'Đã bác báo cáo', group: 'results', hint: 'Báo cáo đã được bác, giữ nguyên nội dung.' },
  { status: 'Archived', label: 'Đã xử lý gỡ vi phạm', group: 'results', hint: 'Đã xử lý lưu trữ hoặc gỡ nội dung vi phạm từ báo cáo.' },
  { status: 'Closed', label: 'Hồ sơ đã đóng', group: 'results', hint: 'Hồ sơ báo cáo đã đóng.' },
];

export type RemovalRecordSourceDef = {
  id: 'removal-approved' | 'report-archived';
  itemType: Extract<QueueItemType, 'PublicStoryRemoval' | 'ContentReport'>;
  status: Extract<QueueItemStatus, 'Approved' | 'Archived'>;
  label: string;
  hint: string;
  summaryNotice: string;
};

export const REMOVAL_RECORD_SOURCES: RemovalRecordSourceDef[] = [
  {
    id: 'removal-approved',
    itemType: 'PublicStoryRemoval',
    status: 'Approved',
    label: 'Yêu cầu gỡ đã chấp thuận',
    hint: 'Danh sách độc lập các hồ sơ PublicStoryRemoval ở trạng thái Approved.',
    summaryNotice: 'Tóm tắt hồ sơ PublicStoryRemoval đã chấp thuận. API hàng đợi hiện chưa trả ngày quyết định, người quyết định hay lý do gỡ chi tiết.',
  },
  {
    id: 'report-archived',
    itemType: 'ContentReport',
    status: 'Archived',
    label: 'Vi phạm từ báo cáo',
    hint: 'Danh sách độc lập các hồ sơ ContentReport ở trạng thái Archived.',
    summaryNotice: 'Tóm tắt hồ sơ ContentReport đã xử lý gỡ vi phạm (Archived). Mỗi dòng phản ánh một hồ sơ xử lý độc lập, chưa khẳng định trạng thái công khai hiện tại.',
  },
];

export const PUBLIC_STORY_REMOVAL_SECTIONS: ModerationSectionDef[] = [
  { status: 'Pending', label: 'Chờ tiếp nhận', group: 'work', hint: 'Yêu cầu gỡ truyện công khai mới vào hàng đợi, chưa có Moderator nhận.' },
  { status: 'Claimed', label: 'Đang xử lý', group: 'work', hint: 'Hồ sơ đang được giữ xử lý. Chỉ người đang giữ mới mở được chi tiết hàng đợi.' },
  { status: 'Approved', label: 'Đã chấp thuận gỡ', group: 'results', hint: 'Đã chấp thuận gỡ truyện khỏi thư viện công khai (không phải duyệt đăng).' },
  { status: 'Rejected', label: 'Đã từ chối yêu cầu gỡ', group: 'results', hint: 'Đã từ chối yêu cầu gỡ (không phải từ chối xuất bản và không khẳng định truyện vẫn công khai).' },
  { status: 'Closed', label: 'Đã đóng', group: 'results', hint: 'Hồ sơ đã đóng theo trạng thái hệ thống nếu API trả về.' },
];

export const ROADMAP_REVIEW_SECTIONS: ModerationSectionDef[] = [
  { status: 'Pending', label: 'Chờ tiếp nhận', group: 'work', hint: 'Lộ trình mẫu mới gửi duyệt, chưa có Moderator nhận.' },
  { status: 'Claimed', label: 'Đang xử lý', group: 'work', hint: 'Hồ sơ đang được giữ duyệt (không tự duyệt bộ do mình tạo).' },
  { status: 'ChangesRequested', label: 'Yêu cầu sửa', group: 'waiting', hint: 'Đã gửi yêu cầu chỉnh sửa cho người soạn lộ trình; chỉ xem tóm tắt.' },
  { status: 'Approved', label: 'Đã duyệt', group: 'results', hint: 'Lộ trình mẫu đã được duyệt.' },
  { status: 'Rejected', label: 'Từ chối', group: 'results', hint: 'Hồ sơ duyệt lộ trình đã bị từ chối.' },
  { status: 'Withdrawn', label: 'Đã rút', group: 'results', hint: 'Người soạn đã rút yêu cầu duyệt khi đang chờ.' },
  { status: 'Closed', label: 'Đã đóng', group: 'results', hint: 'Hồ sơ duyệt lộ trình đã đóng theo hệ thống.' },
];

export const OPEN_MODERATION_STATUSES = ['Pending', 'Claimed', 'Escalated'] as const;

export function moderationTypeLabel(itemType: string): string {
  return MODERATION_TYPE_LABELS[itemType as QueueItemType] ?? itemType;
}

export function moderationStatusLabel(itemType: string, status: string): string {
  const byType = STATUS_LABELS_BY_TYPE[itemType as QueueItemType]?.[status as QueueItemStatus];
  return byType ?? FALLBACK_STATUS_LABELS[status] ?? status;
}

export function moderationStatusTone(status: string): PillTone {
  switch (status) {
    case 'Approved':
    case 'Cleared':
      return 'ok';
    case 'Pending':
    case 'Claimed':
    case 'Escalated':
    case 'ChangesRequested':
      return 'wait';
    case 'Rejected':
    case 'Blocked':
    case 'Removed':
    case 'Archived':
      return 'flag';
    default:
      return 'draft';
  }
}

export type ClaimBadge = {
  mine: boolean;
  label: string;
  tone: PillTone;
};

/** Nhãn phân biệt người giữ claim khi status === 'Claimed'; đọc trực tiếp từ claimedByUserId/claimedByName, không lọc danh sách. */
export function claimOwnershipBadge(
  item: Pick<QueueItem, 'status' | 'claimedByUserId' | 'claimedByName'>,
  currentUserId?: number | null,
): ClaimBadge | null {
  if (item.status !== 'Claimed') return null;
  if (currentUserId != null && item.claimedByUserId === currentUserId) {
    return { mine: true, label: 'Bạn đang giữ', tone: 'ok' };
  }
  const holder = item.claimedByName?.trim();
  return {
    mine: false,
    label: holder ? `Người khác đang giữ (${holder})` : 'Người khác đang giữ',
    tone: 'wait',
  };
}
