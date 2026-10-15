import { USE_MOCK } from '@/app/mocks/config';
import { mockReadingLoaders } from '@/app/mocks/mockReading';
import type { ApiResponse } from '@/app/types/auth';
import type {
  Achievements, CompleteResult, KidHome, LibraryStory, OpenedFrom, QuizAnswerInput, QuizResult, Reaction, ReadingPackage,
  ReadingProgress, StartSessionResult, StoryWish, SubmitWishInput, TelemetryEvent, WishCard,
} from '@/app/types/reading';
import { apiRequest } from './apiClient';
import { childAccessService } from './childAccessService';
import { childProfileService } from './childProfileService';
import { storyService } from './storyService';
import { aiStoryCreationService } from './aiStoryCreationService';
import { createLocalReading, type ContentLoaders, type NotebookEntry } from './readingLocal';
import { normalizeStoryStatus } from '@/app/features/story-workflow/storyGenerationFlow';
import { splitScenes } from '@/app/lib/storyView';

/**
 * Luồng 3 — dịch vụ đọc của bé.
 *
 * HỢP ĐỒNG API ĐỀ XUẤT (backend chưa có — xem docs/FRONTEND_PROGRESS.md, "Luồng 3 — cần backend bổ sung"):
 *   GET  /children/{childId}/reading/home                    → KidHome
 *   GET  /reading/stories/{storyId}/package                  → ReadingPackage (bản published_version_id)
 *   POST /reading/sessions                                   { childProfileId, storyId, openedFrom, isRetake } → StartSessionResult
 *   PUT  /children/{childId}/reading/progress/{storyId}      { lastPageRead?, bookmarkPage?, isFavorited? }
 *   POST /reading/sessions/{id}/complete                     → CompleteResult
 *   POST /reading/sessions/{id}/exit                         { lastPageRead }  (status = abandoned)
 *   POST /reading/sessions/{id}/reaction                     { reaction }
 *   POST /reading/sessions/{id}/quiz                         { answers: [{ quizItemId, answerGiven }] } → QuizResult
 *   GET  /reading/sessions/{id}/force-exit                   → boolean (client hỏi mỗi 15 giây)
 *   POST /reading/sessions/{id}/telemetry                    { events: [{ eventType, payload, occurredAt }] }
 *   GET|POST /children/{childId}/vocabulary-notebook         { storyVocabularyId }
 *   POST /children/{childId}/achievements/invest             → Achievements
 *   GET  /children/{childId}/wish-cards                      → WishCard[]
 *   POST /children/{childId}/wishes                          SubmitWishInput → StoryWish (kèm suggestions)
 * Mọi lời gọi dùng token phiên của bé (Child Session).
 */

const realLoaders: ContentLoaders = {
  async child(childId) {
    const [c, lp, sp] = await Promise.all([childProfileService.getChildProfileById(childId), childProfileService.getLearningProfile(childId), childProfileService.getSafetyPolicy(childId)]);
    if (!c.success || !c.data) return null;
    return { nickname: c.data.nickname, ageBand: c.data.ageBand, readingLevel: lp.data?.readingLevel ?? 2, holdThreshold: sp.data?.comprehensionThresholdPercent, holdWindow: sp.data?.comprehensionWindowSize };
  },
  async library(childId) {
    const r = await storyService.getStories({ childProfileId: childId, pageSize: 100, sortBy: 'createdAt', sortDescending: true });
    return (r.data?.items ?? [])
      .filter((s) => s.isPublished || normalizeStoryStatus(s.status) === 'ready')
      .map((s): LibraryStory => ({ storyId: s.id, title: s.title, genre: s.genre ?? s.categoryName ?? null, lesson: s.moralLesson ?? null, coverImageUrl: s.coverImageUrl ?? null, source: 'own', lengthCategory: null, readingLevel: null, isChallenge: false, createdAt: s.createdAt }));
  },
  async pack(storyId) {
    const [st, qz, voc] = await Promise.all([storyService.getStoryById(storyId), aiStoryCreationService.getQuizReview(storyId), aiStoryCreationService.getVocabularyReview(storyId)]);
    const dto = st.data;
    if (!dto) return null;
    const fromPages = dto.pages?.slice().sort((a, b) => a.pageNumber - b.pageNumber) ?? [];
    const pages = fromPages.length
      ? fromPages.map((p) => ({ pageNumber: p.pageNumber, text: p.content, imageUrl: p.imageUrl ?? null, audioUrl: p.audioUrl ?? null, wordTimings: null }))
      : splitScenes(dto.content ?? '').map((text, i) => ({ pageNumber: i + 1, text }));
    return {
      storyId, storyVersionId: voc.data?.versionId ?? storyId, title: dto.title, lesson: dto.moralLesson ?? null, pages,
      vocabulary: (voc.data?.items ?? []).map((v, i) => ({ id: v.id ?? i + 1, term: v.term, definition: v.definition })),
      quiz: (qz.data?.items ?? []).filter((q) => q.question && q.correctAnswer).map((q, i) => ({
        id: q.id ?? i + 1, type: q.type, question: q.question, choices: q.type === 'true_false' && !q.choices?.length ? ['Đúng', 'Sai'] : q.choices ?? null, acceptedAnswers: [q.correctAnswer!],
      })),
    };
  },
};

const local = createLocalReading(USE_MOCK ? mockReadingLoaders : realLoaders);
/** null = chưa biết; false = backend chưa có API đọc → dùng bộ máy cục bộ. */
let backendReady: boolean | null = USE_MOCK ? false : null;
const token = () => childAccessService.readSession()?.accessToken;

async function call<T>(path: string, fallback: () => Promise<ApiResponse<T>>, opts: { method?: 'GET' | 'POST' | 'PUT'; body?: unknown } = {}): Promise<ApiResponse<T>> {
  if (backendReady === false) return fallback();
  const r = await apiRequest<T>(path, 'Không kết nối được.', { ...opts, token: token() });
  if (r.success) { backendReady = true; return r; }
  if (backendReady === null) { backendReady = false; return fallback(); }
  return r;
}

export const readingService = {
  /** true khi đang chạy bằng bộ máy cục bộ (tiến độ chưa được lưu lên máy chủ). */
  isLocal: () => backendReady === false,

  getHome: (childId: number): Promise<ApiResponse<KidHome>> =>
    call(`/children/${childId}/reading/home`, () => local.getHome(childId)),

  getPackage: (storyId: number): Promise<ApiResponse<ReadingPackage>> =>
    call(`/reading/stories/${storyId}/package`, () => local.getPackage(storyId)),

  startSession: (childId: number, storyId: number, openedFrom: OpenedFrom, isRetake = false): Promise<ApiResponse<StartSessionResult>> =>
    call('/reading/sessions', () => local.startSession(childId, storyId, openedFrom, isRetake), { method: 'POST', body: { childProfileId: childId, storyId, openedFrom, isRetake } }),

  saveProgress: (childId: number, storyId: number, patch: Partial<ReadingProgress>): Promise<ApiResponse<ReadingProgress>> =>
    call(`/children/${childId}/reading/progress/${storyId}`, () => local.saveProgress(childId, storyId, patch), { method: 'PUT', body: patch }),

  complete: (childId: number, sessionId: number): Promise<ApiResponse<CompleteResult>> =>
    call(`/reading/sessions/${sessionId}/complete`, () => local.complete(childId, sessionId), { method: 'POST' }),

  exit: (childId: number, sessionId: number, lastPageRead: number): Promise<ApiResponse<null>> =>
    call(`/reading/sessions/${sessionId}/exit`, () => local.exit(childId, sessionId, lastPageRead), { method: 'POST', body: { lastPageRead } }),

  react: (childId: number, sessionId: number, reaction: Reaction): Promise<ApiResponse<null>> =>
    call(`/reading/sessions/${sessionId}/reaction`, () => local.react(childId, sessionId, reaction), { method: 'POST', body: { reaction } }),

  submitQuiz: (childId: number, sessionId: number, pack: ReadingPackage, answers: QuizAnswerInput[]): Promise<ApiResponse<QuizResult>> =>
    call(`/reading/sessions/${sessionId}/quiz`, () => local.submitQuiz(childId, sessionId, pack, answers), { method: 'POST', body: { answers } }),

  collectWord: (childId: number, storyId: number, word: { id: number; term: string; definition: string }): Promise<ApiResponse<{ expGained: number }>> =>
    call(`/children/${childId}/vocabulary-notebook`, () => local.collectWord(childId, storyId, word), { method: 'POST', body: { storyVocabularyId: word.id } }),

  notebook: (childId: number): Promise<ApiResponse<NotebookEntry[]>> =>
    call(`/children/${childId}/vocabulary-notebook`, () => local.notebook(childId)),

  invest: (childId: number): Promise<ApiResponse<Achievements>> =>
    call(`/children/${childId}/achievements/invest`, () => local.invest(childId), { method: 'POST' }),

  forceExitRequested: (sessionId: number): Promise<ApiResponse<boolean>> =>
    call(`/reading/sessions/${sessionId}/force-exit`, () => local.forceExitRequested()),

  wishCards: (childId: number): Promise<ApiResponse<WishCard[]>> =>
    call(`/children/${childId}/wish-cards`, () => local.wishCards()),

  submitWish: (childId: number, input: SubmitWishInput): Promise<ApiResponse<StoryWish>> =>
    call(`/children/${childId}/wishes`, () => local.submitWish(childId, input), { method: 'POST', body: input }),

  /** Telemetry chạy nền, không chặn trải nghiệm (Bước 3.4). */
  log(sessionId: number | null, eventType: TelemetryEvent, payload?: Record<string, unknown>) {
    if (sessionId === null || backendReady === false) return;
    void apiRequest(`/reading/sessions/${sessionId}/telemetry`, '', { method: 'POST', body: { events: [{ eventType, payload: payload ? JSON.stringify(payload) : null, occurredAt: new Date().toISOString() }] }, token: token() });
  },
};

export type { NotebookEntry };
