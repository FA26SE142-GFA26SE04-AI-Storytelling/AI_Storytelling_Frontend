import { describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { UseAIStoryInputFlowResult } from '@/app/features/story-workflow/useAIStoryInputFlow';

vi.mock('react', async importActual => ({ ...await importActual<typeof import('react')>(),
  useState: <T,>(initial: T) => [initial, vi.fn()] }));
vi.mock('@/app/lib/motion', () => ({ useRiseIn: () => null, useSwap: () => null }));
vi.mock('@/app/components/brand/Frog', () => ({ default: () => null }));
vi.mock('@/app/components/brand/PondBackdrop', () => ({ default: () => null }));
vi.mock('@/app/components/shell/AsidePane', () => ({ default: ({ children }: { children: ReactNode }) => <aside>{children}</aside> }));
vi.mock('@/app/features/studio/BriefForm', () => ({ default: () => null }));
vi.mock('@/app/features/studio/ImportStoryPanel', () => ({ default: () => null }));
vi.mock('@/app/features/studio/OutlinePanel', () => ({ default: () => null }));
import StageProgress from '@/app/features/studio/StageProgress';
import StudioPlan from '@/app/features/studio/StudioPlan';

type Node = ReactElement<{ children?: ReactNode; onClick?: () => unknown }>;
function nodes(node: ReactNode): Node[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object' || !('props' in node)) return [];
  const element = node as Node;
  return [element, ...nodes(element.props.children)];
}

describe('provider access failure UI', () => {
  it.each(['AI_PROVIDER_ACCESS_DENIED', 'AI_PROVIDER_CONFIGURATION_REJECTED'])('refreshes status without retrying generation for %s', async errorCode => {
    const refresh = vi.fn(); const retry = vi.fn(async () => ({ success: true, message: '' }));
    const element = StageProgress({ stage: 'outline_wait', snapshot: null, errorCode, timedOut: true, onRetry: refresh, onRetryFailed: retry });
    const buttons = nodes(element).filter(n => n.type === 'button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].props.children).toBe('Kiểm tra lại trạng thái');
    await buttons[0].props.onClick?.();
    expect(refresh).toHaveBeenCalledTimes(1); expect(retry).not.toHaveBeenCalled();
    const html = renderToStaticMarkup(element);
    expect(html).not.toContain('chưa có kết luận tác vụ thất bại');
    expect(html).toContain('không gửi yêu cầu sinh AI mới');
  });

  it('keeps generation retry available for an ordinary failure', async () => {
    const retry = vi.fn(async () => ({ success: true, message: '' }));
    const element = StageProgress({ stage: 'outline_wait', snapshot: null, errorCode: 'OUTLINE_GENERATION_FAILED', onRetryFailed: retry });
    const button = nodes(element).find(n => n.type === 'button')!;
    expect(button.props.children).toBe('Thử lại');
    button.props.onClick?.(); await Promise.resolve();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows the child topic rules as readable names with counts instead of raw category codes', () => {
    const context = {
      maximumLength: 1430, defaultVocabularyLevel: 'level_2', requiredApprovalMode: 'AlwaysManual',
      interests: ['Cổ tích - Kỳ ảo'], allowedCategoryCodes: [], blockedCategoryCodes: ['WAR_CONFLICT', 'BULLYING'],
    };
    const html = renderToStaticMarkup(<StudioPlan
      flow={{ context, values: null, errorMessage: null } as unknown as UseAIStoryInputFlowResult}
      stage="brief" storyId={null} snapshot={null} errorCode={null}
      timedOut={false} statusError={null} refresh={() => {}} onOutlineApproved={() => {}}
      kidName="Bé An" childId={1} onOpenStory={() => {}} />);
    // Chưa tải danh mục (SSR không chạy effect): dùng tên dự phòng, không hiện mã in hoa.
    expect(html).not.toContain('WAR_CONFLICT');
    expect(html).toContain('Bullying');
    expect(html).toContain('War conflict');
    expect(html).toContain('AI sẽ tránh các chủ đề này khi viết truyện cho Bé An.');
    expect(html).toContain('class="ctx-count">2<');
    expect(html).not.toContain('Chỉ viết trong các chủ đề');
  });

  it('shows a terminal sidebar state instead of endless resume text', () => {
    const html = renderToStaticMarkup(<StudioPlan
      flow={{ context: null, values: null, errorMessage: null } as UseAIStoryInputFlowResult}
      stage="outline_wait" storyId={55} snapshot={null} errorCode="AI_PROVIDER_ACCESS_DENIED"
      timedOut={false} statusError={null} refresh={() => {}} onOutlineApproved={() => {}}
      kidName="Bé" childId={1} onOpenStory={() => {}} />);
    expect(html).toContain('Đã dừng do lỗi');
    expect(html).toContain('Truyện #55');
    expect(html).not.toContain('Đang mở lại truyện đã lưu');
  });
});
