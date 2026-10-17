import type { ApiResponse } from '@/app/types/auth';
import type { PagedResult, StoryDto, StoryFilterRequest } from '@/app/types/story';
import { delay, ok } from './config';
import { db, MOCK_CHILDREN, MOCK_USER, type MockStory } from './mockDb';
import { mockStoryStatus } from './mockAiStory';

// Luồng 1 (tài khoản, hồ sơ bé, giám sát, truy cập của bé) luôn gọi API thật nên không có mock ở đây.

// ---------- Stories ----------
function toDto(s: MockStory): StoryDto {
  const status = mockStoryStatus(s);
  const paragraphs = s.content.split(/\n\s*\n/);
  return {
    id: s.id, title: s.title, synopsis: paragraphs[0], content: s.content, genre: s.genre, moralLesson: s.lesson,
    ageBand: db().children.find((c) => c.id === s.childId)?.ageBand ?? MOCK_CHILDREN.find((c) => c.id === s.childId)?.ageBand ?? 'Age_6_8', language: 'vi', source: s.source === 'manual' ? 'Manual' : 'AI', status,
    isPublished: status === 'ready', authorUserId: 1, authorName: MOCK_USER.fullName, createdAt: s.createdAt, childProfileId: s.childId,
    categoryName: s.genre, pages: paragraphs.map((content, i) => ({ id: s.id * 100 + i, pageNumber: i + 1, content })),
  };
}

const emptyPage = (items: StoryDto[], f?: StoryFilterRequest): PagedResult<StoryDto> => ({
  items, totalCount: items.length, pageNumber: f?.pageNumber ?? 1, pageSize: f?.pageSize ?? items.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false,
});

export const storyMockOverrides = {
  async getStories(filter?: StoryFilterRequest): Promise<ApiResponse<PagedResult<StoryDto>>> {
    await delay();
    const q = filter?.search?.toLowerCase();
    const items = db().stories
      .filter((s) => !s.archived && mockStoryStatus(s) !== 'input_accepted')
      .filter((s) => (filter?.childProfileId ? s.childId === filter.childProfileId : true))
      .map(toDto)
      .filter((s) => (filter?.status ? s.status === filter.status : true) && (q ? s.title.toLowerCase().includes(q) : true));
    return ok(emptyPage(items, filter));
  },
  async getStoryById(id: number): Promise<ApiResponse<StoryDto | null>> {
    await delay();
    const s = db().stories.find((x) => x.id === id);
    return s ? ok<StoryDto | null>(toDto(s)) : { success: false, message: 'Không tìm thấy truyện.', data: null };
  },
};
