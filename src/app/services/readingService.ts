import { USE_MOCK } from '@/app/mocks/config';
import type { ApiResponse } from '@/app/types/auth';
import type {
  Achievements, CompleteResult, KidHome, LibraryStory, OpenedFrom, QuizAnswerInput, QuizResult, Reaction, ReadingPackage,
  ReadingProgress, StartSessionResult, StoryWish, SubmitWishInput, TelemetryEvent, WishCard,
} from '@/app/types/reading';
import { apiRequest } from './apiClient';
import { childAccessService } from './childAccessService';
import { childManualStoryService } from './parentAuthoringService';
import { childProfileService } from './childProfileService';
import { storyService } from './storyService';
import { aiStoryCreationService } from './aiStoryCreationService';
import { createLocalReading, type ContentLoaders, type NotebookEntry } from './readingLocal';
import { PUBLIC_STORY_BASE, staffLocal } from './staffLocal';
import { normalizeStoryStatus } from '@/app/features/story-workflow/storyGenerationFlow';
import { splitScenes } from '@/app/lib/storyView';
import { markKidActivity } from '@/app/lib/kidActivity';
import { defaultReadingLevel } from '@/app/lib/guardian';

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

/** Thư viện chung (Public Library) còn là dữ liệu mẫu của Luồng 5: chỉ ghép vào khi bật chế độ dữ liệu mẫu. */
const mockPublicLibrary = (): LibraryStory[] => (USE_MOCK ? staffLocal.publicStories() : []).map((p) => ({
  storyId: p.id, title: p.title, genre: p.genre, lesson: p.moralLesson, coverImageUrl: null, source: 'public_library',
  lengthCategory: 'short', readingLevel: p.readingLevel, isChallenge: false, createdAt: p.updatedAt,
}));
const mockPublicStory = (storyId: number): ReadingPackage | null => {
  if (!USE_MOCK || storyId <= PUBLIC_STORY_BASE) return null;
  const p = staffLocal.publicStories().find((x) => x.id === storyId);
  return p ? { storyId, storyVersionId: storyId, title: p.title, lesson: p.moralLesson, pages: splitScenes(p.content).map((text, i) => ({ pageNumber: i + 1, text })), vocabulary: [], quiz: [] } : null;
};

const realLoaders: ContentLoaders = {
  async child(childId) {
    const [c, lp, sp] = await Promise.all([childProfileService.getChildProfileById(childId), childProfileService.getLearningProfile(childId), childProfileService.getSafetyPolicy(childId)]);
    if (c.success && c.data) {
      return { nickname: c.data.nickname, ageBand: c.data.ageBand, readingLevel: lp.data?.readingLevel ?? 2, holdThreshold: sp.data?.comprehensionThresholdPercent, holdWindow: sp.data?.comprehensionWindowSize };
    }
    // Bé vào bằng mã QR trên máy không có người lớn đăng nhập: các API hồ sơ cần token người lớn,
    // nên lấy biệt danh và nhóm tuổi từ chính phiên của bé (`GET /ChildAccessCredential/me`).
    const childToken = token();
    if (!childToken) return null;
    const me = await childAccessService.getSessionProfile(childToken);
    if (!me.success || !me.data || me.data.childProfileId !== childId) return null;
    return { nickname: me.data.nickname, ageBand: me.data.ageBand, readingLevel: defaultReadingLevel(me.data.ageBand) };
  },
  async library(childId) {
    // Backend chưa lọc truyện theo hồ sơ bé: lấy truyện do Owner của bé tạo (xem docs/BACKEND_API_STATUS.md, Luồng 2).
    const owner = (await childProfileService.getChildProfileById(childId)).data?.ownerUserId;
    const r = owner ? await storyService.getStories({ authorUserId: owner, pageSize: 100, isDescending: true }) : null;
    const own = (r?.data?.items ?? [])
      .filter((s) => s.isPublished || normalizeStoryStatus(s.status) === 'ready')
      .map((s): LibraryStory => ({ storyId: s.id, title: s.title, genre: s.genre ?? null, lesson: s.moralLesson ?? null, coverImageUrl: s.coverImageUrl ?? null, source: 'own', lengthCategory: null, readingLevel: null, isChallenge: false, createdAt: s.createdAt }));
    return [...own, ...mockPublicLibrary()];
  },
  async pack(storyId) {
    const publicStory = mockPublicStory(storyId);
    if (publicStory) return publicStory;
    const [st, qz, voc, media] = await Promise.all([
      storyService.getStoryById(storyId), aiStoryCreationService.getQuizReview(storyId),
      aiStoryCreationService.getVocabularyReview(storyId), aiStoryCreationService.getMediaPackage(storyId),
    ]);
    const dto = st.data;
    if (!dto) return null;
    // Ảnh minh hoạ của từng cảnh lấy từ gói media đã duyệt; cảnh nào chưa có ảnh thì màn đọc dùng nền màu.
    const images = (media.data?.scenes ?? []).slice().sort((a, b) => a.sceneIndex - b.sceneIndex)
      .map((sc) => sc.illustrations.slice().sort((a, b) => a.beatOrder - b.beatOrder).find((il) => il.url)?.url ?? null);
    const pages = splitScenes(dto.content ?? '').map((text, i) => ({ pageNumber: i + 1, text, imageUrl: images[i] ?? null }));
    return {
      storyId, storyVersionId: voc.data?.versionId ?? storyId, title: dto.title, lesson: dto.moralLesson ?? null, pages,
      vocabulary: (voc.data?.items ?? []).map((v, i) => ({ id: v.id ?? i + 1, term: v.term, definition: v.definition })),
      quiz: (qz.data?.items ?? []).filter((q) => q.question && q.correctAnswer).map((q, i) => ({
        id: q.id ?? i + 1, type: q.type, question: q.question, choices: q.type === 'true_false' && !q.choices?.length ? ['Đúng', 'Sai'] : q.choices ?? null, acceptedAnswers: [q.correctAnswer!],
      })),
    };
  },
};

const local = createLocalReading(realLoaders);
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

interface MyRoadmapDto {
  open: { storyId: number; title: string | null; coverImageUrl: string | null; note: string | null; expectedBy: string | null; isLocked: boolean } | null;
  upcoming: { order: number; storyId: number; title: string | null }[];
  completedCount: number;
  totalCount: number;
}

/**
 * Mục "Bố mẹ chọn cho em" lấy từ API thật `GET /MyRoadmap` (cần token phiên của bé). Không có phiên bé hoặc API lỗi thì giữ
 * lộ trình của trang chính. Truyện đang mở chưa có trong kệ của bé thì thêm vào để mở được từ lộ trình.
 */
async function withMyRoadmap(home: ApiResponse<KidHome>): Promise<ApiResponse<KidHome>> {
  const childToken = token();
  if (USE_MOCK || !childToken || !home.data) return home;
  const r = await apiRequest<MyRoadmapDto>('/MyRoadmap', '', { token: childToken });
  if (!r.success || !r.data) return home;
  const d = r.data;
  const h = home.data;
  const extra: LibraryStory[] = d.open && !h.library.some((s) => s.storyId === d.open!.storyId)
    ? [{ storyId: d.open.storyId, title: d.open.title ?? '', genre: null, lesson: null, coverImageUrl: d.open.coverImageUrl, source: 'roadmap', lengthCategory: null, readingLevel: null, isChallenge: false, createdAt: '' }]
    : [];
  const roadmap = d.totalCount === 0 ? null : {
    openStoryId: d.open?.storyId ?? null, note: d.open?.note ?? null, dueAt: d.open?.expectedBy ?? null, openLocked: d.open?.isLocked ?? false,
    done: d.completedCount, total: d.totalCount,
    queued: [...d.upcoming].sort((a, b) => a.order - b.order).map((u) => ({ storyId: u.storyId, title: u.title ?? '' })),
  };
  return { ...home, data: { ...h, library: [...h.library, ...extra], roadmap } };
}

/** storyId → lần giao (confirmationId) của truyện bố mẹ tự viết; mở truyện đọc đúng bản đã giao, không lấy bản hiện tại. */
const familyStories = new Map<number, number>();

/** Truyện bố mẹ tự viết đã giao cho bé (`/child/manual-stories`, cần token phiên bé) đứng đầu kệ. */
async function withFamilyStories(home: ApiResponse<KidHome>): Promise<ApiResponse<KidHome>> {
  if (USE_MOCK || !childManualStoryService.available() || !home.data) return home;
  const r = await childManualStoryService.list();
  if (!r.success || !r.data?.length) return home;
  const h = home.data;
  const packs = await Promise.all(r.data.map((g) => childManualStoryService.package(g.confirmationId)));
  const extra: LibraryStory[] = [];
  r.data.forEach((g, i) => {
    const p = packs[i].data;
    if (!p) return;
    familyStories.set(g.storyId, g.confirmationId);
    if (!h.library.some((s) => s.storyId === g.storyId)) {
      extra.push({ storyId: g.storyId, title: p.title, genre: null, lesson: null, coverImageUrl: null, source: 'family', lengthCategory: null, readingLevel: null, isChallenge: false, createdAt: g.confirmedAt });
    }
  });
  return { ...home, data: { ...h, library: [...extra, ...h.library] } };
}

/** Truyện cộng đồng đã duyệt, hợp tuổi bé (`GET /CommunityLibrary`, cần token phiên bé). */
async function withCommunity(home: ApiResponse<KidHome>): Promise<ApiResponse<KidHome>> {
  const childToken = token();
  if (USE_MOCK || !childToken || !home.data) return home;
  const r = await apiRequest<{ items: { submissionId: number; title: string; description: string | null }[] }>('/CommunityLibrary?pageSize=20', '', { token: childToken });
  if (!r.success || !r.data?.items.length) return home;
  return { ...home, data: { ...home.data, community: r.data.items.map((c) => ({ submissionId: c.submissionId, title: c.title, description: c.description })) } };
}

/** Gói đọc của truyện bố mẹ tự viết: mỗi đoạn backend chia sẵn là một trang; chưa có từ vựng, câu đố. */
async function familyPackage(storyId: number, confirmationId: number): Promise<ApiResponse<ReadingPackage>> {
  const r = await childManualStoryService.package(confirmationId);
  if (!r.success || !r.data) return { success: false, message: r.message || 'Chưa mở được truyện này.', data: null };
  const p = r.data;
  return {
    success: true, message: '',
    data: { storyId, storyVersionId: p.storyVersionId, title: p.title, lesson: null, vocabulary: [], quiz: [],
      pages: [...p.segments].sort((a, b) => a.order - b.order).map((s, i) => ({ pageNumber: i + 1, text: s.text.trim() })).filter((pg) => pg.text) },
  };
}

export const readingService = {
  /** true khi đang chạy bằng bộ máy cục bộ (tiến độ chưa được lưu lên máy chủ). */
  isLocal: () => backendReady === false,

  getHome: async (childId: number): Promise<ApiResponse<KidHome>> =>
    withCommunity(await withFamilyStories(await withMyRoadmap(await call(`/children/${childId}/reading/home`, () => local.getHome(childId))))),

  getPackage: (storyId: number): Promise<ApiResponse<ReadingPackage>> => {
    const confirmationId = familyStories.get(storyId);
    if (confirmationId !== undefined) return familyPackage(storyId, confirmationId);
    return call(`/reading/stories/${storyId}/package`, () => local.getPackage(storyId));
  },

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
    // Mọi sự kiện telemetry đều tính là bé đang hoạt động (phiên hết hạn sau 20 phút không hoạt động).
    markKidActivity();
    if (sessionId === null || backendReady === false) return;
    void apiRequest(`/reading/sessions/${sessionId}/telemetry`, '', { method: 'POST', body: { events: [{ eventType, payload: payload ? JSON.stringify(payload) : null, occurredAt: new Date().toISOString() }] }, token: token() });
  },
};

export type { NotebookEntry };
