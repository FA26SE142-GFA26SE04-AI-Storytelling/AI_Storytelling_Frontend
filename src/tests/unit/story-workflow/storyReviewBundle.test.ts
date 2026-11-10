import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { loadStoryReviewBundle } from '@/app/features/story-workflow/storyReviewBundle';

const ok = (data: unknown) => new Response(JSON.stringify({ success: true, message: '', data }), { status: 200 });
const summary = { storyId: 42, storyVersionId: 82, outputMode: 'learning', storyStatus: 'ContentReview' };
const part = { storyId: 42, versionId: 82, items: [] };
const listening = { ...part, required: false, reviewed: false, plan: [], issues: [] };

function server(overrides: Record<string, () => Response> = {}) {
  const routes: Record<string, () => Response> = {
    '/api/v1/stories/42/review': () => ok(summary),
    '/api/v1/stories/42/review/story': () => ok({ ...part, content: 'Bản thảo vẫn tồn tại.' }),
    '/api/v1/stories/42/review/vocabulary': () => ok(part),
    '/api/v1/stories/42/review/quiz': () => ok(part),
    '/api/v1/stories/42/review/listening': () => ok(listening),
    ...overrides,
  };
  return vi.spyOn(authService, 'authenticatedFetch').mockImplementation(async input =>
    routes[new URL(String(input)).pathname]?.() ?? new Response(null, { status: 404 }));
}
afterEach(() => vi.restoreAllMocks());

describe('review with current backend routes', () => {
  it('loads a valid draft when the retired discussion route returns 404', async () => {
    const http = server();
    const result = await loadStoryReviewBundle(42, new AbortController().signal);
    expect(result.story.content).toBe('Bản thảo vẫn tồn tại.');
    expect(result.listening).toEqual(listening);
    expect(http.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual(expect.arrayContaining([
      '/api/v1/stories/42/review/listening', '/api/v1/stories/42/review/quiz',
    ]));
    expect(http.mock.calls.some(([url]) => String(url).includes('/discussion'))).toBe(false);
  });
  it('does not call learning endpoints for reading-only stories', async () => {
    const http = server({ '/api/v1/stories/42/review': () => ok({ ...summary, outputMode: 'reading_media_only' }) });
    const result = await loadStoryReviewBundle(42, new AbortController().signal);
    expect(result.listening).toBeNull();
    expect(http).toHaveBeenCalledTimes(2);
  });
  it('does not hide a real missing interaction package', async () => {
    server({ '/api/v1/stories/42/review/listening': () => new Response(null, { status: 404 }) });
    await expect(loadStoryReviewBundle(42, new AbortController().signal)).rejects.toThrow('gói tương tác');
  });
  it('rejects mixed versions rather than rendering stale learning', async () => {
    server({ '/api/v1/stories/42/review/listening': () => ok({ ...listening, versionId: 81 }) });
    await expect(loadStoryReviewBundle(42, new AbortController().signal)).rejects.toThrow('Bản thảo đã thay đổi');
  });
  it('rejects an incomplete interaction success payload', async () => {
    server({ '/api/v1/stories/42/review/listening': () => ok({ ...part }) });
    await expect(loadStoryReviewBundle(42, new AbortController().signal)).rejects.toThrow('chưa đầy đủ');
  });
  it('rejects an aborted load before exposing a draft', async () => {
    server(); const controller = new AbortController(); controller.abort();
    await expect(loadStoryReviewBundle(42, controller.signal)).rejects.toHaveProperty('name', 'AbortError');
  });
  it.each([
    { storyId: 42, versionId: 82, status: 'Approved', confirmedAt: '2026-11-04T00:00:00Z' },
    { storyId: 42, versionId: 82, status: 'MediaProcessing', confirmedAt: '2026-11-04T00:00:00Z' },
    { storyId: 42, storyStatus: 'OutlineReview', currentStep: 'pending_content', isComplete: false },
  ])('accepts confirmation or repair queued by the package endpoint', async data => {
    const http = server({ '/api/v1/stories/42/review/confirm-package': () => ok(data) });
    const input = { versionId: 82, operationId: 'confirm-review-retry-01' };
    const response = await api.confirmPackage(42, input);
    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(http.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(input) });
    expect(http).toHaveBeenCalledTimes(1);
  });
});
