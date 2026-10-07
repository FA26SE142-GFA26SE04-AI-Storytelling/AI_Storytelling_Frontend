import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { aiStoryCreationService } from '@/app/services/aiStoryCreationService';
import { AIStoryInputProgressDto, SubmitAIStoryInputRequestDto } from '@/app/types/aiStory';

const acceptedProgress: AIStoryInputProgressDto = {
  storyId: 10,
  requestId: 20,
  inputStatus: 'input_accepted',
  handoffStatus: 'pending_dispatch',
  handoffJobId: 30,
  attemptCount: 1,
  maxAttempts: 3,
  reasonCode: null,
  fallbackMessage: null,
  canRetry: false,
  createdAt: '2026-09-29T00:00:00Z',
  updatedAt: null,
  guardrailCheckedAt: '2026-09-29T00:00:01Z',
  handoffCreatedAt: '2026-09-29T00:00:01Z',
};

const submitRequest: SubmitAIStoryInputRequestDto = {
  topic: 'Tình bạn',
  genre: 'Kỳ ảo',
  characterMode: 'ai_suggested',
  characters: [],
  settingMode: 'ai_suggested',
  lesson: 'Biết sẻ chia',
  vocabularyLevel: 'level_2',
  language: 'vi',
  targetLength: 500,
  childProfileId: 7,
  idempotencyKey: 'ai-story-fixed-key',
};

afterEach(() => vi.restoreAllMocks());

describe('AI workflow API contracts', () => {
  it.each([
    ['list', () => aiStoryCreationService.getOutlineVersions(23), '/stories/23/outline/versions', []],
    ['detail', () => aiStoryCreationService.getOutlineVersion(23, 2), '/stories/23/outline/versions/2', { id: 12, versionNo: 2, title: 'Tình bạn', opening: 'Mở đầu', development: 'Diễn biến', ending: 'Kết thúc', isCurrent: true }],
  ] as const)('loads outline history %s using GET without a mutation payload', async (_name, call, route, data) => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'OK', data })));
    expect((await call()).success).toBe(true);
    expect(spy.mock.calls[0][0]).toContain(route);
    expect(spy.mock.calls[0][1]?.method).toBe('GET');
    expect(spy.mock.calls[0][1]?.body).toBeUndefined();
  });

  it.each([
    ['outline regenerate', () => aiStoryCreationService.regenerateOutline(10, 2, { operationKey: 'regenerate-fixed' }), '/stories/10/outline/versions/2/regenerate', { operationKey: 'regenerate-fixed' }],
    ['outline approve', () => aiStoryCreationService.approveOutline(10, 2, { approvalKey: 'approve-fixed' }), '/stories/10/outline/versions/2/approve', { approvalKey: 'approve-fixed' }],
    ['generation retry', () => aiStoryCreationService.retryGeneration(10, { retryKey: 'retry-fixed' }), '/stories/10/generation/retry', { retryKey: 'retry-fixed' }],
  ] as const)('sends %s with the exact backend keys', async (_name, call, route, payload) => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'OK', data: { storyId: 10, storyStatus: 'outline_review', currentVersion: null, currentStep: 'pending_content', isComplete: false } })));
    await call();
    expect(spy.mock.calls[0][0]).toContain(route);
    expect(JSON.parse(String(spy.mock.calls[0][1]?.body))).toEqual(payload);
  });

  it('allows bodyless 202 only for illustration regeneration', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockImplementation(async () => new Response(null, { status: 202 }));
    expect((await aiStoryCreationService.regenerateIllustration(10, 5)).success).toBe(true);
    expect((await aiStoryCreationService.approveStory(10)).success).toBe(false);
    expect((await aiStoryCreationService.retryMedia(10)).success).toBe(false);
  });

  it('does not hide forbidden review responses as success', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'Forbidden', data: { storyId: 10 } }), { status: 403 }));
    expect((await aiStoryCreationService.getReviewPackage(10)).success).toBe(false);
  });

  it('passes cancellation signals through progress requests', async () => {
    const c = new AbortController();
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(null, { status: 401 }));
    await aiStoryCreationService.getMediaProgress(10, c.signal);
    expect(spy.mock.calls[0][1]?.signal).toBe(c.signal);
    expect(spy.mock.calls[0][1]?.cache).toBe('no-store');
  });

  it('rejects malformed progress even inside a successful envelope', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'OK', data: { progressPercentage: 100 } })));
    expect((await aiStoryCreationService.getGenerationProgress(10)).success).toBe(false);
  });

  it('persists story edits with versionId and lesson', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'OK', data: { storyId: 10 } })));
    const input = { versionId: 4, title: 'Tình bạn', content: 'Nội dung', lesson: 'Sẻ chia' };
    await aiStoryCreationService.updateStoryReview(10, input);
    expect(spy.mock.calls[0][1]?.method).toBe('PUT');
    expect(JSON.parse(String(spy.mock.calls[0][1]?.body))).toEqual(input);
  });
});

describe('aiStoryCreationService Phase 1', () => {
  it('sends the backend DTO without legacy keys', async () => {
    const fetchSpy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: 'OK', data: acceptedProgress }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await aiStoryCreationService.submitInput(submitRequest);
    const requestInit = fetchSpy.mock.calls[0]?.[1];
    const payload = JSON.parse(String(requestInit?.body));

    expect(result.success).toBe(true);
    expect(result.data?.storyId).toBe(10);
    expect(payload).toEqual(submitRequest);
    expect(payload.prompt).toBeUndefined();
    expect(payload.targetLesson).toBeUndefined();
  });

  it('does not treat an empty successful response as success', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(null, { status: 202 }));
    const result = await aiStoryCreationService.submitInput(submitRequest);
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });

  it('preserves blocked progress returned with HTTP 422', async () => {
    const blocked = {
      ...acceptedProgress,
      inputStatus: 'input_blocked' as const,
      fallbackMessage: 'Nội dung chưa phù hợp.',
    };
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'Nội dung chưa phù hợp.', data: blocked }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const result = await aiStoryCreationService.submitInput(submitRequest);
    expect(result.success).toBe(false);
    expect(result.data?.inputStatus).toBe('input_blocked');
  });

  it('normalizes RFC ProblemDetails conflicts', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(
      new Response(JSON.stringify({ title: 'Conflict', status: 409, detail: 'Story draft đang có yêu cầu hoạt động.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/problem+json' },
      })
    );
    const result = await aiStoryCreationService.submitInput(submitRequest);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Story draft đang có yêu cầu hoạt động.');
  });

  it.each([
    [400, 'Dữ liệu tạo truyện chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.'],
    [401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'],
    [403, 'Tài khoản không có quyền tạo truyện cho hồ sơ bé này.'],
    [404, 'Không tìm thấy hồ sơ bé hoặc yêu cầu tạo truyện.'],
    [409, 'Đang có một yêu cầu tạo truyện khác hoạt động. Vui lòng kiểm tra lại trạng thái.'],
  ])('uses a clear fallback for HTTP %i', async (status, expectedMessage) => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(
      new Response(JSON.stringify({ title: 'Request failed', status }), {
        status,
        headers: { 'Content-Type': 'application/problem+json' },
      })
    );
    const result = await aiStoryCreationService.submitInput(submitRequest);
    expect(result.success).toBe(false);
    expect(result.message).toBe(expectedMessage);
  });

  it('sends the complete creative input and retryKey to retry', async () => {
    const fetchSpy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: 'OK', data: acceptedProgress }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    await aiStoryCreationService.retryInput(10, 20, {
      topic: submitRequest.topic,
      genre: submitRequest.genre,
      characterMode: submitRequest.characterMode,
      characters: submitRequest.characters,
      settingMode: submitRequest.settingMode,
      setting: submitRequest.setting,
      lesson: submitRequest.lesson,
      vocabularyLevel: submitRequest.vocabularyLevel,
      language: submitRequest.language,
      targetLength: submitRequest.targetLength,
      retryKey: 'ai-story-retry-fixed',
    });
    const payload = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(payload.topic).toBe('Tình bạn');
    expect(payload.retryKey).toBe('ai-story-retry-fixed');
    expect(payload.newPrompt).toBeUndefined();
  });
});
