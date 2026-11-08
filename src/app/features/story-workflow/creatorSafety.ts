import type { CreatorSafetyCheckDto } from '@/app/types/backendContracts';

export function canSubmitWithSafety(check: CreatorSafetyCheckDto | undefined) {
  return !!check && check.zone !== 'HardBlock' && (!check.required || (check.state === 'Current' && ['Safe', 'GrayZone'].includes(check.zone ?? '')));
}

export function creatorSafetyMessage(check: CreatorSafetyCheckDto | undefined) {
  if (!check) return 'Chưa nhận được trạng thái kiểm tra an toàn. Hãy tải lại trạng thái.';
  if (!check.required && check.zone === 'HardBlock') return 'Bản này có kết quả bị chặn. Cần sửa nội dung trước khi gửi duyệt; kiểm tra AI hiện chưa được bật.';
  if (check.state === 'Unavailable') return check.required
    ? 'Chưa xác định được kết quả kiểm tra an toàn. Hãy tải lại trạng thái hoặc thử lại.'
    : 'Kiểm tra an toàn bằng AI chưa được bật trong cấu hình hiện tại.';
  if (check.state === 'NotChecked') return 'Bản này chưa có kết quả kiểm tra an toàn. Hãy kiểm tra trước khi gửi duyệt.';
  if (check.state === 'Stale') return 'Nội dung, ngữ cảnh hoặc tiêu chí kiểm duyệt đã thay đổi. Cần kiểm tra lại.';
  if (check.zone === 'Safe') return 'Đạt kiểm tra an toàn tự động. Moderator vẫn cần duyệt trước khi xuất bản công khai.';
  if (check.zone === 'GrayZone') return 'Có điểm cần Moderator xem xét khi duyệt xuất bản. Bạn vẫn có thể hoàn thiện và gửi duyệt.';
  if (check.zone === 'HardBlock') return 'Nội dung bị chặn. Hãy sửa nội dung, lưu phiên bản mới rồi kiểm tra lại trước khi gửi duyệt.';
  return 'Chưa xác định được kết quả kiểm tra an toàn. Hãy tải lại trạng thái.';
}
