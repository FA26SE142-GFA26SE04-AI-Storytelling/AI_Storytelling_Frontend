import { afterEach, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { creatorPublicationService } from '@/app/services/creatorPublicationService';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('withdraws the review item and resubmits the same story version without generation requests', async () => {
  vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('creator-fixture');
  const fetcher = vi.fn().mockImplementation((url: string) => Promise.resolve(new Response(JSON.stringify({ success: true, message: '', data:
    url.endsWith('/publication') ? { storyId: 48, versionId: 97, reviewStatus: 'None', canResubmitWithdrawn: true, lastProposedLabels: [{ contentCategoryId: 1 }] } : {} }))));
  vi.stubGlobal('fetch', fetcher);
  await creatorPublicationService.withdraw(18);
  const status = await creatorPublicationService.status(48);
  expect(status.data?.canResubmitWithdrawn).toBe(true);
  await creatorPublicationService.submit(48, status.data!.versionId, [1]);
  expect(fetcher.mock.calls.map(call => new URL(call[0]).pathname)).toEqual([
    '/api/v1/PublicStorySubmission/18/withdraw', '/api/v1/creator/stories/48/publication', '/api/v1/PublicStorySubmission/submit',
  ]);
  expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({ storyId: 48, storyVersionId: 97, contentCategoryIds: [1] });
});

it('keeps a claim conflict visible instead of treating it as a successful withdrawal', async () => {
  vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('creator-fixture');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, message: 'Mục đã có người nhận.', data: null }), { status: 409 }));
  vi.stubGlobal('fetch', fetcher);
  const response = await creatorPublicationService.withdraw(18);
  expect(response.success).toBe(false);
  expect(response.status).toBe(409);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
