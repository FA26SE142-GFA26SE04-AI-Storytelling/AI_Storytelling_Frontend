import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAiStory } from '../../../app/mocks/mockAiStory';
import { resetMockDb } from '../../../app/mocks/mockDb';
import { snapshotStage } from '../../../app/components/workspaces/studio/useStoryPipeline';

vi.mock('../../../app/mocks/config', async (orig) => ({ ...(await orig<typeof import('../../../app/mocks/config')>()), delay: () => Promise.resolve() }));

const input = { childProfileId: 1, topic: 'Rùa con học bơi', characters: ['Rùa Con'], characterMode: 'specified' as const, settingMode: 'ai_suggested' as const, lesson: 'kiên trì', vocabularyLevel: 'level_2' as const, targetLength: 400, idempotencyKey: 'k1' };

async function wait(ms: number) { await vi.advanceTimersByTimeAsync(ms); }
async function snap(id: number) {
  const [o, g] = await Promise.all([mockAiStory.getOutline(id), mockAiStory.getGenerationProgress(id)]);
  return { outline: o.data, generation: g.data };
}

describe('mock AI story pipeline', () => {
  beforeEach(() => { vi.useFakeTimers(); resetMockDb(); });
  afterEach(() => vi.useRealTimers());

  it('đi qua đủ các bước từ ý tưởng đến sẵn sàng đọc', async () => {
    const submitted = await mockAiStory.submitInput(input);
    const id = submitted.data!.storyId;
    expect(submitted.data!.inputStatus).toBe('checking_input');

    await wait(1500);
    expect((await mockAiStory.getInputProgress(id)).data!.inputStatus).toBe('input_accepted');
    expect(snapshotStage(await snap(id), false)).toBe('outline_wait');

    await wait(1500);
    expect(snapshotStage(await snap(id), false)).toBe('outline');

    await mockAiStory.approveOutline(id);
    expect(snapshotStage(await snap(id), true)).toBe('generating');

    await wait(5200);
    expect(snapshotStage(await snap(id), true)).toBe('review');
    const pkg = (await mockAiStory.getReviewPackage(id)).data!;
    expect(pkg.canApprove).toBe(true);
    expect(pkg.vocabulary.itemCount).toBeGreaterThan(0);

    await mockAiStory.approveStory(id);
    expect(snapshotStage(await snap(id), true)).toBe('media');
    await wait(6500);
    expect((await mockAiStory.getMediaProgress(id)).data!.isReady).toBe(true);
  });

  it('chặn chủ đề không phù hợp', async () => {
    const id = (await mockAiStory.submitInput({ ...input, topic: 'Chuyện ma quỷ đáng sợ' })).data!.storyId;
    await wait(1500);
    expect((await mockAiStory.getInputProgress(id)).data!.inputStatus).toBe('input_blocked');
  });

  it('viết lại dàn ý tạo phiên bản mới', async () => {
    const id = (await mockAiStory.submitInput(input)).data!.storyId;
    await wait(2600);
    await mockAiStory.regenerateOutline(id, 1, { operationKey: 'r' });
    expect((await mockAiStory.getOutline(id)).data!.activeOperation).toBe('regenerate');
    await wait(2300);
    expect((await mockAiStory.getOutline(id)).data!.currentVersion!.versionNo).toBe(2);
  });
});
