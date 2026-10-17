import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { storyService } from '@/app/services/storyService';
import { existingStoryService } from '@/app/services/existingStoryService';
import { hasMissingLearning } from '@/app/features/story-workflow/storyReviewLearning';
import type { StoryReviewBundle } from '@/app/features/story-workflow/useStoryReview';

const okBody = (data: unknown = null) => new Response(JSON.stringify({ success: true, message: 'OK', data }));

afterEach(() => vi.restoreAllMocks());

describe('Luồng 2 — hợp đồng API', () => {
  it('danh sách truyện dùng đúng tên tham số của StoryFilterRequestDto', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody({ items: [], totalCount: 0, pageIndex: 1, pageSize: 100 }));
    await storyService.getStories({ authorUserId: 2, pageSize: 100, isDescending: true, searchTerm: 'Rùa' });
    const url = new URL(String(spy.mock.calls[0][0]));
    expect(url.pathname).toMatch(/\/Story$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({ authorUserId: '2', pageSize: '100', isDescending: 'true', searchTerm: 'Rùa' });
  });

  it('nhập truyện dán mặc định "learning" và luôn gửi tiếng Việt', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await existingStoryService.importStory({ inputMethod: 'paste', content: 'x'.repeat(60), childProfileId: 3, idempotencyKey: 'k-12345678' });
    expect(JSON.parse(String(spy.mock.calls[0][1]?.body))).toMatchObject({ outputMode: 'learning', language: 'vi', childProfileId: 3, inputMethod: 'paste' });
  });

  it('nhập từ tệp gửi multipart với đúng tên trường của ImportExistingStoryFileForm', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody({ storyId: 9, storyVersionId: 11, canProceed: true }));
    const file = new File(['Ngày xửa ngày xưa'], 'truyen.txt', { type: 'text/plain' });
    const r = await existingStoryService.importFile({ file, title: 'Rùa', childProfileId: 3, outputMode: 'reading_media_only', idempotencyKey: 'k-12345678' });
    expect(r.success).toBe(true);
    expect(String(spy.mock.calls[0][0])).toMatch(/\/stories\/import-file$/);
    const form = spy.mock.calls[0][1]?.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect((form.get('file') as File).name).toBe('truyen.txt');
    expect(Object.fromEntries([...form.entries()].filter(([k]) => k !== 'file'))).toEqual({
      title: 'Rùa', childProfileId: '3', language: 'vi', outputMode: 'reading_media_only', idempotencyKey: 'k-12345678',
    });
  });

  it('nhập từ tệp báo lỗi khi backend từ chối', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: false, message: 'Chỉ hỗ trợ file .txt hoặc .docx.', data: null }), { status: 400 }));
    const r = await existingStoryService.importFile({ file: new File(['a'], 'a.pdf'), childProfileId: 3, outputMode: 'learning', idempotencyKey: 'k-12345678' });
    expect(r).toMatchObject({ success: false, message: 'Chỉ hỗ trợ file .txt hoặc .docx.' });
  });

  it('truyện "Chỉ để đọc" không bị coi là thiếu học liệu', () => {
    const empty = { storyId: 1, versionId: 5, items: [] };
    const bundle = (outputMode: string) => ({ summary: { storyVersionId: 5, outputMode }, vocabulary: empty, quiz: empty, discussion: empty }) as unknown as StoryReviewBundle;
    expect(hasMissingLearning(bundle('reading_media_only'))).toBe(false);
    expect(hasMissingLearning(bundle('learning'))).toBe(true);
  });
});
