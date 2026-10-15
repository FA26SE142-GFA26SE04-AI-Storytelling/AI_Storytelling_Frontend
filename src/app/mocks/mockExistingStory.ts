import type { ApiResponse } from '@/app/types/auth';
import type { ExistingStoryEvaluation, ImportStoryRequest, ImportStoryResponse, VersionMutationResponse } from '@/app/types/existingStory';
import { delay, fail, ok } from './config';
import { composeStory, db, persist, type MockStory } from './mockDb';
import { LEVEL_LENGTH } from '@/app/lib/storyRules';

/** Dữ liệu mẫu cho nhánh nhập truyện có sẵn — mô phỏng đánh giá Profile Fit của backend. */

const HARD = /giết|máu me|ma quỷ|kinh dị|ma túy|rượu/i;
const T_CONTENT = 1800;
const syllables = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const find = (id: number) => db().stories.find((s) => s.id === id) ?? null;
const levelOf = (childId: number) => db().learning[childId]?.readingLevel ?? 2;
const maxOf = (childId: number) => db().policies[childId]?.maxStoryLength ?? 2000;

function mutation(s: MockStory, decision: string | null): VersionMutationResponse {
  return { storyId: s.id, storyVersionId: s.reviewVersionId, storyStatus: s.pendingDecision ? 'Draft' : 'ContentReview', editType: 'manual_edit', decision };
}

/** Chuyển sang tạo học liệu → vài giây sau vào hàng chờ duyệt. */
function handOff(s: MockStory) {
  s.pendingDecision = false;
  s.outlineApprovedAt = Date.now() - T_CONTENT;
  const c = composeStory(s.title, s.characters, s.lesson || 'biết chia sẻ');
  s.vocabulary = c.vocabulary;
  s.quiz = c.quiz;
  s.discussion = c.discussion;
}

function evaluate(s: MockStory): ExistingStoryEvaluation {
  const words = syllables(s.content);
  const [, levelMax] = LEVEL_LENGTH[levelOf(s.childId)];
  const limit = Math.min(Math.round(levelMax * 1.15), maxOf(s.childId));
  const sentences = s.content.split(/[.!?…]+/).filter((x) => x.trim()).length || 1;
  const perSentence = words / sentences;
  const hard = HARD.test(s.content);
  const issues = [
    ...(words > limit ? [{ code: 'LENGTH_FAIL', message: `Truyện dài ${words} tiếng, vượt giới hạn ${limit} tiếng của bé.` }] : []),
    ...(perSentence > 18 ? [{ code: 'READABILITY', message: `Câu trung bình ${Math.round(perSentence)} tiếng, hơi dài so với mức đọc của bé.` }] : []),
  ];
  return {
    storyId: s.id, storyVersionId: s.reviewVersionId,
    decisionText: hard ? 'Blocked' : issues.length ? 'AdaptRecommended' : 'Suitable',
    hardSafetyIssues: hard ? [{ code: 'BLOCKED_CATEGORY', message: 'Truyện có nội dung thuộc chủ đề bị chặn của bé.' }] : [],
    profileFitIssues: issues,
    readabilityFkgl: null, readabilityFre: null, safetyScore: hard ? 0.2 : 0.95, wordCount: words,
    canKeepOriginal: !hard && !issues.some((i) => i.code === 'LENGTH_FAIL'),
  };
}

export const existingStoryMockOverrides = {
  async importStory(input: ImportStoryRequest): Promise<ApiResponse<ImportStoryResponse>> {
    await delay();
    const content = input.content.trim();
    if (content.length < 50) return fail('Truyện quá ngắn để nhập.');
    if (!/[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i.test(content)) return fail('Hiện nền tảng chỉ hỗ trợ truyện tiếng Việt.');
    const d = db();
    const id = d.nextStoryId++;
    const s: MockStory = {
      id, childId: input.childProfileId, requestId: id, topic: input.title || 'Truyện nhập sẵn', genre: 'Đời sống hằng ngày', lesson: '', characters: [],
      createdAt: new Date().toISOString(), acceptedAt: 1, blocked: false, outlineVersions: [], pendingRegenAt: null, outlineApprovedAt: null,
      reviewVersionId: id * 10 + 1, title: input.title?.trim() || content.split(/\s+/).slice(0, 6).join(' '), content,
      vocabulary: [], quiz: [], discussion: [], mediaStartedAt: null, archived: false, source: 'manual', pendingDecision: true, adaptCount: 0,
    };
    d.stories.unshift(s);
    persist();
    return ok({ storyId: id, storyVersionId: s.reviewVersionId, storyStatus: 'Draft', editType: 'uploaded_original', contentLength: content.length, inputStatus: 'accepted', reasonCode: null, fallbackMessage: null, canProceed: true, warnings: [] });
  },

  async evaluate(storyId: number): Promise<ApiResponse<ExistingStoryEvaluation>> {
    await delay(600);
    const s = find(storyId);
    return s ? ok(evaluate(s)) : fail('Không tìm thấy truyện.');
  },

  async adapt(storyId: number): Promise<ApiResponse<VersionMutationResponse>> {
    await delay(900);
    const s = find(storyId);
    if (!s) return fail('Không tìm thấy truyện.');
    if ((s.adaptCount ?? 0) >= 2) return fail('Truyện đã được AI chỉnh 2 lần. Bạn có thể sửa tay hoặc lưu trữ.');
    const [, levelMax] = LEVEL_LENGTH[levelOf(s.childId)];
    const words = s.content.split(/\s+/);
    // Mô phỏng AI rút gọn: giữ phần đầu vừa giới hạn, kết thúc trọn câu.
    const cut = words.slice(0, Math.min(words.length, levelMax)).join(' ');
    s.content = cut.replace(/[^.!?…]*$/, '').trim() || cut;
    s.reviewVersionId += 1;
    s.adaptCount = (s.adaptCount ?? 0) + 1;
    const e = evaluate(s);
    if (e.decisionText === 'Suitable') handOff(s);
    persist();
    return ok(mutation(s, e.decisionText));
  },

  async manualEdit(storyId: number, _base: number, title: string, content: string, lesson: string): Promise<ApiResponse<VersionMutationResponse>> {
    await delay();
    const s = find(storyId);
    if (!s) return fail('Không tìm thấy truyện.');
    Object.assign(s, { title: title.trim() || s.title, content: content.trim(), lesson: lesson.trim() });
    s.reviewVersionId += 1;
    const e = evaluate(s);
    if (e.decisionText === 'Suitable') handOff(s);
    persist();
    return ok(mutation(s, e.decisionText));
  },

  async keepOriginal(storyId: number, _version: number, reason: string): Promise<ApiResponse<VersionMutationResponse>> {
    await delay();
    const s = find(storyId);
    if (!s) return fail('Không tìm thấy truyện.');
    if (!reason.trim()) return fail('Cần ghi lý do giữ bản gốc.');
    if (!evaluate(s).canKeepOriginal) return fail('Truyện này không thể giữ nguyên bản gốc.');
    handOff(s);
    persist();
    return ok(mutation(s, 'Suitable'));
  },

  async archive(storyId: number): Promise<ApiResponse<boolean>> {
    await delay();
    const s = find(storyId);
    if (!s) return fail('Không tìm thấy truyện.');
    s.archived = true;
    persist();
    return ok(true);
  },
};
