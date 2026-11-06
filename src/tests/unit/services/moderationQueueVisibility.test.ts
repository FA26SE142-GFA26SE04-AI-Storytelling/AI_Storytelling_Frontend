import { afterEach, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { staffService } from '@/app/services/staffService';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('loads the second queue page without losing story identity or pagination', async () => {
  vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('moderator-fixture');
  const data = { items: [{ id: 18, storyId: 48, storyVersionId: 97, storyTitle: 'Ngọn Đèn Dũng Cảm Của Titi', itemType: 'PublicStoryReview', status: 'Pending' }],
    totalCount: 7, totalPages: 2, pageIndex: 2, pageSize: 6, hasNextPage: false, hasPreviousPage: true };
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, message: '', data })));
  vi.stubGlobal('fetch', fetcher);
  const response = await staffService.queue({ status: 'Pending', pageIndex: 2, pageSize: 6 });
  const url = new URL(fetcher.mock.calls[0][0]);
  expect(url.pathname).toMatch(/\/ModerationQueue$/);
  expect(Object.fromEntries(url.searchParams)).toEqual({ status: 'Pending', pageIndex: '2', pageSize: '6' });
  expect(response.data).toEqual(data);
});

it('filters Creator submissions through the existing public review queue', async () => {
  vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('moderator-fixture');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, message: '', data: { items: [] } })));
  vi.stubGlobal('fetch', fetcher);
  await staffService.queue({ status: 'Pending', itemType: 'PublicStoryReview', pageIndex: 1, pageSize: 6 });
  const url = new URL(fetcher.mock.calls[0][0]);
  expect(url.searchParams.get('itemType')).toBe('PublicStoryReview');
  expect(url.searchParams.get('status')).toBe('Pending');
  expect(url.searchParams.get('pageIndex')).toBe('1');
});
