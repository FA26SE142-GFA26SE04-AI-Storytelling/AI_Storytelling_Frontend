import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCreativeContext } from '../../../app/components/parents/creative/creativeStoryContext';
import { aiStoryCreationService as api } from '../../../app/services/aiStoryCreationService';
import type { AIStoryInputContextDto } from '../../../app/types/aiStory';
import type { ApiResponse } from '../../../app/types/auth';

afterEach(() => vi.restoreAllMocks());
const response = (childProfileId: number): ApiResponse<AIStoryInputContextDto> => ({ success: true, message: 'OK', data: { childProfileId } as AIStoryInputContextDto });
describe('child-scoped creative context', () => {
  it('ignores an old child response after its request was aborted', async () => {
    let resolve!: (value: ApiResponse<AIStoryInputContextDto>) => void;
    vi.spyOn(api, 'getCreationContext').mockReturnValue(new Promise(done => { resolve = done; }));
    const controller = new AbortController(); const onContext = vi.fn();
    const pending = loadCreativeContext(1, controller.signal, onContext, vi.fn());
    controller.abort(); resolve(response(1)); await pending;
    expect(onContext).not.toHaveBeenCalled();
  });
  it('does not accept another child configuration even on HTTP success', async () => {
    vi.spyOn(api, 'getCreationContext').mockResolvedValue(response(1));
    const onContext = vi.fn(); const onError = vi.fn();
    await loadCreativeContext(2, new AbortController().signal, onContext, onError);
    expect(onContext).not.toHaveBeenCalled(); expect(onError).toHaveBeenCalled();
  });
  it('loads matching context with a cancellation signal', async () => {
    const spy = vi.spyOn(api, 'getCreationContext').mockResolvedValue(response(2));
    const signal = new AbortController().signal; const onContext = vi.fn();
    await loadCreativeContext(2, signal, onContext, vi.fn());
    expect(spy).toHaveBeenCalledWith(2, signal); expect(onContext).toHaveBeenCalledWith(response(2).data);
  });
});
