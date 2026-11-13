import type { CreatorDraft } from '@/app/types/creator';

type State = Pick<CreatorDraft, 'reviewStatus' | 'isPublished' | 'openItemType' | 'openItemStatus'>;

/** Publication and media readiness are separate; never infer removal history from Ready. */
export function creatorPublicationState(s: State) {
  if (s.openItemType === 'PublicStoryRemoval' && ['Pending', 'Claimed'].includes(s.openItemStatus ?? '')) {
    return s.openItemStatus === 'Claimed'
      ? { kind: 'removal_claimed', label: 'Moderator đang xử lý yêu cầu gỡ', hint: 'Yêu cầu gỡ đã có người nhận xử lý. Bạn chưa thể chỉnh sửa hoặc gửi yêu cầu gỡ khác.' }
      : { kind: 'removal_pending', label: 'Đã yêu cầu gỡ — chờ tiếp nhận', hint: 'Yêu cầu gỡ đang chờ Moderator tiếp nhận. Truyện chưa được gỡ bởi yêu cầu này; hiện chưa hỗ trợ hủy yêu cầu gỡ.' };
  }
  if (s.isPublished) return { kind: 'published', label: 'Đã công khai', hint: 'Truyện đang công khai. Muốn chỉnh sửa, hãy gửi yêu cầu gỡ truyện.' };
  if (s.openItemType === 'PublicStoryReview' && s.openItemStatus === 'Claimed')
    return { kind: 'claimed', label: 'Moderator đang xử lý', hint: 'Moderator đã nhận duyệt phiên bản này. Bạn chưa thể rút yêu cầu hoặc sửa nội dung đang được duyệt.' };
  if (s.reviewStatus === 'Pending' || s.openItemType === 'PublicStoryReview' && s.openItemStatus === 'Pending')
    return { kind: 'pending', label: 'Chờ Moderator tiếp nhận', hint: 'Bạn có thể rút yêu cầu khi Moderator chưa nhận xử lý; nội dung và media đã xác nhận được giữ nguyên.' };
  if (s.reviewStatus === 'Approved' && s.isPublished === false)
    return { kind: 'revision', label: 'Đã duyệt, hiện chưa công khai', hint: 'Phiên bản này đã được duyệt nhưng hiện chưa công khai. Muốn chỉnh sửa hoặc gửi duyệt lại, hãy tạo bản chỉnh sửa mới. Media hoàn tất không mở lại quyền gửi của phiên bản cũ.' };
  return null;
}
