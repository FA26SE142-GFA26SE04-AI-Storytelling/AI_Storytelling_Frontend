import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { childProfileService } from '@/app/services/childProfileService';

describe('readingSlotsContracts', () => {
  let fetcher: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: 'OK', data: null }))
    );
    vi.stubGlobal('fetch', fetcher);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('GET /ChildProfile/reading-slots without signal', async () => {
    await childProfileService.getReadingSlots();

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0];
    expect(url.endsWith('/ChildProfile/reading-slots')).toBe(true);
    expect(options.method).toBe('GET');
    expect(options.body).toBeUndefined();
  });

  it('GET /ChildProfile/reading-slots with signal', async () => {
    const ctrl = new AbortController();
    await childProfileService.getReadingSlots(ctrl.signal);

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [, options] = fetcher.mock.calls[0];
    expect(options.signal).toBe(ctrl.signal);
  });

  it('PUT /ChildProfile/reading-slots with selected child profile IDs', async () => {
    await childProfileService.selectReadingSlots([3, 7]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0];
    expect(url.endsWith('/ChildProfile/reading-slots')).toBe(true);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ childProfileIds: [3, 7] });
  });
});
