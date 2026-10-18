import { describe, expect, it } from 'vitest';
import { createLocalReading, type ContentLoaders } from '@/app/services/readingLocal';
import { adaptiveLocal, type AdaptiveContext, type ApplyLevel } from '@/app/services/adaptiveLocal';
import type { ReadingPackage } from '@/app/types/reading';

const pack = (storyId: number): ReadingPackage => ({
  storyId, storyVersionId: storyId, title: `Truyện ${storyId}`, lesson: null,
  pages: [{ pageNumber: 1, text: 'Một trang.' }], vocabulary: [],
  quiz: [{ id: 1, type: 'multiple_choice', question: 'Hỏi?', choices: ['A', 'B'], acceptedAnswers: ['A'] }],
});
const loaders: ContentLoaders = {
  child: async () => ({ nickname: 'Na', ageBand: 'Age_6_8', readingLevel: 2, holdThreshold: 70, holdWindow: 3 }),
  library: async () => [1, 2, 3, 4, 5, 6].map((id) => ({ storyId: id, title: `Truyện ${id}`, genre: 'Động vật', lesson: null, coverImageUrl: null, source: 'own' as const, lengthCategory: null, readingLevel: 2, isChallenge: false, createdAt: '' })),
  pack: async (id) => pack(id),
};
const reading = createLocalReading(loaders);
const ctx = (patch: Partial<AdaptiveContext> = {}): AdaptiveContext => ({ readingLevel: 2, threshold: 70, favoriteTopics: [], blockedNames: [], allowedNames: [], ...patch });

async function readWell(childId: number, times = 5) {
  for (let id = 1; id <= times; id++) {
    const s = (await reading.startSession(childId, id, 'library')).data!;
    await reading.complete(childId, s.readingSessionId);
    await reading.submitQuiz(childId, s.readingSessionId, pack(id), [{ quizItemId: 1, answerGiven: 'A' }]);
  }
}

const applied: number[] = [];
const apply: ApplyLevel = async (level) => { applied.push(level); return { ok: true, message: '', previous: 2 }; };
const owner = { userId: 1, name: 'Mẹ', hasFinalAuthority: true };
const helper = { userId: 2, name: 'Bà', hasFinalAuthority: false };

describe('Luồng 6 — bộ máy cục bộ', () => {
  it('tạo đề xuất tăng mức đọc và gợi ý chủ đề sau 5 lần đọc tốt', async () => {
    await readWell(901);
    const recs = adaptiveLocal.refresh(901, ctx());
    expect(recs.map((r) => r.category).sort()).toEqual(['content_personalization', 'reading_difficulty']);
    expect(recs.every((r) => r.status === 'awaiting_review')).toBe(true);
    // Chạy lại không tạo trùng.
    expect(adaptiveLocal.refresh(901, ctx())).toHaveLength(2);
  });

  it('người không có quyền "Sửa mức đọc" chỉ góp ý; quyết định cuối đầu tiên áp dụng và khoá đề xuất', async () => {
    await readWell(902);
    const rec = adaptiveLocal.refresh(902, ctx()).find((r) => r.category === 'reading_difficulty')!;

    const comment = (await adaptiveLocal.review(902, rec.id, helper, { decision: 'accept' }, apply)).data!;
    expect(comment.outcome).toBe('comment');
    expect(comment.recommendation.status).toBe('awaiting_review');

    const done = (await adaptiveLocal.review(902, rec.id, owner, { decision: 'modify', modifiedValue: 4 }, apply)).data!;
    expect(done.outcome).toBe('applied');
    expect(done.recommendation.status).toBe('monitoring');
    expect(applied.at(-1)).toBe(4);
    expect(adaptiveLocal.versions(902)[0]).toMatchObject({ previousConfig: { readingLevel: 2 }, newConfig: { readingLevel: 4 }, source: 'recommendation', versionStatus: 'active_version' });

    const late = (await adaptiveLocal.review(902, rec.id, { ...owner, userId: 3, name: 'Bố' }, { decision: 'reject' }, apply)).data!;
    expect(late.outcome).toBe('comment');
    expect(late.message).toContain('Mẹ');
  });

  it('Sửa ngược hướng đề xuất bị từ chối', async () => {
    await readWell(903);
    const rec = adaptiveLocal.refresh(903, ctx()).find((r) => r.category === 'reading_difficulty')!;
    const r = await adaptiveLocal.review(903, rec.id, owner, { decision: 'modify', modifiedValue: 1 }, apply);
    expect(r.success).toBe(false);
  });

  it('Nhánh B: mọi người giám sát đều quyết định được; không gợi ý chủ đề bị chặn', async () => {
    await readWell(904);
    const rec = adaptiveLocal.refresh(904, ctx()).find((r) => r.category === 'content_personalization')!;
    const r = (await adaptiveLocal.review(904, rec.id, helper, { decision: 'accept' }, apply)).data!;
    expect(r.recommendation.status).toBe('applied');

    await readWell(905);
    expect(adaptiveLocal.refresh(905, ctx({ blockedNames: ['Động vật'] })).some((x) => x.category === 'content_personalization')).toBe(false);
  });

  it('đề xuất quá 14 ngày không có quyết định chuyển stale', async () => {
    await readWell(906);
    adaptiveLocal.refresh(906, ctx());
    const later = adaptiveLocal.refresh(906, ctx(), Date.now() + 15 * 86_400_000);
    expect(later.some((r) => r.status === 'stale')).toBe(true);
  });

  it('sửa mức đọc thủ công ghi lịch sử, bản trước chuyển superseded', () => {
    adaptiveLocal.recordVersion(907, 2, 3, 'manual', null, 'Mẹ');
    adaptiveLocal.recordVersion(907, 3, 2, 'manual', null, 'Mẹ');
    const v = adaptiveLocal.versions(907);
    expect(v.map((x) => x.versionStatus)).toEqual(['active_version', 'superseded']);
  });
});

describe('lịch sử hồ sơ học tập — chế độ đọc', () => {
  it('ghi cả lần chỉ đổi chế độ đọc, bỏ qua lần lưu không đổi gì', () => {
    adaptiveLocal.recordVersion(9301, { readingLevel: 2, readingMode: 'ListenFirst' }, { readingLevel: 2, readingMode: 'ListenFirst' }, 'manual', null, 'Mẹ');
    expect(adaptiveLocal.versions(9301)).toHaveLength(0);
    adaptiveLocal.recordVersion(9301, { readingLevel: 2, readingMode: 'ListenFirst' }, { readingLevel: 2, readingMode: 'ReadFirst' }, 'manual', null, 'Mẹ');
    expect(adaptiveLocal.versions(9301)[0]).toMatchObject({ previousConfig: { readingMode: 'ListenFirst' }, newConfig: { readingMode: 'ReadFirst' }, source: 'manual' });
  });
});
