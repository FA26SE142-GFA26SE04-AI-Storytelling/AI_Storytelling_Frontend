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
    expect(html).toContain('Asset #42');
    expect(html).toContain('<button');
  });
  it('distinguishes queued and processing retries from terminal failures', () => {
    expect(mediaIssueMessage({ ...issue, status: 'Pending' })).toContain('tự thử lại');
    expect(mediaIssueMessage({ ...issue, status: 'Processing' })).toContain('Đang xử lý lại');
    expect(mediaIssueLabel({ ...issue, type: 'TtsAudio', itemNumber: 1 })).toBe('Cảnh 2 · Giọng đọc đoạn 1');
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
  it('explains when the API cannot identify a scene instead of guessing one', () => {
    const html = renderToStaticMarkup(<MediaIssues progress={{ ...progress, issues: [] }}/>);
    expect(html).toContain('chưa thể xác định cảnh');
    expect(html).not.toContain('Cảnh 1');
  });
});
