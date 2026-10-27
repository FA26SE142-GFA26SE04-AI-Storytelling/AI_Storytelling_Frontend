export interface ChildStory { storyId:number; title:string; coverImageUrl:string|null; description:string|null; source:string }
export interface ChildStoryPage { isLocked:boolean; unlockStoryId:number|null; message:string|null; items:ChildStory[]; totalCount:number; pageIndex:number; pageSize:number }
export interface ReadingStart { storyId?:number; communitySubmissionId?:number }
export interface ReadingFlags { isBookmarked:boolean; isFavorited:boolean }
export interface ReadingStarted extends ReadingFlags { sessionId:number; storyId:number; resumed:boolean; lastPage:number; lastReadingMode:string|null }
export interface ReadingScene { sceneIndex:number; text:string; illustrationUrl:string|null; segments:{segmentOrder:number; text:string; audioUrl:string|null; wordTimingsJson:string|null}[] }
export interface ReadingContent { sessionId:number; storyId:number; title:string; lesson:string|null; scenes:ReadingScene[]; vocabulary:{id:number; term:string}[] }
export type ReadingMode = 'ReadFirst'|'ListenFirst';
export interface ReadingProgress { sessionId:number; page:number; readingMode:string|null; timeSpentSeconds:number }
export interface ReadingCompleted { sessionId:number; storyId:number; isRetake:boolean; roadmapStepCompleted:boolean }
export interface ReadingSignal { shouldExit:boolean; returnTo:string|null; message:string|null; sessionStatus:string }
export interface VocabularyDefinition { vocabularyId:number; term:string; definition:string; isCollected:boolean }
export interface NotebookEntry { entryId:number; vocabularyId:number; term:string; definition:string; storyId:number; storyTitle:string; sceneIndex:number|null; collectedAt:string }
export type ReadingEvent = 'PageCompleted'|'TtsStarted'|'TtsCompleted'|'LibrarySearched';
