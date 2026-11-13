import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '@/app/services/authService';
import { storyService } from '@/app/services/storyService';
import { creatorService } from '@/app/services/creatorService';

const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ success: status < 400, message: '', data }), { status });

let fetcher: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('token');
  vi.spyOn(authService, 'getStoredRefreshToken').mockReturnValue('token-refresh');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Community story ordering and view count contracts', () => {
  it('calls storyService.getCommunityStories with views order, descending and pageSize', async () => {
    fetcher.mockResolvedValue(response({ items: [], totalCount: 0, pageIndex: 1, pageSize: 10, totalPages: 0 }));
    await storyService.getCommunityStories({ orderBy: 'views', isDescending: true, pageSize: 10 });
    const url = String(fetcher.mock.calls[0][0]);
    expect(url).toContain('/Story/community');
    expect(url).toContain('orderBy=views');
    expect(url).toContain('isDescending=true');
    expect(url).toContain('pageSize=10');
  });

  it('calls storyService.getCommunityStories with favorites order', async () => {
    fetcher.mockResolvedValue(response({ items: [], totalCount: 0, pageIndex: 1, pageSize: 10, totalPages: 0 }));
    await storyService.getCommunityStories({ orderBy: 'favorites', isDescending: true, pageSize: 10 });
    const url = String(fetcher.mock.calls[0][0]);
    expect(url).toContain('orderBy=favorites');
  });

  it('omits orderBy from URL when not provided', async () => {
    fetcher.mockResolvedValue(response({ items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0 }));
    await storyService.getCommunityStories({ pageIndex: 1, pageSize: 100, isDescending: true });
    const url = String(fetcher.mock.calls[0][0]);
    expect(url).not.toContain('orderBy');
  });

  it('calls creatorService.creatorPublishedStories with path /creator/stories/published and orderBy=views', async () => {
    fetcher.mockResolvedValue(response({ items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0 }));
    await creatorService.creatorPublishedStories({ pageIndex: 1, pageSize: 100, orderBy: 'views', isDescending: true });
    const url = String(fetcher.mock.calls[0][0]);
    expect(url).toContain('/creator/stories/published');
    expect(url).toContain('orderBy=views');
  });

  it('returns data correctly matching viewCount and favoriteCount', async () => {
    const mockData = {
      items: [
        {
          id: 1,
          title: 'Truyện chú ếch con',
          synopsis: 'Câu chuyện vui',
          coverImageUrl: 'https://example.com/cover.jpg',
          authorName: 'Tác giả',
          publishedAt: '2026-11-13T00:00:00Z',
          viewCount: 5,
          favoriteCount: 2,
        },
      ],
      totalCount: 1,
      pageIndex: 1,
      pageSize: 10,
      totalPages: 1,
    };
    fetcher.mockResolvedValue(response(mockData));
    const r = await storyService.getCommunityStories({ orderBy: 'views', isDescending: true, pageSize: 10 });
    expect(r.data?.items[0].viewCount).toBe(5);
    expect(r.data?.items[0].favoriteCount).toBe(2);
  });
});
