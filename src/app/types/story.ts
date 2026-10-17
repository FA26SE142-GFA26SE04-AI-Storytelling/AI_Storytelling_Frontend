/** Chế độ đầu ra của truyện: kèm học liệu, hoặc chỉ để đọc (không tạo từ vựng / câu đố / thảo luận). */
export type StoryOutputMode = 'learning' | 'reading_media_only';

/** Theo `StoryDto` của backend (`GET /Story`, `GET /Story/{id}`). */
export interface StoryDto {
  id: number;
  title: string;
  description?: string | null;
  content?: string | null;
  coverImageUrl?: string | null;
  genre?: string | null;
  moralLesson?: string | null;
  ageBand: string;
  language?: string;
  source?: string;
  outputMode?: StoryOutputMode | string;
  status: string;
  isPublished: boolean;
  authorUserId?: number;
  authorName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/** Theo `StoryFilterRequestDto` của backend. Backend chưa lọc được theo hồ sơ bé. */
export interface StoryFilterRequest {
  searchTerm?: string;
  genre?: string;
  ageBand?: string;
  status?: string;
  isPublished?: boolean;
  authorUserId?: number;
  isDescending?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
