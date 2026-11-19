import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AI_STORY_CONCURRENCY_LIMIT_CODE,
  AI_STORY_CONCURRENCY_LIMIT_MESSAGE,
  aiStoryCreationService,
  isAiConcurrencyLimitResponse,
} from '@/app/services/aiStoryCreationService';
import { creatorInputService } from '@/app/services/creatorPublicationService';
import { authService } from '@/app/services/authService';

describe('AI story concurrency limit service mapping', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps HTTP 409 AI_STORY_CONCURRENCY_LIMIT in aiStoryCreationService without altering other 409s', async () => {
    const fetchMock = vi.spyOn(authService, 'authenticatedFetch');
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          message: 'raw backend message',
          data: null,
          errors: [AI_STORY_CONCURRENCY_LIMIT_CODE],
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const limited = await aiStoryCreationService.submitInput({
      childProfileId: 1,
      ageBand: '6-8',
      readingLevel: 2,
      topic: 'Chủ đề 3',
      characterMode: 'ai_suggested',
      characters: [],
      settingMode: 'ai_suggested',
      setting: null,
      lesson: 'Bài học',
      vocabularyLevel: 'level_1',
      language: 'vi',
      targetLength: 300,
      outputMode: 'reading_media_only',
      existingStoryId: null,
      idempotencyKey: 'k3',
    });

    expect(limited.success).toBe(false);
    expect(limited.status).toBe(409);
    expect(limited.message).toBe(AI_STORY_CONCURRENCY_LIMIT_MESSAGE);
    expect(isAiConcurrencyLimitResponse(limited)).toBe(true);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          message: 'Other conflict',
          data: null,
          errors: ['OTHER_CONFLICT'],
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const other = await aiStoryCreationService.submitInput({
      childProfileId: 1,
      ageBand: '6-8',
      readingLevel: 2,
      topic: 'Chủ đề 3',
      characterMode: 'ai_suggested',
      characters: [],
      settingMode: 'ai_suggested',
      setting: null,
      lesson: 'Bài học',
      vocabularyLevel: 'level_1',
      language: 'vi',
      targetLength: 300,
      outputMode: 'reading_media_only',
      existingStoryId: null,
      idempotencyKey: 'k4',
    });

    expect(other.status).toBe(409);
    expect(other.message).toBe('Other conflict');
    expect(isAiConcurrencyLimitResponse(other)).toBe(false);
  });

  it('maps HTTP 409 AI_STORY_CONCURRENCY_LIMIT in apiRequest (creatorInputService)', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          message: 'raw',
          data: null,
          errors: [AI_STORY_CONCURRENCY_LIMIT_CODE],
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const res = await creatorInputService.submit({
      ageBand: '6-8',
      readingLevel: 2,
      topic: 'Truyện 3',
      characterMode: 'ai_suggested',
      characters: [],
      settingMode: 'ai_suggested',
      setting: null,
      lesson: 'Bài học',
      vocabularyLevel: 'level_1',
      language: 'vi',
      targetLength: 300,
      outputMode: 'reading_media_only',
      existingStoryId: null,
      idempotencyKey: 'c3',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe(409);
    expect(res.message).toBe(AI_STORY_CONCURRENCY_LIMIT_MESSAGE);
    expect(isAiConcurrencyLimitResponse(res)).toBe(true);
  });

  it('fetches capacity from /ai-generation/capacity', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            limit: 2,
            activeCount: 2,
            canStartNewStory: false,
            activeStories: [
              { storyId: 11, title: 'Truyện A', activityMode: 'FullCreation', storyStatus: 'OutlineReview', startedAt: '2026-11-18T00:00:00Z' },
              { storyId: 12, title: 'Truyện B', activityMode: 'TaskOnly', storyStatus: 'Draft', startedAt: '2026-11-18T00:05:00Z' },
            ],
          },
          errors: null,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const res = await aiStoryCreationService.getAiCapacity();
    expect(res.success).toBe(true);
    expect(res.data?.limit).toBe(2);
    expect(res.data?.activeCount).toBe(2);
    expect(res.data?.canStartNewStory).toBe(false);
    expect(res.data?.activeStories).toHaveLength(2);
  });
});
