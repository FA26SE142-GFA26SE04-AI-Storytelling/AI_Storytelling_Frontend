/** Mã lỗi/cảnh báo của bước kiểm tra tự động đổi sang câu tiếng Việt nói rõ lỗi gì và cần làm gì. Mã lạ giữ nguyên. */
const ISSUE_VI: Record<string, string> = {
  SAFETY_MODERATION_REQUIRED: 'Truyện đang chờ kiểm duyệt an toàn. Đợi kiểm duyệt viên xử lý xong rồi kiểm tra lại.',
  CHILD_CONTEXT_SETUP_REQUIRED: 'Ngôn ngữ hoặc độ tuổi của truyện không khớp hồ sơ bé. Hãy cập nhật hồ sơ bé hoặc thiết lập lại truyện.',
  TITLE_REQUIRED: 'Truyện chưa có tiêu đề. Hãy nhập tiêu đề rồi lưu.',
  CONTENT_REQUIRED: 'Truyện chưa có nội dung. Hãy viết nội dung rồi lưu.',
  SAFETY_POLICY_REQUIRED: 'Bé chưa có chính sách an toàn. Hãy thiết lập chính sách cho bé trước.',
  STORY_LENGTH_POLICY_INVALID: 'Giới hạn độ dài truyện trong chính sách của bé chưa hợp lệ. Hãy kiểm tra lại chính sách.',
  STORY_TOO_LONG: 'Truyện dài hơn giới hạn cho phép của bé. Hãy rút gọn nội dung.',
  SEMANTIC_SAFETY_REVIEW_REQUIRED: 'Chính sách của bé yêu cầu điểm an toàn theo ý nghĩa, nhưng bước kiểm tra tự động chưa chấm được. Hãy tự đọc kỹ truyện hoặc bỏ yêu cầu điểm an toàn trong chính sách.',
  READABILITY_POLICY_INVALID: 'Ngưỡng độ dễ đọc trong chính sách của bé chưa hợp lệ. Hãy kiểm tra lại chính sách.',
  READABILITY_POLICY_NOT_MET: 'Truyện chưa đủ dễ đọc theo mức đọc của bé. Hãy dùng câu ngắn và từ đơn giản hơn.',
  UNFILLED_PLACEHOLDER: 'Còn chỗ trống chưa điền (dấu ___ hoặc {{ }}). Hãy điền hoặc xoá.',
  // Kiểm tra gói từng bé (AI chấm an toàn theo cài đặt chủ đề của bé, rồi kiểm duyệt tự động).
  CONTENT_SAFETY_NOT_PASSED: 'Truyện chưa phù hợp với cài đặt an toàn của bé.',
  MODERATION_HARD_BLOCK: 'Truyện có nội dung không an toàn cho trẻ nên bị chặn. Hãy sửa nội dung.',
  GRAY_ZONE_REVIEW_REQUIRED: 'Truyện có chỗ cần kiểm duyệt viên xem lại. Đợi kiểm duyệt xong rồi tiếp tục.',
  LANGUAGE_CONTEXT_MISMATCH: 'Ngôn ngữ của truyện khác ngôn ngữ trong hồ sơ của bé.',
  INTERACTIVE_STORIES_DISABLED: 'Bé đang tắt truyện tương tác. Bỏ chọn "Tương tác khi nghe" hoặc bật lại trong cài đặt của bé.',
};
/** Tên chủ đề vi phạm (bỏ mã viết hoa như FANTASY, giữ tên hiển thị như "Cổ tích - Kỳ ảo"). */
export const topicNames = (violations?: string[] | null) => [...new Set((violations ?? []).filter((v) => !/^[A-Z0-9_]+$/.test(v)))];
export function issueText(code: string) {
  const [key, detail] = code.split(':');
  if (key === 'BLOCKED_CATEGORY') return `Nội dung chứa chủ đề bị chặn${detail ? ` (${detail})` : ''}. Hãy sửa hoặc bỏ phần đó.`;
  if (key === 'POLICY_REVIEW_REQUIRED') return `Nội dung có chủ đề cần bạn xem xét${detail ? ` (${detail})` : ''}. Hãy đọc lại kỹ trước khi tiếp tục.`;
  return ISSUE_VI[key] ?? code;
}
