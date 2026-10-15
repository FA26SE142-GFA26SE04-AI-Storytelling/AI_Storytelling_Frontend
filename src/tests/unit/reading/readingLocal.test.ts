import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalReading, type ContentLoaders } from '@/app/services/readingLocal';
import type { ReadingPackage } from '@/app/types/reading';

const pack: ReadingPackage = {
  storyId: 7, storyVersionId: 70, title: 'Chú ếch và đầm sen', lesson: 'Biết chia sẻ',
  pages: [{ pageNumber: 1, text: 'Trang một.' }, { pageNumber: 2, text: 'Trang hai.' }],
  vocabulary: [{ id: 1, term: 'đầm sen', definition: 'Ao có nhiều hoa sen' }],
  quiz: [
    { id: 1, type: 'multiple_choice', question: 'Ai là nhân vật chính?', choices: ['Ếch', 'Mèo'], acceptedAnswers: ['Ếch'] },
    { id: 2, type: 'true_false', question: 'Ếch sống ở đầm sen?', choices: ['Đúng', 'Sai'], acceptedAnswers: ['Đúng'] },
  ],
};
const loaders: ContentLoaders = {
  child: async () => ({ nickname: 'Na', ageBand: 'Age_6_8', readingLevel: 1 }),
  library: async () => [{ storyId: 7, title: 'Chú ếch và đầm sen', genre: 'Động vật', lesson: null, coverImageUrl: null, source: 'own', lengthCategory: 'short', readingLevel: 1, isChallenge: false, createdAt: '' }],
  pack: async () => pack,
};

let childId = 100;
describe('bộ máy đọc cục bộ', () => {
  const r = createLocalReading(loaders);
  beforeEach(() => { childId += 1; });

  it('đọc xong lần đầu +10 EXP; đọc lại không nhận lại EXP hoàn thành', async () => {
    const s1 = (await r.startSession(childId, 7, 'library')).data!;
    expect((await r.complete(childId, s1.readingSessionId)).data?.expGained).toBe(10);
    const s2 = (await r.startSession(childId, 7, 'library')).data!;
    expect((await r.complete(childId, s2.readingSessionId)).data?.expGained).toBe(0);
  });

  it('câu đúng lần đầu +2 EXP, trả lời đúng lại câu cũ không cộng thêm', async () => {
    const s1 = (await r.startSession(childId, 7, 'library')).data!;
    const q1 = await r.submitQuiz(childId, s1.readingSessionId, pack, [{ quizItemId: 1, answerGiven: 'Ếch' }, { quizItemId: 2, answerGiven: 'Sai' }]);
    expect(q1.data).toMatchObject({ correct: 1, total: 2, expGained: 2 });
    const s2 = (await r.startSession(childId, 7, 'library')).data!;
    const q2 = await r.submitQuiz(childId, s2.readingSessionId, pack, [{ quizItemId: 1, answerGiven: 'Ếch' }, { quizItemId: 2, answerGiven: 'Đúng' }]);
    expect(q2.data?.expGained).toBe(2);
  });

  it('phiên đọc lại để mở khoá (Hold Mode) không cộng EXP', async () => {
    const s = (await r.startSession(childId, 7, 'library', true)).data!;
    expect((await r.complete(childId, s.readingSessionId)).data?.expGained).toBe(0);
    expect((await r.submitQuiz(childId, s.readingSessionId, pack, [{ quizItemId: 1, answerGiven: 'Ếch' }])).data?.expGained).toBe(0);
  });

  it('lưu từ vào sổ tay +1 EXP, lưu trùng không cộng', async () => {
    expect((await r.collectWord(childId, 7, pack.vocabulary[0])).data?.expGained).toBe(1);
    expect((await r.collectWord(childId, 7, pack.vocabulary[0])).data?.expGained).toBe(0);
    expect((await r.notebook(childId)).data).toHaveLength(1);
  });

  it('đầu tư EXP vào cây không làm giảm tổng EXP', async () => {
    const s = (await r.startSession(childId, 7, 'library')).data!;
    await r.complete(childId, s.readingSessionId);
    const a = (await r.invest(childId)).data!;
    expect(a).toMatchObject({ expTotal: 10, knowledgeTreeExp: 10, pendingExp: 0 });
  });

  it('nhớ trang đọc dở khi thoát giữa chừng', async () => {
    const s = (await r.startSession(childId, 7, 'library')).data!;
    await r.exit(childId, s.readingSessionId, 2);
    const again = (await r.startSession(childId, 7, 'continue_reading')).data!;
    expect(again.progress.lastPageRead).toBe(2);
  });

  it('điều ước: 1 điều ước mỗi ngày, có gợi ý truyện khớp nhân vật', async () => {
    const w = await r.submitWish(childId, { characterCardId: 2, placeCardId: 15, challengeCardId: null, lessonCardId: null });
    expect(w.success).toBe(true);
    expect(w.data?.suggestions.map((s) => s.storyId)).toEqual([7]);
    const again = await r.submitWish(childId, { characterCardId: 1, placeCardId: 11, challengeCardId: null, lessonCardId: null });
    expect(again.success).toBe(false);
  });
});
