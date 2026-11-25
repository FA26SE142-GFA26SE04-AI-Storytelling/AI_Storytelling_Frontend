import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { StoryMediaPackage } from '@/app/types/aiStory';
import StudioScenePreview from '@/app/features/studio/StudioScenePreview';

type Scene = StoryMediaPackage['scenes'][number];
const scene = (imageStatus: string, audioStatus = 'Ready', imageUrl: string | null = null) => ({
  sceneId: 113, sceneIndex: 3, text: 'Nụ cười rực rỡ',
  illustrations: [{ beatId: 228, beatOrder: 0, assetId: 653, status: imageStatus, url: imageUrl }],
  audio: [{ segmentId: 111, segmentOrder: 0, assetId: 655, status: audioStatus, url: null }],
}) as unknown as Scene;
const actions = { busy: false, locked: false, replacements: [], regenerate: () => {}, keepCurrent: () => {} };
const render = (s: Scene, generating: boolean) => renderToStaticMarkup(
  <StudioScenePreview scene={s} text="" loading={false} onReload={() => {}} actions={actions} generating={generating}/>);

describe('StudioScenePreview per-item media state', () => {
  it('shows a failed illustration as failed while the rest of the package is still generating', () => {
    const html = render(scene('Failed'), true);
    expect(html).toContain('Chưa vẽ được tranh này');
    expect(html).not.toContain('Đang vẽ tranh');
    expect(html).toContain('Có thể thử lại sau khi hệ thống tạo xong các mục còn lại.');
  });
  it('still shows the drawing state for illustrations that are only waiting', () => {
    const html = render(scene('Processing'), true);
    expect(html).toContain('Đang vẽ tranh');
    expect(html).not.toContain('Chưa vẽ được tranh này');
  });
  it('sends stopped illustrations to package retry, not to regenerate (backend only regenerates Ready assets)', () => {
    const html = render(scene('ManualReview'), false);
    expect(html).toContain('Chưa vẽ được tranh này');
    expect(html).toContain('Bấm &quot;Thử lại&quot; để AI vẽ lại tranh này.');
    expect(html).not.toContain('tranh này bằng AI');
  });
  it('offers regenerate for ready illustrations, locked while a media job is still running', () => {
    expect(render(scene('Ready', 'Ready', 'https://x/a.png'), false))
      .not.toMatch(/<button[^>]*disabled=""[^>]*aria-label="Tạo lại tranh này bằng AI"/);
    expect(render(scene('Ready', 'Ready', 'https://x/a.png'), true))
      .toMatch(/<button[^>]*disabled=""[^>]*aria-label="Có thể tạo lại tranh này sau khi hệ thống tạo xong các mục còn lại"/);
  });
  it('shows a failed audio segment as failed instead of still generating', () => {
    const html = render(scene('Ready', 'Failed'), true);
    expect(html).toContain('Chưa tạo được giọng đọc đoạn này.');
    expect(html).not.toContain('giọng đọc đoạn này bằng AI');
  });
});
