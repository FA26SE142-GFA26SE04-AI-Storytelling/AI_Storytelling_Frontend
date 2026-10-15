import type { ApiResponse } from '@/app/types/auth';
import type {
  Achievements, CompleteResult, KidHome, LibraryStory, QuizAnswerInput, QuizResult, Reaction, ReadingPackage, ReadingProgress,
  StartSessionResult, StoryWish, SubmitWishInput, WishCard, OpenedFrom,
} from '@/app/types/reading';
import type { ReadCompletion, RoadmapItem } from '@/app/types/progress';
import { pushNotification } from './notificationLocal';
import { EXP, earnedBadges, isAnswerCorrect, nextStreak, readingModeFor, vnDate } from '@/app/lib/readingRules';

/**
 * Bộ máy đọc cục bộ: thực hiện quy tắc Luồng 3 ngay trên trình duyệt (sessionStorage).
 * Dùng cho chế độ dữ liệu mẫu, và làm dự phòng khi backend chưa có API đọc.
 * Dữ liệu ở đây KHÔNG tới được Luồng 4/6 — chỉ backend mới lưu thật.
 */

export type ChildInfo = {
  nickname: string;
  ageBand: string;
  readingLevel: number;
  /** Ngưỡng Hold Mode trong SafetyPolicy (mặc định 70% / 3 bài). */
  holdThreshold?: number;
  holdWindow?: number;
};

export type ContentLoaders = {
  child: (childId: number) => Promise<ChildInfo | null>;
  library: (childId: number) => Promise<LibraryStory[]>;
  pack: (storyId: number) => Promise<ReadingPackage | null>;
};

type NotebookEntry = { storyVocabularyId: number; term: string; definition: string; storyId: number; collectedAt: string };
type LocalSession = { storyId: number; title: string; genre: string | null; isRetake: boolean; challenge: boolean; completed: boolean; quizDone: boolean; startedAt: number; completionId?: number };
type QuizLog = { storyId: number; title: string; percent: number; at: string; isRetake: boolean; challenge: boolean };
type ReadLog = { storyId: number; title: string; genre: string | null; at: string; minutes: number; fromSupervisor: boolean };
/** Ca Hold Mode (intervention_cases) — Luồng 4 Bước 4.5. */
export type HoldRecord = {
  id: number; status: 'hold_mode' | 'unlocked'; heldAt: string; triggeringStoryId: number | null; triggeringStoryTitle: string | null;
  retakes: string[]; resolutionType: 'auto_retake_pass' | 'manual_unlock' | null; resolvedAt: string | null; skillGapNotes: string | null;
};
export type State = {
  nextId: number;
  progress: Record<number, ReadingProgress>;
  achievements: Achievements;
  notebook: NotebookEntry[];
  sessions: Record<number, LocalSession>;
  correctEver: Record<number, number[]>;
  completedStories: number[];
  wishes: StoryWish[];
  reactions: Record<number, Reaction>;
  // Luồng 4
  roadmap: RoadmapItem[];
  quizLog: QuizLog[];
  readLog: ReadLog[];
  completions: ReadCompletion[];
  holds: HoldRecord[];
};

const KEY = (childId: number) => `taletale-reading:v2:${childId}`;
const fresh = (): State => ({
  nextId: 1, progress: {}, notebook: [], sessions: {}, correctEver: {}, completedStories: [], wishes: [], reactions: {},
  achievements: { expTotal: 0, knowledgeTreeExp: 0, pendingExp: 0, streakDays: 0, lastStreakDate: null, activitiesCompleted: 0, badges: [] },
  roadmap: [], quizLog: [], readLog: [], completions: [], holds: [],
});
const memory = new Map<number, State>();
export function loadChild(childId: number): State { return load(childId); }
export function saveChild(childId: number) { save(childId); }
export const activeHold = (s: State) => s.holds.find((h) => h.status === 'hold_mode') ?? null;
const DAY = 86_400_000;
export const retakesLast24h = (h: HoldRecord) => h.retakes.filter((t) => Date.now() - Date.parse(t) < DAY).length;

/**
 * Luồng 4 Bước 4.1d — mở truyện kế: mỗi lúc tối đa 1 truyện đang mở; đang Hold Mode thì dừng chờ mở khoá.
 */
export function advanceRoadmap(s: State) {
  if (activeHold(s) || s.roadmap.some((i) => i.status === 'open')) return;
  const next = s.roadmap.filter((i) => i.status === 'queued').sort((a, b) => a.position - b.position)[0];
  if (!next) return;
  next.status = 'open';
  next.openedAt = new Date().toISOString();
  next.dueAt = next.dueDays ? new Date(Date.now() + next.dueDays * DAY).toISOString() : null;
}
function load(childId: number): State {
  const hit = memory.get(childId);
  if (hit) return hit;
  let s = fresh();
  try { const raw = sessionStorage.getItem(KEY(childId)); if (raw) s = { ...s, ...JSON.parse(raw) }; } catch { /* dùng trạng thái mới */ }
  memory.set(childId, s);
  return s;
}
function save(childId: number) { try { sessionStorage.setItem(KEY(childId), JSON.stringify(memory.get(childId))); } catch { /* bỏ qua */ } }
const ok = <T>(data: T, message = ''): ApiResponse<T> => ({ success: true, message, data });
const fail = <T>(message: string): ApiResponse<T> => ({ success: false, message, data: null });
const blankProgress = (storyId: number): ReadingProgress => ({ storyId, lastPageRead: 1, bookmarkPage: null, isFavorited: false, completedOnce: false });

/** Danh mục thẻ ước mẫu (Administrator quản lý ở Luồng 5). */
export const WISH_CARDS: WishCard[] = [
  { id: 1, group: 'character', label: 'Chú mèo', emoji: '🐱' }, { id: 2, group: 'character', label: 'Chú ếch', emoji: '🐸' },
  { id: 3, group: 'character', label: 'Cô bé phi hành gia', emoji: '👩‍🚀' }, { id: 4, group: 'character', label: 'Chú rồng nhỏ', emoji: '🐉' },
  { id: 5, group: 'character', label: 'Bạn gấu', emoji: '🐻' }, { id: 6, group: 'character', label: 'Robot tí hon', emoji: '🤖' },
  { id: 11, group: 'place', label: 'Khu rừng', emoji: '🌳' }, { id: 12, group: 'place', label: 'Đáy biển', emoji: '🌊' },
  { id: 13, group: 'place', label: 'Trường học', emoji: '🏫' }, { id: 14, group: 'place', label: 'Vũ trụ', emoji: '🪐' },
  { id: 15, group: 'place', label: 'Đầm sen', emoji: '🪷' }, { id: 16, group: 'place', label: 'Ngôi làng', emoji: '🏡' },
  { id: 21, group: 'challenge', label: 'Bị lạc đường', emoji: '🧭' }, { id: 22, group: 'challenge', label: 'Giúp bạn', emoji: '🤝' },
  { id: 23, group: 'challenge', label: 'Sợ bóng tối', emoji: '🌙' }, { id: 24, group: 'challenge', label: 'Làm mất đồ', emoji: '🎒' },
  { id: 31, group: 'lesson', label: 'Chia sẻ', emoji: '🍰' }, { id: 32, group: 'lesson', label: 'Dũng cảm', emoji: '🦁' },
  { id: 33, group: 'lesson', label: 'Trung thực', emoji: '💎' }, { id: 34, group: 'lesson', label: 'Kiên nhẫn', emoji: '🐢' },
];

/** Từ khoá để khớp thẻ ước với truyện (backend dùng bảng story_wish_card_matches). */
const CARD_KEYWORDS: Record<number, string> = { 1: 'mèo', 2: 'ếch', 3: 'phi hành', 4: 'rồng', 5: 'gấu', 6: 'robot', 11: 'rừng', 12: 'biển', 13: 'trường', 14: 'vũ trụ', 15: 'đầm sen', 16: 'làng' };

export function createLocalReading(loaders: ContentLoaders) {
  /**
   * Luồng 4 Bước 4.5.1 / 4.5.3a — Hold Mode tự động:
   * N bài gần nhất liên tiếp (không tính đọc lại, truyện Thử thách) đều dưới ngưỡng → khoá thư viện;
   * đọc lại đúng truyện gây khoá đạt ngưỡng → tự mở khoá.
   */
  async function applyHoldRules(childId: number, s: State, sess: LocalSession, percent: number) {
    const info = await loaders.child(childId);
    const threshold = info?.holdThreshold ?? 70;
    const window = info?.holdWindow ?? 3;
    const hold = activeHold(s);
    if (hold) {
      if (sess.isRetake && hold.triggeringStoryId === sess.storyId && percent >= threshold) {
        hold.status = 'unlocked';
        hold.resolutionType = 'auto_retake_pass';
        hold.resolvedAt = new Date().toISOString();
        pushNotification('hold_mode_unlocked', { childProfileId: childId, resolutionType: 'auto_retake_pass' });
        advanceRoadmap(s);
      }
      return;
    }
    if (sess.isRetake || sess.challenge) return;
    const recent = s.quizLog.filter((q) => !q.isRetake && !q.challenge).slice(-window);
    if (recent.length === window && recent.every((q) => q.percent < threshold)) {
      s.holds.push({ id: s.nextId++, status: 'hold_mode', heldAt: new Date().toISOString(), triggeringStoryId: sess.storyId, triggeringStoryTitle: sess.title, retakes: [], resolutionType: null, resolvedAt: null, skillGapNotes: null });
      pushNotification('hold_mode_alert', { childProfileId: childId, storyId: sess.storyId });
    }
  }

  return {
    async getHome(childId: number): Promise<ApiResponse<KidHome>> {
      const child = await loaders.child(childId);
      if (!child) return fail('Không tìm thấy hồ sơ của bé.');
      const s = load(childId);
      const library = await loaders.library(childId);
      // Điều ước chờ quá 7 ngày thì hết hạn.
      for (const w of s.wishes) if (w.status === 'pending' && Date.now() - Date.parse(w.createdAt) > 7 * 86_400_000) w.status = 'expired';
      advanceRoadmap(s);
      save(childId);
      const hold = activeHold(s);
      const items = s.roadmap.filter((i) => i.status !== 'removed');
      const open = items.find((i) => i.status === 'open');
      // Truyện trong lộ trình (VD truyện của anh chị em, bộ truyện mẫu) cũng phải mở được từ thư viện của bé.
      for (const i of items) if (!library.some((l) => l.storyId === i.storyId)) library.push({ storyId: i.storyId, title: i.title, genre: null, lesson: null, coverImageUrl: null, source: 'roadmap', lengthCategory: null, readingLevel: null, isChallenge: false, createdAt: i.createdAt });
      return ok({
        childProfileId: childId, nickname: child.nickname, ageBand: child.ageBand, readingLevel: child.readingLevel,
        readingMode: readingModeFor(child.ageBand), storyWishesEnabled: true, library,
        progress: Object.values(s.progress), achievements: s.achievements, wishes: s.wishes,
        roadmap: items.length ? {
          openStoryId: open?.storyId ?? null, note: open?.note ?? null, dueAt: open?.dueAt ?? null,
          done: items.filter((i) => i.status === 'completed').length, total: items.filter((i) => i.status !== 'skipped').length,
          queued: items.filter((i) => i.status === 'queued').sort((a, b) => a.position - b.position).map((i) => ({ storyId: i.storyId, title: i.title })),
        } : null,
        holdMode: hold ? { triggeringStoryId: hold.triggeringStoryId, retakesLeft: Math.max(0, 3 - retakesLast24h(hold)) } : null,
      });
    },

    getPackage: async (storyId: number): Promise<ApiResponse<ReadingPackage>> => {
      const p = await loaders.pack(storyId);
      return p ? ok(p) : fail('Chưa mở được truyện này.');
    },

    async startSession(childId: number, storyId: number, _openedFrom: OpenedFrom, isRetake = false): Promise<ApiResponse<StartSessionResult>> {
      const s = load(childId);
      const id = s.nextId++;
      const meta = (await loaders.library(childId)).find((l) => l.storyId === storyId);
      const title = meta?.title ?? s.roadmap.find((i) => i.storyId === storyId)?.title ?? 'Truyện';
      s.sessions[id] = { storyId, title, genre: meta?.genre ?? null, isRetake, challenge: !!meta?.isChallenge, completed: false, quizDone: false, startedAt: Date.now() };
      // Luồng 4 Bước 4.5.3a — đếm lượt đọc lại truyện gây Hold Mode.
      const hold = activeHold(s);
      if (isRetake && hold && hold.triggeringStoryId === storyId) hold.retakes.push(new Date().toISOString());
      s.progress[storyId] ??= blankProgress(storyId);
      save(childId);
      return ok({ readingSessionId: id, storyVersionId: storyId, isRetake, progress: s.progress[storyId] });
    },

    async saveProgress(childId: number, storyId: number, patch: Partial<ReadingProgress>): Promise<ApiResponse<ReadingProgress>> {
      const s = load(childId);
      s.progress[storyId] = { ...(s.progress[storyId] ?? blankProgress(storyId)), ...patch, storyId };
      save(childId);
      return ok(s.progress[storyId]);
    },

    /** Đọc tới trang cuối = hoàn thành (BR-4.R3); EXP hoàn thành chỉ cho lần đọc đầu, phiên đọc lại để mở khoá không cộng EXP. */
    async complete(childId: number, sessionId: number): Promise<ApiResponse<CompleteResult>> {
      const s = load(childId);
      const sess = s.sessions[sessionId];
      if (!sess) return fail('Phiên đọc đã kết thúc.');
      if (sess.completed) return ok({ expGained: 0, newBadges: [], achievements: s.achievements });
      sess.completed = true;
      const a = s.achievements;
      const firstRead = !s.completedStories.includes(sess.storyId);
      let gained = 0;
      if (firstRead && !sess.isRetake) { gained = EXP.completeFirstRead; s.completedStories.push(sess.storyId); }
      s.progress[sess.storyId] = { ...(s.progress[sess.storyId] ?? blankProgress(sess.storyId)), completedOnce: true, lastPageRead: 1 };
      const today = vnDate();
      a.streakDays = nextStreak(a.lastStreakDate, a.streakDays, today);
      a.lastStreakDate = today;
      a.expTotal += gained;
      a.pendingExp += gained;
      const newBadges = earnedBadges({ storiesCompleted: s.completedStories.length, streakDays: a.streakDays, wordsCollected: s.notebook.length, roadmapFinished: false, wishFulfilled: s.wishes.some((w) => w.status === 'fulfilled') }, a.badges.map((b) => b.badgeCode));
      for (const code of newBadges) a.badges.push({ badgeCode: code, earnedAt: new Date().toISOString() });
      // Luồng 4 — ghi lượt đọc xong cho Dashboard và thẻ "Con vừa đọc xong".
      const now = new Date().toISOString();
      if (!sess.isRetake) {
        s.readLog.push({ storyId: sess.storyId, title: sess.title, genre: sess.genre, at: now, minutes: Math.max(1, Math.round((Date.now() - sess.startedAt) / 60_000)), fromSupervisor: false });
        sess.completionId = s.nextId++;
        s.completions.unshift({ id: sess.completionId, storyId: sess.storyId, title: sess.title, completedAt: now, reaction: null, quizCorrect: null, quizTotal: null, seen: false });
        // Bước 4.1d — đọc xong là xong bước trong lộ trình (từ bất kỳ lối vào nào), rồi mở truyện kế.
        const step = s.roadmap.find((i) => i.storyId === sess.storyId && (i.status === 'queued' || i.status === 'open'));
        if (step) { step.status = 'completed'; step.completedAt = now; advanceRoadmap(s); }
        if (step && !s.roadmap.some((i) => i.status === 'open' || i.status === 'queued')) pushNotification('roadmap_completed', { childProfileId: childId });
        const live = s.roadmap.filter((i) => i.status !== 'removed' && i.status !== 'skipped');
        if (live.length && live.every((i) => i.status === 'completed') && !a.badges.some((b) => b.badgeCode === 'roadmap_finisher')) {
          a.badges.push({ badgeCode: 'roadmap_finisher', earnedAt: now });
          newBadges.push('roadmap_finisher');
        }
      }
      save(childId);
      return ok({ expGained: gained, newBadges, achievements: a });
    },

    async exit(childId: number, sessionId: number, lastPageRead: number): Promise<ApiResponse<null>> {
      const s = load(childId);
      const sess = s.sessions[sessionId];
      if (sess && !sess.completed) s.progress[sess.storyId] = { ...(s.progress[sess.storyId] ?? blankProgress(sess.storyId)), lastPageRead };
      delete s.sessions[sessionId];
      save(childId);
      return ok(null);
    },

    async react(childId: number, sessionId: number, reaction: Reaction): Promise<ApiResponse<null>> {
      const s = load(childId);
      const sess = s.sessions[sessionId];
      if (sess) {
        s.reactions[sess.storyId] = reaction;
        s.achievements.activitiesCompleted += 1;
        const c = s.completions.find((x) => x.id === sess.completionId);
        if (c) c.reaction = reaction;
        save(childId);
      }
      return ok(null);
    },

    /** Chấm câu đố: +2 EXP mỗi câu đúng lần đầu (theo câu chưa từng đúng); phiên đọc lại không cộng EXP. */
    async submitQuiz(childId: number, sessionId: number, pack: ReadingPackage, answers: QuizAnswerInput[]): Promise<ApiResponse<QuizResult>> {
      const s = load(childId);
      const sess = s.sessions[sessionId];
      if (!sess) return fail('Phiên đọc đã kết thúc.');
      const ever = new Set(s.correctEver[sess.storyId] ?? []);
      let expGained = 0;
      const perItem = answers.map((a) => {
        const item = pack.quiz.find((q) => q.id === a.quizItemId);
        const isCorrect = !!item && isAnswerCorrect(item, a.answerGiven);
        if (isCorrect && !ever.has(a.quizItemId)) { ever.add(a.quizItemId); if (!sess.isRetake) expGained += EXP.quizFirstCorrect; }
        return { quizItemId: a.quizItemId, isCorrect };
      });
      s.correctEver[sess.storyId] = [...ever];
      sess.quizDone = true;
      s.achievements.expTotal += expGained;
      s.achievements.pendingExp += expGained;
      if (!sess.isRetake) s.achievements.activitiesCompleted += 1;
      const correct = perItem.filter((p) => p.isCorrect).length;
      const percent = perItem.length ? Math.round((correct / perItem.length) * 100) : 100;
      const c = s.completions.find((x) => x.id === sess.completionId);
      if (c) { c.quizCorrect = correct; c.quizTotal = perItem.length; }
      s.quizLog.push({ storyId: sess.storyId, title: sess.title, percent, at: new Date().toISOString(), isRetake: sess.isRetake, challenge: sess.challenge });
      await applyHoldRules(childId, s, sess, percent);
      save(childId);
      return ok({ correct, total: perItem.length, expGained, perItem });
    },

    async collectWord(childId: number, storyId: number, word: { id: number; term: string; definition: string }): Promise<ApiResponse<{ expGained: number }>> {
      const s = load(childId);
      if (s.notebook.some((n) => n.storyVocabularyId === word.id && n.storyId === storyId)) return ok({ expGained: 0 }, 'Em đã lưu từ này rồi.');
      s.notebook.push({ storyVocabularyId: word.id, term: word.term, definition: word.definition, storyId, collectedAt: new Date().toISOString() });
      s.achievements.expTotal += EXP.wordCollected;
      s.achievements.pendingExp += EXP.wordCollected;
      s.achievements.activitiesCompleted += 1;
      save(childId);
      return ok({ expGained: EXP.wordCollected });
    },

    async notebook(childId: number): Promise<ApiResponse<NotebookEntry[]>> { return ok(load(childId).notebook.slice().reverse()); },

    /** Bước 3.4 — "đầu tư" EXP vào Cây tri thức; tổng EXP không giảm. */
    async invest(childId: number): Promise<ApiResponse<Achievements>> {
      const a = load(childId).achievements;
      a.knowledgeTreeExp += a.pendingExp;
      a.pendingExp = 0;
      save(childId);
      return ok(a);
    },

    async forceExitRequested(): Promise<ApiResponse<boolean>> { return ok(false); },

    wishCards: async (): Promise<ApiResponse<WishCard[]>> => ok(WISH_CARDS),

    /** Bước 3.1b — tối đa 2 điều ước đang chờ và 1 điều ước mới mỗi ngày; gợi ý tối đa 3 truyện có sẵn khớp nhân vật hoặc nơi chốn. */
    async submitWish(childId: number, input: SubmitWishInput): Promise<ApiResponse<StoryWish>> {
      const s = load(childId);
      const open = s.wishes.filter((w) => w.status === 'pending' || w.status === 'accepted');
      if (open.length >= 2) return fail('Em đang có 2 điều ước chờ bố mẹ rồi. Mình chờ thêm chút nhé!');
      if (s.wishes.some((w) => vnDate(new Date(w.createdAt)) === vnDate())) return fail('Hôm nay em đã ước rồi. Mai mình ước tiếp nhé!');
      const library = await loaders.library(childId);
      const want = [CARD_KEYWORDS[input.characterCardId], CARD_KEYWORDS[input.placeCardId]];
      const suggestions = library
        .map((st) => {
          const text = `${st.title} ${st.genre ?? ''} ${st.lesson ?? ''}`.toLowerCase();
          const matched = [input.characterCardId, input.placeCardId].filter((id, i) => want[i] && text.includes(want[i]));
          return { storyId: st.storyId, title: st.title, matchedCardIds: matched, challenge: st.isChallenge };
        })
        .filter((x) => x.matchedCardIds.length > 0)
        .sort((a, b) => b.matchedCardIds.length - a.matchedCardIds.length || Number(a.challenge) - Number(b.challenge))
        .slice(0, 3)
        .map(({ storyId, title, matchedCardIds }) => ({ storyId, title, matchedCardIds }));
      const wish: StoryWish = { id: s.nextId++, ...input, status: 'pending', fulfillmentType: null, storyId: null, suggestions, createdAt: new Date().toISOString() };
      s.wishes.unshift(wish);
      save(childId);
      return ok(wish);
    },

    async logEvents(): Promise<ApiResponse<null>> { return ok(null); },
  };
}

export type LocalReading = ReturnType<typeof createLocalReading>;
export type { NotebookEntry };
