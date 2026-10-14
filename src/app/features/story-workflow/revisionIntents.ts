import type { AIProposalDto } from '@/app/types/aiStory';
import { FREE_TEXT_MAX } from './aiStoryInputFlowUtils';

/**
 * Chỉnh sửa theo chủ đích (Luồng 2 mục 5.8): người dùng chọn mục đích cố định thay vì gõ yêu cầu tự do.
 * Mỗi mục đích được đổi thành chỉ dẫn gửi kèm đoạn văn đã chọn tới API partial-edit.
 */
export type RevisionIntent =
  | 'simplify' | 'shorten' | 'lengthen' | 'more_dialogue' | 'less_scary'
  | 'emphasize_lesson' | 'age_fit' | 'change_ending' | 'custom';

export interface RevisionIntentOption {
  id: RevisionIntent;
  label: string;
  hint: string;
  instruction: string;
}

const KEEP = 'Giữ nguyên nhân vật chính, diễn biến chính và bài học; viết bằng tiếng Việt chuẩn, phù hợp trẻ em.';

export const REVISION_INTENTS: RevisionIntentOption[] = [
  { id: 'simplify', label: 'Đơn giản hơn', hint: 'Câu ngắn hơn, ít từ khó', instruction: `Viết lại cho đơn giản hơn: câu ngắn hơn, ít từ khó hơn. ${KEEP}` },
  { id: 'shorten', label: 'Ngắn hơn', hint: 'Bớt khoảng 30% số từ', instruction: `Rút ngắn khoảng 30% số từ nhưng giữ đủ các sự kiện chính. ${KEEP}` },
  { id: 'lengthen', label: 'Dài hơn', hint: 'Thêm chi tiết miêu tả', instruction: `Thêm chi tiết miêu tả sinh động, không thêm sự kiện mới. ${KEEP}` },
  { id: 'more_dialogue', label: 'Thêm hội thoại', hint: 'Chuyển lời kể thành lời thoại', instruction: `Chuyển một phần lời kể thành lời thoại ngắn giữa các nhân vật. ${KEEP}` },
  { id: 'less_scary', label: 'Bớt đáng sợ', hint: 'Giảm căng thẳng, yếu tố gây sợ', instruction: `Giảm căng thẳng, xung đột và các chi tiết có thể làm bé sợ. ${KEEP}` },
  { id: 'emphasize_lesson', label: 'Nhấn mạnh bài học', hint: 'Làm rõ bài học', instruction: `Làm rõ và nhấn mạnh bài học một cách nhẹ nhàng, tự nhiên. ${KEEP}` },
  { id: 'age_fit', label: 'Hợp tuổi hơn', hint: 'Theo độ tuổi và mức đọc của bé', instruction: `Viết lại cho phù hợp độ tuổi và mức đọc của bé: bỏ chi tiết, khái niệm vượt tuổi; chỉnh từ ngữ và độ dài câu. ${KEEP}` },
  { id: 'change_ending', label: 'Đổi kết thúc', hint: 'Kết thúc khác, vẫn tích cực', instruction: 'Viết lại đoạn kết theo hướng khác nhưng vẫn tích cực và giữ bài học. Giữ nguyên nhân vật chính; viết bằng tiếng Việt chuẩn, phù hợp trẻ em.' },
  { id: 'custom', label: 'Khác…', hint: 'Tự ghi yêu cầu ngắn', instruction: '' },
];

/** Chỉ dẫn gửi cho AI; null nếu mục đích "Khác" chưa có ghi chú hợp lệ. */
export function buildRevisionInstruction(intent: RevisionIntent, note = ''): string | null {
  const option = REVISION_INTENTS.find((o) => o.id === intent);
  if (!option) return null;
  const trimmed = note.trim().slice(0, FREE_TEXT_MAX);
  if (intent === 'custom') return trimmed ? `${trimmed}. ${KEEP}` : null;
  return trimmed ? `${option.instruction} Ghi chú thêm: ${trimmed}` : option.instruction;
}

export interface StoryProposalView {
  selectedText: string;
  suggestedText: string;
}

const record = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null);

/** Đề xuất sửa truyện: original = { content, start, endExclusive, selectedText }, suggested = { content }. */
export function storyProposalView(proposal: AIProposalDto): StoryProposalView | null {
  const original = record(proposal.originalContent);
  const suggested = record(proposal.suggestedContent);
  if (proposal.artifactType !== 'story' || !suggested || typeof suggested.content !== 'string') return null;
  const selectedText = typeof original?.selectedText === 'string' ? original.selectedText : typeof original?.content === 'string' ? original.content : '';
  return { selectedText, suggestedText: suggested.content };
}

/** Đề xuất sinh lại học liệu: suggested = { items }, original = { items } hoặc {} khi backend không gửi bản cũ. */
export function artifactProposalItems<T>(proposal: AIProposalDto): { before: T[] | null; after: T[] } {
  const items = (v: unknown): T[] | null => {
    const list = record(v)?.items;
    return Array.isArray(list) ? (list as T[]) : null;
  };
  return { before: items(proposal.originalContent), after: items(proposal.suggestedContent) ?? [] };
}
