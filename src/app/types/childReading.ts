import type { ReadingTimeStatus } from './readingSchedule';
import type { ReadAloudPractice } from './kidReflection';
export interface ChildStory { storyId:number; title:string; coverImageUrl:string|null; description:string|null; source:string }
export interface ChildStoryPage { isLocked:boolean; unlockStoryId:number|null; message:string|null; items:ChildStory[]; totalCount:number; pageIndex:number; pageSize:number }
export interface ReadingStart { storyId?:number; communitySubmissionId?:number }
export interface ReadingFlags { isBookmarked:boolean; isFavorited:boolean; listenOnly?:boolean }
export interface ReadingStarted extends ReadingFlags { sessionId:number; storyId:number; resumed:boolean; lastPage:number; lastReadingMode:string|null }
// ---------- Tương tác khi nghe (5 loại) ----------
export type InteractionType = 'Checkpoint'|'RolePlay'|'FillBlank'|'EventOrdering'|'PicturePrediction';
export interface InteractionOption { id:number; text:string; imageUrl:string|null; audioUrl:string|null; feedback:string|null; feedbackAudioUrl:string|null }
/** Không kèm đáp án: backend chỉ chấm khi bé gửi câu trả lời. */
export interface ReadingInteraction {
  id:number; type:InteractionType|string; kind:string|null; prompt:string|null;
  /** Câu hướng dẫn cố định của RolePlay, FillBlank, EventOrdering (loại không có prompt); audio ở audioUrls.instruction. */
  instruction?:string|null;
  characterName:string|null; modelSentence:string|null; modelAudioUrl:string|null;
  maskedSentence:string|null; hint:string|null; waitFeedback:string|null; revealSceneIndex:number|null;
  audioUrls:Record<string,string>; options:InteractionOption[];
}
/** Chỉ gửi trường của đúng loại: Checkpoint/PicturePrediction gửi optionId, FillBlank gửi answer, EventOrdering gửi orderedOptionIds. */
export interface ListeningAttemptRequest { optionId?:number; answer?:string; orderedOptionIds?:number[] }
export interface ListeningAttemptResult {
  interactionId:number; type:string; matched:boolean|null; feedback:string|null; feedbackAudioUrl:string|null;
  suggestedAnswer:string|null; replaySceneIndexes:number[]; revealed:boolean; correctOrderOptionIds:number[]|null;
}
/** Một tranh của cảnh, minh hoạ đoạn chữ [startOffset, endOffset) trong text của cảnh. */
export interface SceneIllustration { beatOrder:number; startOffset:number; endOffset:number; url:string|null }
export interface ReadingSegment { segmentId:number; segmentOrder:number; startOffset?:number; endOffset?:number; text:string; audioUrl:string|null; wordTimingsJson:string|null }
export type ReadAloudStatus = 'good'|'retry'|'skipped';
export type ReadAloudHint = 'tone'|'unclear'|'different';
export interface ReadAloudWord { index:number; text:string; status:ReadAloudStatus; hint:ReadAloudHint|null }
export interface ReadAloudResult { sessionId:number; segmentId:number; words:ReadAloudWord[]; goodCount:number; retryCount:number; skippedCount:number; totalCount:number; message:string }
export interface ReadingScene {
  sceneId:number; sceneIndex:number; text:string; illustrationUrl:string|null;
  /** 1–3 tranh theo thứ tự; Backend cũ không trả trường này thì chỉ có illustrationUrl. */
  illustrations?:SceneIllustration[];
  /** startOffset/endOffset: vị trí đoạn trong text của cảnh (Backend cũ không có). */
  segments:ReadingSegment[];
  /** Hiện khi bé nghe hết cảnh này; null nếu không có. */
  interaction:ReadingInteraction|null;
  /** Bé đã thử tương tác này trong phiên hiện tại nên không hỏi lại. */
  attemptedInSession:boolean;
}
/** readAloudPractice: trang luyện đọc to sau cảnh cuối; null khi truyện không có. */
export interface ReadingContent { sessionId:number; storyId:number; title:string; lesson:string|null; listenOnly:boolean; scenes:ReadingScene[]; vocabulary:{id:number; term:string}[]; readAloudPractice?:ReadAloudPractice|null }
export type ReadingMode = 'ReadFirst'|'ListenFirst';
export interface ReadingProgress { sessionId:number; page:number; readingMode:string|null; timeSpentSeconds:number }
/** expGained = 0 khi đọc lại hoặc gọi lần hai; newBadges là mã huy hiệu vừa mở. */
export interface ReadingCompleted { sessionId:number; storyId:number; isRetake:boolean; roadmapStepCompleted:boolean; expGained:number; newBadges:string[] }
export type ReadingFeeling = 'VeryLike'|'Like'|'Neutral'|'Dislike';
export interface ReadingFeelingResult { sessionId:number; feeling:ReadingFeeling|string; label:string }

// ---------- Quiz sau khi đọc (/child/quiz) ----------
export type QuizQuestionType = 'MultipleChoice'|'TrueFalse'|'ShortAnswer';
/** choices rỗng với câu tự luận ngắn; không bao giờ kèm đáp án. */
export interface QuizQuestion { quizItemId:number; type:QuizQuestionType|string; question:string; choices:string[] }
export interface ChildQuiz { sessionId:number; totalQuestions:number; bestPercent:number|null; questions:QuizQuestion[] }
export interface QuizAnswerResult { quizItemId:number; isCorrect:boolean; feedback:string; expGained:number; newBadges:string[]; runCompleted:boolean; currentPercent:number; bestPercent:number|null }
export interface ChildQuizResult { sessionId:number; totalQuestions:number; answered:number; correct:number; currentPercent:number; bestPercent:number|null; runCompleted:boolean }

// ---------- Phần thưởng (/child/rewards) ----------
export interface ChildBadge { code:string; name:string; description:string; earned:boolean; earnedAt:string|null }
/** expToWater: EXP chưa tưới, bé bấm "Tưới cây" để dùng. nextStageAt = null khi cây đã ra hoa. */
export interface KnowledgeTree { stage:string; stageName:string; currentTreeExp:number; nextStageAt:number|null; flowerAt:number; floweredTreeCount:number; expToWater:number }
export interface ChildRewards { expTotal:number; streakDays:number; badges:ChildBadge[]; knowledgeTree:KnowledgeTree }
export interface WaterTreeResult { expPoured:number; newTreePlanted:boolean; previousStage:string; tree:KnowledgeTree }

// ---------- Tóm tắt cuối truyện (ghi âm gửi bố mẹ, hỏi bố mẹ về từng tranh) ----------
/** Giới hạn của backend: ghi âm tối đa 3 MB, tối đa 5 câu hỏi mỗi phiên, câu gõ tối đa 200 ký tự. */
export const SUMMARY_MAX_BYTES = 3_000_000;
export const SUMMARY_MAX_QUESTIONS = 5;
export const SUMMARY_QUESTION_MAX_CHARS = 200;
export interface StorySummarySent { summaryId:number; message:string }
export interface StorySummaryQuestionSent { summaryId:number; questionId:number; message:string }
export interface StorySummaryAnswered { questionId:number; answeredAt:string|null }
/** Một câu con hỏi về một tranh; questionAudioUrl là link nghe có hạn 15 phút. */
export interface ParentSummaryFlag { questionId:number; beatOrder:number|null; pictureText:string|null; questionText:string|null; questionAudioUrl:string|null; askedAt:string; answeredAt:string|null; sceneId:number; sceneIndex:number; sceneText:string; illustrationUrl:string|null }
export interface ParentSummaryItem { summaryId:number; sessionId:number; storyId:number; title:string; createdAt:string; recordingUrl:string|null; recordingSentAt:string|null; flagsSentAt:string|null; unansweredCount:number; flags:ParentSummaryFlag[] }
export interface PagedParentSummaries { items:ParentSummaryItem[]; pageIndex:number; pageSize:number; totalCount:number; totalPages:number; hasNextPage:boolean; hasPreviousPage:boolean }

// ---------- Phụ huynh xem con đã đọc gì (/ParentReadingFeedback) ----------
export interface PagedReadingFeedback { items:ParentReadingFeedbackItem[]; pageIndex:number; pageSize:number; totalCount:number; totalPages:number; hasNextPage:boolean; hasPreviousPage:boolean }
export interface ParentConversationAnswer { question:string; kind:'Emotion'|'Opinion'|string; answerText:string; sceneIndex:number|null; answeredAt:string }
export interface ParentReadingFeedbackItem {
  sessionId:number; storyId:number; title:string; completedAt:string|null; feeling:ReadingFeeling|string|null; feelingLabel:string|null; quizTotalQuestions:number; quizBestPercent:number|null; conversationAnswers?:ParentConversationAnswer[];
  status: ParentFeedbackStatus;
  startedAt: string;
  timeSpentSeconds: number;
  pagesCompleted: number;
  totalPages: number;   // 0 = không rõ
  readCount: number;
  readOrdinal: number | null;
  laterCompleted: boolean;
  quizRunCount: number;
  quizLatestPercent: number | null;
  readAloud: ParentReadAloudSummary | null;
  /** Đoạn luyện đọc to sau truyện; null nếu bé chưa luyện. */
  readAloudPractice: ParentReadAloudPractice | null;
  /** Số bản ghi đọc to phụ huynh nghe được (lần gần nhất mỗi đoạn). */
  readAloudRecordingCount: number;
  /** 0–2 cảm xúc bé chọn sau khi đọc. */
  emotions?: StoryEmotion[];
  /** Cảnh yêu thích + bé có gửi lời hay không; null khi bé chưa chọn cảnh. */
  reflection: ParentReflectionBrief | null;
  expEarned: number;
  wordsCollected?: ParentCollectedWord[];   // optional để an toàn
  readingMode: 'ListenFirst' | 'ReadFirst' | null;
  retell: ParentRetellBrief | null;
}
export type ParentFeedbackStatus = 'Completed'|'Started'|'Reading'|'Activity'|'Abandoned'|'ForceExited';
export interface ParentReadAloudSummary { attempts:number; segmentsPracticed:number; goodWords:number; retryWords:number; totalWords:number; goodPercent:number }
export interface ParentReadAloudPractice { attempts:number; totalWords:number; latestGoodWords:number; latestGoodPercent:number; bestGoodPercent:number }
export type StoryEmotionCode = 'Happy'|'Funny'|'Surprised'|'Excited'|'Touched'|'Sad'|'Scared';
export interface StoryEmotion { code:StoryEmotionCode|string; label:string }
export interface ParentReflectionBrief { favoriteSceneId:number; favoriteSceneIndex:number|null; hasNoteText:boolean; hasNoteRecording:boolean }
/** Lần đọc gần nhất của một đoạn; audioUrl là link ký hết hạn sau 15 phút. sceneIndex null khi không còn tìm thấy trang. */
export interface ParentReadAloudRecording { recordingId:number; kind:'Segment'|'Practice'|string; segmentId:number|null; interactionId:number|null; sceneIndex:number|null; segmentOrder:number|null; text:string; goodCount:number; retryCount:number; skippedCount:number; totalCount:number; goodPercent:number; audioUrl:string; recordedAt:string }
export interface ParentReadAloudRecordings { sessionId:number; recordings:ParentReadAloudRecording[] }
/** illustrationUrl: tấm tranh bé đã thấy (link ký 15 phút), null khi cảnh không có tranh. */
export interface ParentFavoriteScene { sceneId:number; sceneIndex:number; sceneText:string; illustrationUrl:string|null }
/** Chưa có cảm nhận: emotions rỗng, các trường khác null. noteAudioUrl là link ký 15 phút. */
export interface ParentStoryReflection { sessionId:number; emotions:StoryEmotion[]; favoriteScene:ParentFavoriteScene|null; noteText:string|null; noteAudioUrl:string|null; noteSentAt:string|null }
export interface ParentCollectedWord { vocabularyId:number; term:string }
export interface ParentRetellBrief { summaryId:number; createdAt:string; hasRecording:boolean; flagCount:number; unansweredCount:number }
export interface ParentQuizRun { runNo:number; answered:number; correct:number; percent:number }
export interface ParentQuizQuestion { quizItemId:number; type:'MultipleChoice'|'TrueFalse'|'ShortAnswer'|string; question:string; choices:string[]; correctAnswer:string|null; explanation:string|null; latestAnswer:string|null; latestIsCorrect:boolean|null; timesAnswered:number; timesCorrect:number }
export interface ParentQuizDetail { sessionId:number; storyId:number; title:string; totalQuestions:number; runs:ParentQuizRun[]; questions:ParentQuizQuestion[] }
export interface ParentReadingOverview { from:string|null; to:string|null; completedSessions:number; distinctStoriesCompleted:number; unfinishedStories:number; totalTimeSpentSeconds:number; quizStoriesTaken:number; averageQuizBestPercent:number|null; feelingCounts:Record<'VeryLike'|'Like'|'Neutral'|'Dislike'|'None', number>; emotionCounts:Record<StoryEmotionCode, number>; expEarned:number; wordsCollected:number; readAloudGoodPercent:number|null; retellCount:number }
export type ReadingFeedbackFilter = { status: 'Completed' | 'Unfinished'; range: '7d' | '30d' | 'all' };
export interface ReadingSignal { shouldExit:boolean; returnTo:string|null; message:string|null; sessionStatus:string; readingTime?:ReadingTimeStatus|null }
export interface VocabularyDefinition { vocabularyId:number; term:string; definition:string; isCollected:boolean }
export interface NotebookEntry { entryId:number; vocabularyId:number; term:string; definition:string; storyId:number; storyTitle:string; sceneIndex:number|null; collectedAt:string }
export type ReadingEvent = 'PageCompleted'|'TtsStarted'|'TtsCompleted'|'LibrarySearched';
