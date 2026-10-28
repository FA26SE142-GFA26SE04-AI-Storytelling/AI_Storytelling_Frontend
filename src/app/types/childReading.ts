export interface ChildStory { storyId:number; title:string; coverImageUrl:string|null; description:string|null; source:string }
export interface ChildStoryPage { isLocked:boolean; unlockStoryId:number|null; message:string|null; items:ChildStory[]; totalCount:number; pageIndex:number; pageSize:number }
export interface ReadingStart { storyId?:number; communitySubmissionId?:number }
export interface ReadingFlags { isBookmarked:boolean; isFavorited:boolean }
export interface ReadingStarted extends ReadingFlags { sessionId:number; storyId:number; resumed:boolean; lastPage:number; lastReadingMode:string|null }
export interface ReadingScene { sceneIndex:number; text:string; illustrationUrl:string|null; segments:{segmentOrder:number; text:string; audioUrl:string|null; wordTimingsJson:string|null}[] }
export interface ReadingContent { sessionId:number; storyId:number; title:string; lesson:string|null; scenes:ReadingScene[]; vocabulary:{id:number; term:string}[] }
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
export interface ChildRewards { expTotal:number; streakDays:number; badges:ChildBadge[] }

// ---------- Phụ huynh xem con đã đọc gì (/ParentReadingFeedback) ----------
export interface PagedReadingFeedback { items:ParentReadingFeedbackItem[]; pageIndex:number; pageSize:number; totalCount:number; totalPages:number; hasNextPage:boolean; hasPreviousPage:boolean }
export interface ParentReadingFeedbackItem { sessionId:number; storyId:number; title:string; completedAt:string|null; feeling:ReadingFeeling|string|null; feelingLabel:string|null; quizTotalQuestions:number; quizBestPercent:number|null }
export interface ReadingSignal { shouldExit:boolean; returnTo:string|null; message:string|null; sessionStatus:string }
export interface VocabularyDefinition { vocabularyId:number; term:string; definition:string; isCollected:boolean }
export interface NotebookEntry { entryId:number; vocabularyId:number; term:string; definition:string; storyId:number; storyTitle:string; sceneIndex:number|null; collectedAt:string }
export type ReadingEvent = 'PageCompleted'|'TtsStarted'|'TtsCompleted'|'LibrarySearched';
