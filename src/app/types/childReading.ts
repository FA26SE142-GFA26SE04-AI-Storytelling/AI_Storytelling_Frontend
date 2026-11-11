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
export interface ReadingContent { sessionId:number; storyId:number; title:string; lesson:string|null; listenOnly:boolean; scenes:ReadingScene[]; vocabulary:{id:number; term:string}[] }
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

// ---------- Tóm tắt cuối truyện (ghi âm gửi bố mẹ, đánh dấu chỗ còn thắc mắc) ----------
/** Giới hạn của backend: ghi âm tối đa 3 MB, đánh dấu tối đa 5 cảnh. */
export const SUMMARY_MAX_BYTES = 3_000_000;
export const SUMMARY_MAX_FLAGS = 5;
export interface StorySummarySent { summaryId:number; message:string }
export interface ParentSummaryFlag { sceneId:number; sceneIndex:number; sceneText:string; illustrationUrl:string|null }
export interface ParentSummaryItem { summaryId:number; sessionId:number; storyId:number; title:string; createdAt:string; recordingUrl:string|null; recordingSentAt:string|null; flagsSentAt:string|null; flags:ParentSummaryFlag[] }
export interface PagedParentSummaries { items:ParentSummaryItem[]; pageIndex:number; pageSize:number; totalCount:number; totalPages:number; hasNextPage:boolean; hasPreviousPage:boolean }

// ---------- Phụ huynh xem con đã đọc gì (/ParentReadingFeedback) ----------
export interface PagedReadingFeedback { items:ParentReadingFeedbackItem[]; pageIndex:number; pageSize:number; totalCount:number; totalPages:number; hasNextPage:boolean; hasPreviousPage:boolean }
export interface ParentConversationAnswer { question:string; kind:'Emotion'|'Opinion'|string; answerText:string; sceneIndex:number|null; answeredAt:string }
export interface ParentReadingFeedbackItem { sessionId:number; storyId:number; title:string; completedAt:string|null; feeling:ReadingFeeling|string|null; feelingLabel:string|null; quizTotalQuestions:number; quizBestPercent:number|null; conversationAnswers?:ParentConversationAnswer[] }
export interface ReadingSignal { shouldExit:boolean; returnTo:string|null; message:string|null; sessionStatus:string }
export interface VocabularyDefinition { vocabularyId:number; term:string; definition:string; isCollected:boolean }
export interface NotebookEntry { entryId:number; vocabularyId:number; term:string; definition:string; storyId:number; storyTitle:string; sceneIndex:number|null; collectedAt:string }
export type ReadingEvent = 'PageCompleted'|'TtsStarted'|'TtsCompleted'|'LibrarySearched';
