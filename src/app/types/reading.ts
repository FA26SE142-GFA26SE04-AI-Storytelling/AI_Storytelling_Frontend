/**
 * Kiểu dữ liệu Luồng 3 — trải nghiệm đọc của bé.
 * Tên trường bám theo entity backend (ReadingSession, ReadingProgress, Achievement, Badge,
 * QuizAttempt, VocabularyNotebookEntry, TelemetryLog). Backend chưa có API — xem readingService.
 */

export type OpenedFrom = 'library' | 'roadmap' | 'wish_suggestion' | 'continue_reading';
export type SessionStatus = 'started' | 'reading' | 'completed' | 'abandoned' | 'force_exited';
export type Reaction = 'love' | 'like' | 'neutral' | 'dislike';
export type ReadingMode = 'listen_first' | 'read_first';

export interface WordTiming { word: string; startMs: number; endMs: number }

export interface ReadingPage {
  pageNumber: number;
  text: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  /** Mốc thời gian từng chữ của TTS; không có thì không tô sáng karaoke. */
  wordTimings?: WordTiming[] | null;
}

export interface ReadingVocabulary { id: number; term: string; definition: string }

export interface ReadingQuizItem {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | string;
  question: string;
  choices: string[] | null;
  /** Đáp án đúng (trắc nghiệm/đúng-sai) hoặc danh sách đáp án chấp nhận (tự luận ngắn). */
  acceptedAnswers: string[];
}

/** Gói nội dung một lần đọc — luôn là bản `published_version_id` tại lúc mở (BR-2.33). */
export interface ReadingPackage {
  storyId: number;
  storyVersionId: number;
  title: string;
  lesson: string | null;
  pages: ReadingPage[];
  vocabulary: ReadingVocabulary[];
  quiz: ReadingQuizItem[];
}

export interface LibraryStory {
  storyId: number;
  title: string;
  genre: string | null;
  lesson: string | null;
  coverImageUrl: string | null;
  /** Nguồn: truyện riêng của bé / bố mẹ chọn / thư viện chung / cộng đồng. */
  source: 'own' | 'roadmap' | 'public_library' | 'community';
  lengthCategory: 'short' | 'medium' | 'long' | null;
  readingLevel: number | null;
  /** Khó hơn mức của bé ≥ 2 bậc (Luồng 3 Bước 3.1). */
  isChallenge: boolean;
  createdAt: string;
}

export interface ReadingProgress {
  storyId: number;
  lastPageRead: number;
  bookmarkPage: number | null;
  isFavorited: boolean;
  completedOnce: boolean;
}

export interface Achievements {
  expTotal: number;
  knowledgeTreeExp: number;
  /** EXP vừa nhận nhưng bé chưa "đầu tư" vào Cây tri thức. */
  pendingExp: number;
  streakDays: number;
  lastStreakDate: string | null;
  activitiesCompleted: number;
  badges: { badgeCode: string; earnedAt: string }[];
}

export interface RoadmapView {
  openStoryId: number | null;
  note: string | null;
  dueAt: string | null;
  /** Truyện đang mở bị khoá (backend không nêu lý do; ví dụ đang Hold Mode). */
  openLocked?: boolean;
  done: number;
  total: number;
  queued: { storyId: number; title: string }[];
}

export interface HoldModeView { triggeringStoryId: number | null; retakesLeft: number }

export interface KidHome {
  childProfileId: number;
  nickname: string;
  ageBand: string;
  readingLevel: number;
  readingMode: ReadingMode;
  storyWishesEnabled: boolean;
  library: LibraryStory[];
  progress: ReadingProgress[];
  achievements: Achievements;
  roadmap: RoadmapView | null;
  holdMode: HoldModeView | null;
  wishes: StoryWish[];
}

export interface StartSessionResult {
  readingSessionId: number;
  storyVersionId: number;
  isRetake: boolean;
  progress: ReadingProgress;
}

export interface QuizAnswerInput { quizItemId: number; answerGiven: string }
export interface QuizResult { correct: number; total: number; expGained: number; perItem: { quizItemId: number; isCorrect: boolean }[] }
export interface CompleteResult { expGained: number; newBadges: string[]; achievements: Achievements }

// ---------- Bé ước một câu chuyện (Luồng 3 Bước 3.1b, Luồng 2 mục 3.5) ----------
export type WishGroup = 'character' | 'place' | 'challenge' | 'lesson';
export interface WishCard { id: number; group: WishGroup; label: string; emoji: string }
export type WishStatus = 'pending' | 'accepted' | 'fulfilled' | 'declined' | 'expired' | 'cancelled';
export interface StoryWish {
  id: number;
  characterCardId: number;
  placeCardId: number;
  challengeCardId: number | null;
  lessonCardId: number | null;
  status: WishStatus;
  fulfillmentType: 'generated' | 'existing_story' | null;
  storyId: number | null;
  suggestions: { storyId: number; title: string; matchedCardIds: number[] }[];
  createdAt: string;
}
export interface SubmitWishInput { characterCardId: number; placeCardId: number; challengeCardId: number | null; lessonCardId: number | null }

export type TelemetryEvent =
  | 'session_started' | 'session_completed' | 'page_viewed' | 'page_completed' | 'tts_started' | 'tts_completed'
  | 'vocabulary_opened' | 'vocabulary_collected' | 'quiz_answered' | 'quiz_completed' | 'reward_granted' | 'badge_unlocked'
  | 'story_bookmarked' | 'story_favorited' | 'library_searched' | 'session_force_exited' | 'story_wish_submitted'
  | 'story_reacted' | 'wish_suggestion_opened';
