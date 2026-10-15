import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/mocks/config', async (orig) => ({ ...(await orig<typeof import('@/app/mocks/config')>()), delay: () => Promise.resolve() }));

import { db, resetMockDb } from '@/app/mocks/mockDb';
import { existingStoryMockOverrides as api } from '@/app/mocks/mockExistingStory';
import { mockStoryStatus } from '@/app/mocks/mockAiStory';

const para = 'Sáng nay Ếch Xanh dậy sớm. Bạn ấy rủ Thỏ Trắng đi hái hoa ven đầm sen. Hai bạn cười vui vẻ suốt đường đi.';

describe('mock nhập truyện có sẵn', () => {
  beforeEach(() => resetMockDb());

  it('từ chối truyện không phải tiếng Việt', async () => {
    const r = await api.importStory({ inputMethod: 'paste', content: 'Once upon a time there was a little frog who lived happily in the pond.', childProfileId: 1, idempotencyKey: 'k' });
    expect(r.success).toBe(false);
  });

  it('truyện vừa sức được đánh giá Phù hợp', async () => {
    const imported = await api.importStory({ inputMethod: 'paste', content: para, childProfileId: 1, idempotencyKey: 'k' });
    const ev = await api.evaluate(imported.data!.storyId);
    expect(ev.data?.decisionText).toBe('Suitable');
  });

  it('truyện quá dài cần điều chỉnh và không giữ được bản gốc; AI chỉnh xong thì vào hàng chờ', async () => {
    const long = Array.from({ length: 60 }, () => para).join(' ');
    const imported = await api.importStory({ inputMethod: 'paste', content: long, childProfileId: 1, idempotencyKey: 'k' });
    const id = imported.data!.storyId;
    const ev = await api.evaluate(id);
    expect(ev.data?.decisionText).toBe('AdaptRecommended');
    expect(ev.data?.canKeepOriginal).toBe(false);
    expect((await api.keepOriginal(id, 0, 'đọc cùng con')).success).toBe(false);

    const adapted = await api.adapt(id);
    expect(adapted.data?.decision).toBe('Suitable');
    const story = db().stories.find((s) => s.id === id)!;
    expect(story.pendingDecision).toBe(false);
    expect(['outline_review', 'content_review']).toContain(mockStoryStatus(story));
  });

  it('AI chỉ được chỉnh tối đa 2 lần', async () => {
    const long = Array.from({ length: 60 }, () => para).join(' ');
    const { data } = await api.importStory({ inputMethod: 'paste', content: long, childProfileId: 1, idempotencyKey: 'k' });
    db().stories.find((s) => s.id === data!.storyId)!.adaptCount = 2;
    expect((await api.adapt(data!.storyId)).success).toBe(false);
  });
});
