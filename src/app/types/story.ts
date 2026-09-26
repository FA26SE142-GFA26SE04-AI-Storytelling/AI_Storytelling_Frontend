export interface StoryPageDto {
  id?: number;
  pageNumber: number;
  content: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

export interface StoryDto {
  id: number;
  title: string;
  description?: string | null;
  synopsis?: string | null;
  content?: string | null;
  coverImageUrl?: string | null;
  genre?: string | null;
  moralLesson?: string | null;
  ageBand: string;
  language?: string;
  source?: string;
  status: string;
  isPublished: boolean;
  authorUserId?: number;
  authorId?: number;
  authorName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
  childProfileId?: number | null;
  childNickname?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  pages?: StoryPageDto[];
  totalViews?: number;
  averageRating?: number;
}

export interface StoryFilterRequest {
  search?: string;
  ageBand?: string;
  categoryId?: number;
  status?: string;
  childProfileId?: number;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateStoryRequest {
  title: string;
  synopsis?: string;
  content?: string;
  coverImageUrl?: string;
  ageBand: string;
  categoryId?: number;
  childProfileId?: number;
  pages?: {
    pageNumber: number;
    content: string;
    imageUrl?: string;
    audioUrl?: string;
  }[];
}

export interface UpdateStoryRequest {
  title: string;
  synopsis?: string;
  content?: string;
  coverImageUrl?: string;
  ageBand: string;
  categoryId?: number;
  pages?: {
    pageNumber: number;
    content: string;
    imageUrl?: string;
    audioUrl?: string;
  }[];
}

export interface ImportStoryRequestDto {
  title: string;
  content: string;
  childProfileId: number;
  language?: string;
  idempotencyKey?: string;
}

export interface ImportStoryResponseDto {
  storyId: number;
  storyVersionId: number;
  status: string;
  message?: string;
}

export interface ExistingStoryEvaluationDto {
  storyId: number;
  storyVersionId: number;
  decision: number; // 1 = Suitable, 2 = NeedsAdaptation, 3 = Blocked
  decisionText: string;
  safetyScore: number;
  feedbackNotes?: string;
  flaggedCategories?: string[];
}

export interface AdaptExistingStoryRequestDto {
  storyId: number;
  storyVersionId: number;
  adaptationPrompt?: string;
  readingLevel?: number;
}

export interface ManualEditRequestDto {
  storyId: number;
  storyVersionId: number;
  content: string;
  title?: string;
}

export interface KeepOriginalRequestDto {
  storyId: number;
  storyVersionId: number;
}

export interface ArchiveExistingStoryRequestDto {
  storyId: number;
  storyVersionId: number;
  reason?: string;
}

export interface VersionMutationResponseDto {
  storyId: number;
  storyVersionId: number;
  versionNumber: number;
  status: string;
  decision?: string;
  message?: string;
}
