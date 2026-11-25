import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { MediaGenerationIssue, MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';
import { mediaIssueLabel, mediaIssueMessage, mediaIssuesOf } from '@/app/features/story-workflow/mediaIssues';
import MediaIssues from '@/app/features/studio/MediaIssues';

const issue: MediaGenerationIssue = { sceneId: 12, sceneIndex: 1, assetId: 42, type: 'Illustration', targetId: 7,
  itemNumber: 2, status: 'Failed', errorCode: 'MEDIA_PROVIDER_TIMEOUT', attemptCount: 3, nextRetryAt: null };
const progress = { storyId: 33, approvedStoryVersionId: 49, packageRevision: 1, errorCode: 'MEDIA_PROVIDER_TIMEOUT', issues: [issue] } as MediaProgressDto;
const pack = { storyId: 33, storyVersionId: 49, packageRevision: 1, scenes: [{ sceneId: 12, sceneIndex: 1,
  illustrations: [{ beatId: 7, beatOrder: 1, assetId: 42, status: 'Failed' }],
  audio: [{ segmentId: 8, segmentOrder: 0, assetId: 43, status: 'Failed' }],
}] } as StoryMediaPackage;

describe('Media diagnostics tied to backend scene and asset IDs', () => {
  it('renders scene, picture number, actionable navigation and timeout explanation', () => {
    expect(mediaIssueLabel(issue)).toBe('Cảnh 2 · Tranh 2');
    const html = renderToStaticMarkup(<MediaIssues progress={progress} onSelectScene={() => {}}/>);
    expect(html).toContain('Cảnh 2 · Tranh 2');
    expect(html).toContain('Xử lý quá thời gian chờ.');
    expect(html).toContain('Dịch vụ AI phản hồi quá chậm.');
    expect(html).not.toContain('MEDIA_PROVIDER_TIMEOUT');
    expect(html).not.toContain('Asset #42');
    expect(html).toContain('<button');
  });
  it('distinguishes queued and processing retries from terminal failures', () => {
    expect(mediaIssueMessage({ ...issue, status: 'Pending' })).toContain('tự thử lại');
    expect(mediaIssueMessage({ ...issue, status: 'Processing' })).toContain('Đang xử lý lại');
    expect(mediaIssueLabel({ ...issue, type: 'TtsAudio', itemNumber: 1 })).toBe('Cảnh 2 · Giọng đọc đoạn 1');
  });
  it('distinguishes storage failures from AI quotas and audio validation', () => {
    const failed = { ...issue, status: 'Failed', type: 'TtsAudio' as const };
    expect(mediaIssueMessage({ ...failed, errorCode: 'MEDIA_STORAGE_UPLOAD_RATE_LIMITED' }))
      .toBe('Kho media đang giới hạn lượt tải lên.');
    expect(mediaIssueMessage({ ...failed, errorCode: 'GEMINI_TTS_HTTP_429' }))
      .toBe('Dịch vụ AI đang giới hạn lượt yêu cầu.');
    expect(mediaIssueMessage({ ...failed, errorCode: 'AUDIO_QUALITY_GATE_FAILED' }))
      .toBe('Giọng đọc không đạt kiểm tra chất lượng.');
  });
  it('shows manual review even when the API returns a generic generation error', () => {
    expect(mediaIssueMessage({ ...issue, status: 'ManualReview', errorCode: 'IMAGE_GENERATION_FAILED' }))
      .toBe('Cần kiểm tra thủ công trước khi sử dụng.');
  });
  it('uses failed package assets only for older servers and does not invent individual error codes', () => {
    const old = { ...progress, issues: undefined };
    expect(mediaIssuesOf(old, pack).map(x => [x.type, x.itemNumber, x.errorCode])).toEqual([
      ['Illustration', 1, 'MEDIA_ITEM_INCOMPLETE'], ['TtsAudio', 1, 'MEDIA_ITEM_INCOMPLETE'],
    ]);
    expect(mediaIssuesOf(old, { ...pack, packageRevision: 2 })).toEqual([]);
    expect(mediaIssuesOf(old, { ...pack, storyVersionId: 50 })).toEqual([]);
    expect(mediaIssuesOf({ ...progress, issues: [] }, pack)).toEqual([]);
  });
  it('does not show old errors after media is generated or ready', () => {
    expect(mediaIssuesOf({ ...progress, isGenerated: true }, pack)).toEqual([]);
    expect(renderToStaticMarkup(<MediaIssues progress={{ ...progress, isReady: true }}/>)).toBe('');
  });
  it('explains illustrations rejected for containing text after retries are exhausted', () => {
    expect(mediaIssueMessage({ ...issue, errorCode: 'ILLUSTRATION_RETRY_EXHAUSTED' }))
      .toBe('AI đã vẽ lại nhiều lần nhưng tranh vẫn chưa đạt.');
    expect(mediaIssueMessage({ ...issue, status: 'ManualReview', errorCode: 'ILLUSTRATION_CONTAINS_TEXT' }))
      .toBe('Tranh AI vẽ có chữ nên không dùng được. Hãy tạo lại mục này.');
    expect(mediaIssueMessage({ ...issue, errorCode: 'SOMETHING_NEW' })).toBe('Chưa vẽ được tranh này.');
  });
  it('offers package retry for stopped items, locked with a reason while other media is still generating', () => {
    const exhausted = { ...progress, issues: [{ ...issue, errorCode: 'ILLUSTRATION_RETRY_EXHAUSTED' }] };
    const open = renderToStaticMarkup(<MediaIssues progress={exhausted} retry={{ run: () => {}, disabled: false, blockedReason: null }}/>);
    expect(open).toContain('Vẽ lại tranh lỗi');
    expect(open).not.toMatch(/<button[^>]*disabled=""[^>]*><svg[^]*?<\/svg>Vẽ lại tranh lỗi/);
    const reason = 'Có thể thử lại sau khi hệ thống tạo xong các mục còn lại.';
    const blocked = renderToStaticMarkup(<MediaIssues progress={exhausted} retry={{ run: () => {}, disabled: false, blockedReason: reason }}/>);
    expect(blocked).toMatch(/<button[^>]*disabled=""[^>]*><svg[^]*?<\/svg>Vẽ lại tranh lỗi/);
    expect(blocked).toContain(reason);
    const mixed = renderToStaticMarkup(<MediaIssues progress={{ ...progress, issues: [{ ...issue, errorCode: 'X' }, { ...issue, assetId: 43, type: 'TtsAudio', errorCode: 'X' }] }} retry={{ run: () => {}, disabled: false, blockedReason: null }}/>);
    expect(mixed).toContain('Thử lại mục lỗi');
    const waiting = renderToStaticMarkup(<MediaIssues progress={{ ...progress, issues: [{ ...issue, status: 'Pending' }] }} retry={{ run: () => {}, disabled: false, blockedReason: null }}/>);
    expect(waiting).not.toContain('Vẽ lại tranh lỗi');
  });
  it('explains when the API cannot identify a scene instead of guessing one', () => {
    const html = renderToStaticMarkup(<MediaIssues progress={{ ...progress, issues: [] }}/>);
    expect(html).toContain('chưa thể xác định cảnh');
    expect(html).not.toContain('Cảnh 1');
  });
});
