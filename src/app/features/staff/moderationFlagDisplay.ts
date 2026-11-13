const KIND_LABELS: Record<string, string> = {
  section: 'Phần nội dung',
  paragraph: 'Đoạn văn',
  artifact: 'Học liệu',
  pii: 'Thông tin cá nhân',
  safety: 'Cảnh báo an toàn',
  rubric: 'Tiêu chí vùng xám',
  scene: 'Cảnh truyện',
  segment: 'Lời thoại',
};

const NAME_LABELS: Record<string, string> = {
  title: 'Tiêu đề truyện',
  opening: 'Mở đầu',
  development: 'Diễn biến',
  ending: 'Kết thúc',
  lesson: 'Bài học',
  content: 'Nội dung truyện',
  description: 'Mô tả truyện',
  starting_point: 'Điểm xuất phát',
  events: 'Sự kiện',
  emotion: 'Cảm xúc',
  dialogue: 'Lời thoại',
  transition: 'Chuyển cảnh',
  quiz: 'Câu hỏi trắc nghiệm',
  quizzes: 'Câu hỏi trắc nghiệm',
  vocabulary: 'Thẻ từ vựng',
  flashcard: 'Thẻ từ vựng',
  flashcards: 'Thẻ từ vựng',
  discussion: 'Câu hỏi thảo luận',
  discussionquestions: 'Câu hỏi thảo luận',
  discussion_questions: 'Câu hỏi thảo luận',
  scene: 'Cảnh truyện',
  scenes: 'Cảnh truyện',
  image: 'Tranh minh họa',
  images: 'Tranh minh họa',
  audio: 'Âm thanh',
  audios: 'Âm thanh',
};

const CRITERION_LABELS: Record<string, string> = {
  gz01: 'GZ01 · Nội dung gây hại',
  gz02: 'GZ02 · Hành vi nguy hiểm dễ bắt chước',
  gz03: 'GZ03 · Phù hợp độ tuổi',
  gz04: 'GZ04 · Thông điệp / dẫn dắt lệch chuẩn',
  gz05: 'GZ05 · Quyền riêng tư & dữ liệu cá nhân',
  pii: 'Thông tin cá nhân (PII)',
  blocked_topic: 'Chủ đề bị chặn',
  safety: 'Tiêu chí an toàn',
};

const REASON_LABELS: Record<string, string> = {
  age_band_review: 'Cần rà soát mức độ phù hợp với nhóm tuổi mục tiêu.',
  safety_review: 'Cần rà soát mức độ an toàn của nội dung.',
  'hard rule matched': 'Khớp quy tắc chặn cứng của hệ thống (từ khóa bị chặn hoặc thông tin cá nhân).',
  blocked_category: 'Nội dung liên quan đến chủ đề bị chặn.',
  age_band_mismatch: 'Chưa phù hợp với nhóm tuổi đã chọn.',
  inappropriate: 'Nội dung chưa phù hợp.',
  wrong_age_band: 'Chưa phù hợp với lứa tuổi.',
};

const INDEXED_PREFIXES: Array<[RegExp, string]> = [
  [/^paragraph:(\d+)$/i, 'Đoạn'],
  [/^scene:(\d+)$/i, 'Cảnh'],
  [/^segment:(\d+)$/i, 'Lời thoại'],
];

/** Chuyển mã loại cờ backend (ví dụ `section`, `paragraph`) thành nhãn tiếng Việt. */
export function formatFlagKind(kind?: string | null): string | null {
  const raw = (kind ?? '').trim();
  if (!raw) return null;
  return KIND_LABELS[raw.toLowerCase()] ?? raw;
}

/** Chuyển định danh vùng nội dung (ví dụ `development`, `paragraph:0`) thành tên tiếng Việt dễ hiểu. */
export function formatFlagName(name?: string | null, kind?: string | null): string {
  const raw = (name ?? '').trim();
  if (!raw) return formatFlagKind(kind) ?? 'Cờ cần xem xét';
  const exact = NAME_LABELS[raw.toLowerCase()];
  if (exact) return exact;
  for (const [pattern, label] of INDEXED_PREFIXES) {
    const match = raw.match(pattern);
    if (match) return `${label} ${Number(match[1]) + 1}`;
  }
  return raw;
}

/** Chuyển mã tiêu chí kiểm duyệt (GZ01–GZ05, `pii`, `blocked_topic`) thành mô tả tiếng Việt. */
export function formatFlagCriterion(code?: string | null): string | null {
  const raw = (code ?? '').trim();
  if (!raw) return null;
  return CRITERION_LABELS[raw.toLowerCase()] ?? raw;
}

/** Chuyển mã lý do hệ thống (ví dụ `age_band_review`, `Hard rule matched`) thành câu tiếng Việt rõ nghĩa. */
export function formatFlagReason(reason?: string | null): string {
  const raw = (reason ?? '').trim();
  if (!raw) return 'Cần kiểm duyệt viên xem xét trực tiếp phần nội dung này.';
  return REASON_LABELS[raw.toLowerCase()] ?? raw;
}
