import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalReading, type ContentLoaders } from '@/app/services/readingLocal';
import { guardianLocal, type ChildRef } from '@/app/services/guardianLocal';
import type { ReadingPackage } from '@/app/types/reading';

const pack = (storyId: number): ReadingPackage => ({
  storyId, storyVersionId: storyId, title: `Truyện ${storyId}`, lesson: null,
  pages: [{ pageNumber: 1, text: 'Một trang.' }], vocabulary: [],
  quiz: [{ id: 1, type: 'multiple_choice', question: 'Hỏi?', choices: ['A', 'B'], acceptedAnswers: ['A'] }],
});
const loaders: ContentLoaders = {
  child: async () => ({ nickname: 'Na', ageBand: 'Age_6_8', readingLevel: 1, holdThreshold: 70, holdWindow: 3 }),
  library: async () => [1, 2, 3, 4].map((id) => ({ storyId: id, title: `Truyện ${id}`, genre: 'Động vật', lesson: null, coverImageUrl: null, source: 'own' as const, lengthCategory: null, readingLevel: 1, isChallenge: false, createdAt: '' })),
  pack: async (id) => pack(id),
};
const reading = createLocalReading(loaders);
const story = (id: number, ageBand = 'Age_6_8', length = 300) => ({ storyId: id, title: `Truyện ${id}`, ageBand, length });

let base = 500;
let kid: ChildRef;
const other = (): ChildRef => ({ id: base + 1000, nickname: 'Bin', status: 'Active', ageBand: 'Age_6_8', maxStoryLength: 200 });

async function readAndQuiz(childId: number, storyId: number, answer: string, retake = false) {
  const s = (await reading.startSession(childId, storyId, 'library', retake)).data!;
  await reading.complete(childId, s.readingSessionId);
  return reading.submitQuiz(childId, s.readingSessionId, pack(storyId), [{ quizItemId: 1, answerGiven: answer }]);
}

describe('Lộ trình của con', () => {
  beforeEach(() => { base += 10; kid = { id: base, nickname: 'Na', status: 'Active', ageBand: 'Age_6_8', maxStoryLength: 2000 }; });

  it('thêm cho nhiều con, bỏ qua bé không đạt và nêu lý do (BR-4.A1)', () => {
    const r = guardianLocal.addToRoadmap([kid, other(), { ...kid, id: base + 2000, nickname: 'Mít', status: 'Draft' }], story(1), 'end').data!;
    expect(r.added.map((a) => a.childProfileId)).toEqual([kid.id]);
    expect(r.skipped.map((s) => s.nickname)).toEqual(['Bin', 'Mít']);
  });

  it('truyện dành cho bé lớn hơn bị bỏ qua', () => {
    expect(guardianLocal.addToRoadmap([kid], story(1, 'Age_9_12'), 'end').data!.skipped).toHaveLength(1);
  });

  it('truyện đầu tiên mở ngay, truyện sau chờ; "Đọc tiếp theo" chen lên ngay sau truyện đang mở', () => {
    guardianLocal.addToRoadmap([kid], story(1), 'end');
    guardianLocal.addToRoadmap([kid], story(2), 'end');
    guardianLocal.addToRoadmap([kid], story(3), 'next');
    const items = guardianLocal.roadmap(kid.id).data!;
    expect(items.map((i) => [i.storyId, i.status])).toEqual([[1, 'open'], [3, 'queued'], [2, 'queued']]);
  });

  it('không thêm trùng; "Đọc tiếp theo" với truyện đã có thì chuyển lên (BR-4.R9)', () => {
    guardianLocal.addToRoadmap([kid], story(1), 'end');
    guardianLocal.addToRoadmap([kid], story(2), 'end');
    guardianLocal.addToRoadmap([kid], story(3), 'end');
    expect(guardianLocal.addToRoadmap([kid], story(3), 'end').data!.skipped[0].reason).toMatch(/đã có/);
    expect(guardianLocal.addToRoadmap([kid], story(3), 'next').data!.added[0].moved).toBe(true);
    expect(guardianLocal.roadmap(kid.id).data!.map((i) => i.storyId)).toEqual([1, 3, 2]);
  });

  it('bé đọc xong truyện đang mở thì truyện kế tự mở; gỡ truyện đang mở cũng vậy', async () => {
    guardianLocal.addToRoadmap([kid], story(1), 'end');
    guardianLocal.addToRoadmap([kid], story(2), 'end');
    guardianLocal.addToRoadmap([kid], story(3), 'end');
    await readAndQuiz(kid.id, 1, 'A');
    let items = guardianLocal.roadmap(kid.id).data!;
    expect(items.find((i) => i.storyId === 1)?.status).toBe('completed');
    expect(items.find((i) => i.storyId === 2)?.status).toBe('open');
    guardianLocal.removeFromRoadmap(kid.id, items.find((i) => i.storyId === 2)!.id);
    items = guardianLocal.roadmap(kid.id).data!;
    expect(items.find((i) => i.storyId === 3)?.status).toBe('open');
  });

  it('bé thấy lộ trình trên trang chính', async () => {
    guardianLocal.addToRoadmap([kid], story(1), 'end', { note: 'Mẹ thích truyện này' });
    const home = (await reading.getHome(kid.id)).data!;
    expect(home.roadmap).toMatchObject({ openStoryId: 1, note: 'Mẹ thích truyện này', done: 0, total: 1 });
  });
});

describe('Hold Mode', () => {
  beforeEach(() => { base += 10; kid = { id: base, nickname: 'Na', status: 'Active', ageBand: 'Age_6_8', maxStoryLength: 2000 }; });

  it('3 bài liên tiếp dưới 70% thì khoá; đọc lại đúng truyện đó đạt ngưỡng thì tự mở', async () => {
    await readAndQuiz(kid.id, 1, 'B');
    await readAndQuiz(kid.id, 2, 'B');
    expect(guardianLocal.holdCase(kid.id).data).toBeNull();
    await readAndQuiz(kid.id, 3, 'B');
    const hold = guardianLocal.holdCase(kid.id).data!;
    expect(hold).toMatchObject({ status: 'hold_mode', triggeringStoryId: 3 });
    expect((await reading.getHome(kid.id)).data!.holdMode).toMatchObject({ triggeringStoryId: 3, retakesLeft: 3 });

    await readAndQuiz(kid.id, 3, 'A', true);
    expect(guardianLocal.holdCase(kid.id).data).toMatchObject({ status: 'unlocked', resolutionType: 'auto_retake_pass' });
  });

  it('không mở truyện kế trong lộ trình khi đang Hold Mode; mở khoá thủ công thì mở tiếp', async () => {
    // Ba bài ngoài lộ trình dưới ngưỡng → khoá thư viện.
    await readAndQuiz(kid.id, 3, 'B');
    await readAndQuiz(kid.id, 4, 'B');
    await readAndQuiz(kid.id, 2, 'B');
    expect(guardianLocal.holdCase(kid.id).data?.status).toBe('hold_mode');
    guardianLocal.addToRoadmap([kid], story(1), 'end');
    guardianLocal.addToRoadmap([kid], story(2), 'end');
    // Đang Hold Mode: truyện đầu tiên chưa được mở.
    expect(guardianLocal.roadmap(kid.id).data!.every((i) => i.status === 'queued')).toBe(true);
    // Phiên bắt đầu trước khi khoá vẫn được tính xong (BR-4.R8), nhưng không mở truyện kế.
    await readAndQuiz(kid.id, 1, 'B');
    let items = guardianLocal.roadmap(kid.id).data!;
    expect(items.find((i) => i.storyId === 1)?.status).toBe('completed');
    expect(items.find((i) => i.storyId === 2)?.status).toBe('queued');
    expect(guardianLocal.unlockHold(kid.id, 'Đã đọc lại cùng con').success).toBe(true);
    items = guardianLocal.roadmap(kid.id).data!;
    expect(items.find((i) => i.storyId === 2)?.status).toBe('open');
    expect(guardianLocal.holdCase(kid.id).data).toMatchObject({ resolutionType: 'manual_unlock', skillGapNotes: 'Đã đọc lại cùng con' });
  });
});

describe('Dashboard và điều ước', () => {
  beforeEach(() => { base += 10; kid = { id: base, nickname: 'Na', status: 'Active', ageBand: 'Age_6_8', maxStoryLength: 2000 }; });

  it('dashboard tổng hợp lượt đọc, câu đố, thẻ "Con vừa đọc xong"', async () => {
    await readAndQuiz(kid.id, 1, 'A');
    const d = guardianLocal.dashboard(kid.id).data!;
    expect(d.storiesThisWeek).toBe(1);
    expect(d.quizTrend).toEqual([expect.objectContaining({ percent: 100 })]);
    expect(d.completions[0]).toMatchObject({ storyId: 1, quizCorrect: 1, quizTotal: 1, seen: false });
  });

  it('"Dùng truyện có sẵn" thêm truyện vào lộ trình ở vị trí đọc tiếp theo và đóng điều ước', async () => {
    const w = (await reading.submitWish(kid.id, { characterCardId: 5, placeCardId: 11, challengeCardId: null, lessonCardId: null })).data!;
    expect(guardianLocal.fulfillWishWithStory(kid, w.id, story(2)).success).toBe(true);
    expect(guardianLocal.wishes(kid.id).data![0]).toMatchObject({ status: 'fulfilled', fulfillmentType: 'existing_story', storyId: 2 });
    expect(guardianLocal.roadmap(kid.id).data![0]).toMatchObject({ storyId: 2, source: 'wish', note: 'Từ điều ước của em' });
  });
});
