import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type * as B from '@/app/types/backendContracts';
import AuthoringWorkspace from '@/app/features/authoring/AuthoringWorkspace';

// Mock ParentAuthoringWorkspace so we can verify the props passed to it
vi.mock('@/app/features/authoring/ParentAuthoringWorkspace', () => {
  return {
    default: (props: { childId?: number | null; initialStoryId?: number | null; onDone?: () => void }) => {
      return (
        <div data-testid="parent-authoring-workspace" data-initial-story-id={props.initialStoryId ?? 'none'}>
          Parent Authoring Workspace Loaded
        </div>
      );
    },
  };
});

describe('AuthoringWorkspace without child chooser or naming prompt', () => {
  it('directly opens ParentAuthoringWorkspace without child modal gatekeeper', () => {
    const go = vi.fn();
    const html = renderToStaticMarkup(<AuthoringWorkspace go={go} />);

    // Must render the workspace directly
    expect(html).toContain('data-testid="parent-authoring-workspace"');
    expect(html).toContain('Parent Authoring Workspace Loaded');
    // Must NOT contain any child selection prompt
    expect(html).not.toContain('Soạn truyện cho bé nào?');
    expect(html).not.toContain('Chưa có hồ sơ bé');
    expect(html).not.toContain('Chọn bé');
  });

  it('passes resumeStoryId directly as initialStoryId when provided', () => {
    const go = vi.fn();
    const html = renderToStaticMarkup(<AuthoringWorkspace go={go} resumeStoryId={123} />);

    expect(html).toContain('data-initial-story-id="123"');
    expect(html).not.toContain('Đang mở bản nháp');
  });

  it('allows CreateParentDraftRequest to have null or undefined childProfileId', () => {
    const request: B.CreateParentDraftRequest = {
      operationId: 'op-123',
      childProfileId: null,
      title: 'Truyện của gia đình',
      language: 'vi',
      purpose: 'free',
      experienceMode: 'reading',
    };
    expect(request.childProfileId).toBeNull();
    expect(request.title).toBe('Truyện của gia đình');
  });
});
