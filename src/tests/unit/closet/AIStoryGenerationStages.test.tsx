import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AIStoryGenerationStages } from '../../../app/components/closet/subcomponents/AIStoryGenerationStages';
import { ContentGenerationProgressDto } from '../../../app/types/aiStory';

const progress: ContentGenerationProgressDto = {
  storyId: 1, storyStatus: 'outline_review', currentStep: 'generating_content', content: 'processing',
  vocabulary: 'not_started', quiz: 'not_started', discussion: 'not_started', isComplete: false,
  stableStoryVersionId: null, lastErrorCode: null, qualityFailure: null,
};
const render = (data: ContentGenerationProgressDto | null, isRetrying = false) => renderToStaticMarkup(
  <AIStoryGenerationStages progress={data} isRetrying={isRetrying} />,
);

describe('content first, learning second UI', () => {
  it('shows only content work before learning can begin', () => {
    const html = render(progress);
    expect(html).toContain('Đang viết và kiểm tra nội dung câu chuyện');
    expect(html).toContain('Chờ câu chuyện hoàn tất');
    expect(html).not.toContain('1. Từ vựng');
    expect(html).not.toContain('2. Câu đố');
    expect(html).not.toContain('3. Trò chuyện');
  });
  it('does not imply work is continuing when content failed', () => {
    const html = render({ ...progress, content: 'failed', currentStep: 'failed_content' });
    expect(html).toContain('Chưa thể hoàn tất nội dung câu chuyện');
    expect(html).not.toContain('Đang viết và kiểm tra nội dung câu chuyện');
    expect(html).not.toContain('1. Từ vựng');
  });
  it('shows learning only after stable content, with sequential waiting labels', () => {
    const html = render({ ...progress, content: 'stable', stableStoryVersionId: 5, currentStep: 'generating_vocabulary', vocabulary: 'processing' });
    expect(html).toContain('Đang tạo học liệu từ câu chuyện');
    expect(html).toContain('Nội dung câu chuyện đã hoàn tất và vượt qua kiểm tra.');
    expect(html).toContain('1. Từ vựng');
    expect(html).toContain('Chờ từ vựng hoàn tất');
    expect(html).toContain('Chờ câu đố hoàn tất');
  });
  it('keeps content successful when learning fails', () => {
    const html = render({ ...progress, content: 'stable', stableStoryVersionId: 5, vocabulary: 'failed', currentStep: 'failed_vocabulary' });
    expect(html).toContain('Chưa thể hoàn tất học liệu');
    expect(html).toContain('Nội dung câu chuyện đã hoàn tất và vượt qua kiểm tra.');
    expect(html).not.toContain('Chưa thể hoàn tất nội dung câu chuyện');
  });
  it('shows completion only after the backend confirms the package', () => {
    const html = render({ ...progress, content: 'stable', stableStoryVersionId: 5, vocabulary: 'completed', quiz: 'completed', discussion: 'completed', storyStatus: 'content_review', isComplete: true });
    expect(html).toContain('Câu chuyện và học liệu đã sẵn sàng');
    expect(html).not.toContain('Đang tạo học liệu từ câu chuyện');
  });
  it('does not mark a stopped workflow as actively generating', () => {
    const html = render({ ...progress, storyStatus: 'Archived' });
    expect(html).toContain('Quá trình sáng tác đã dừng');
    expect(html).not.toContain('Đang viết và kiểm tra nội dung câu chuyện');
  });
  it('shows a retry-specific heading instead of the previous failure heading', () => {
    expect(render({ ...progress, content: 'failed', currentStep: 'failed_content' }, true)).toContain('Đang thử lại nội dung câu chuyện');
  });
});
