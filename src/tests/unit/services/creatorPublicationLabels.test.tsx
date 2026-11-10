import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { authService } from '@/app/services/authService';
import { creatorPublicationService } from '@/app/services/creatorPublicationService';
import { childProfileService } from '@/app/services/childProfileService';
import { activePublicationLabelIds, creatorLabelSubmission } from '@/app/features/story-workflow/useCreatorPublicationLabels';
import type { CreatorPublicationStatus } from '@/app/types/backendContracts';
import CreatorPublicationLabels from '@/app/features/staff/CreatorPublicationLabels';

const categories = [
  { id: 1, code: 'ANIMALS', displayName: 'Động vật', isActive: true },
  { id: 5, code: 'FRIENDSHIP', displayName: 'Tình bạn', isActive: true },
  { id: 8, code: 'OLD', displayName: 'Nhãn cũ', isActive: false },
];
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, message: '', data: {} }), { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('creator-fixture');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Creator labels for public story submission', () => {
  const returned: CreatorPublicationStatus = { storyId: 48, versionId: 97, isPublished: false, reviewStatus: 'ChangesRequested',
    openItemId: null, openItemType: null, openItemStatus: null, canResubmitLabels: true,
    lastProposedLabels: [{ contentCategoryId: 1, code: 'ANIMALS', displayName: 'Động vật', source: 'Creator' }] };
  it('allows metadata-only resubmission on the same version and detects actual label changes', () => {
    expect(creatorLabelSubmission(returned, true, [5])).toEqual({ labelsOnly: true, canSubmit: true, labelsChanged: true });
    expect(creatorLabelSubmission(returned, true, [1, 1]).labelsChanged).toBe(false);
  });
  it('keeps content returns, pending reviews, published stories and unfinished media blocked', () => {
    expect(creatorLabelSubmission({ ...returned, canResubmitLabels: false }, true, [5]).canSubmit).toBe(false);
    expect(creatorLabelSubmission({ ...returned, canResubmitLabels: undefined }, true, [5]).canSubmit).toBe(false);
    expect(creatorLabelSubmission({ ...returned, openItemId: 18 }, true, [5]).canSubmit).toBe(false);
    expect(creatorLabelSubmission({ ...returned, isPublished: true }, true, [5]).canSubmit).toBe(false);
    expect(creatorLabelSubmission({ ...returned, reviewStatus: 'Rejected' }, true, [5]).canSubmit).toBe(false);
    expect(creatorLabelSubmission(returned, false, [5]).canSubmit).toBe(false);
  });
  it('loads the shared category catalog and carries the cancellation signal', async () => {
    const controller = new AbortController();
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, message: '', data: categories })));
    const response = await childProfileService.getContentCategories(controller.signal);
    expect(response.data).toEqual(categories);
    expect(fetcher.mock.calls[0][0]).toMatch(/\/ContentCategory$/);
    expect(fetcher.mock.calls[0][1].signal).toBe(controller.signal);
  });
  it('sends selected IDs with the exact story version and removes duplicate IDs', async () => {
    await creatorPublicationService.submit(47, 94, [1, 5, 1]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toMatch(/\/PublicStorySubmission\/submit$/);
    expect(fetcher.mock.calls[0][1].method).toBe('POST');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ storyId: 47, storyVersionId: 94, contentCategoryIds: [1, 5] });
  });
  it.each([[], [0], [-1], [1.5], [NaN]].map(ids => ({ ids })))('does not submit missing or invalid labels: $ids', async ({ ids }) => {
    const response = await creatorPublicationService.submit(47, 94, ids);
    expect(response.success).toBe(false); expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('keeps the backend rejection if a label was retired after loading', async () => {
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ success: false, message: 'Nhãn không tồn tại hoặc không còn hoạt động: 5.', data: null }), { status: 400 }));
    const response = await creatorPublicationService.submit(47, 94, [5]);
    expect(response.success).toBe(false); expect(response.message).toContain('không còn hoạt động');
  });
  it('preserves valid previous labels without inventing a selection when none was chosen', () => {
    expect(activePublicationLabelIds([8, 1, 1, 99, 5], categories)).toEqual([1, 5]);
    expect(activePublicationLabelIds([], categories)).toEqual([]);
    expect(activePublicationLabelIds([8, 99], categories)).toEqual([]);
  });
  it('shows selected label names and an actionable error or empty catalog', () => {
    const props = { categories: categories.filter(c => c.isActive), selectedIds: [5], loading: false, error: '', disabled: false, onChange: () => {}, onReload: () => {} };
    const html = renderToStaticMarkup(<CreatorPublicationLabels {...props}/>);
    expect(html).toContain('Tình bạn'); expect(html).toContain('Thay đổi nhãn');
    expect(html).not.toContain('Nhãn cũ');
    const error = renderToStaticMarkup(<CreatorPublicationLabels {...props} categories={[]} error="Không tải được danh mục."/>);
    expect(error).toContain('role="alert"'); expect(error).toContain('Tải lại nhãn');
    const empty = renderToStaticMarkup(<CreatorPublicationLabels {...props} categories={[]} selectedIds={[]}/>);
    expect(empty).toContain('Chưa có nhãn đang hoạt động');
  });
});
