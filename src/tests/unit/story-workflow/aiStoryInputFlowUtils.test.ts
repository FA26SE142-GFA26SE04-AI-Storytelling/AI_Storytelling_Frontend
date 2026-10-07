import { describe, expect, it } from 'vitest';
import { AIStoryInputContextDto, AIStoryInputProgressDto } from '@/app/types/aiStory';
import {
  buildSubmitRequest,
  createDefaultFormValues,
  phaseFromProgress,
  shouldPollInput,
} from '@/app/features/story-workflow/aiStoryInputFlowUtils';

const context: AIStoryInputContextDto = {
  childProfileId: 7,
  childNickname: 'Mây',
  ageBand: '6-8',
  readingLevel: 2,
  defaultVocabularyLevel: 'level_2',
  availableVocabularyLevels: ['level_1', 'level_2'],
  defaultLanguage: 'vi',
  availableLanguages: ['vi'],
  maximumLength: 500,
  requiredApprovalMode: 'manual',
  parentalGateEnabled: true,
  safetyScoreThreshold: 0.8,
  readabilityScoreThreshold: 0.7,
  comprehensionGoal: null,
  comprehensionThresholdPercent: null,
  comprehensionWindowSize: 3,
  interests: ['vũ trụ'],
  allowedCategoryCodes: ['EDU'],
  restrictedCategoryCodes: [],
  blockedCategoryCodes: ['VIOLENCE'],
  characterModes: ['specified', 'ai_suggested'],
  settingModes: ['specified', 'ai_suggested'],
};

function progress(inputStatus: AIStoryInputProgressDto['inputStatus']): AIStoryInputProgressDto {
  return {
    storyId: 11,
    requestId: 12,
    inputStatus,
    handoffStatus: 'none',
    handoffJobId: null,
    attemptCount: 1,
    maxAttempts: 3,
    reasonCode: null,
    fallbackMessage: null,
    canRetry: false,
    createdAt: '2026-09-29T00:00:00Z',
    updatedAt: null,
    guardrailCheckedAt: null,
    handoffCreatedAt: null,
  };
}

describe('AI Story Input Phase 1 contract', () => {
  it('maps context defaults and clamps target length to maximumLength', () => {
    const values = createDefaultFormValues(context);
    expect(values.topic).toContain('vũ trụ');
    expect(values.targetLength).toBe(500);
  });

  it('builds the exact submit contract with specified characters', () => {
    const request = buildSubmitRequest(
      7,
      {
        topic: '  Phiêu lưu trong rừng  ',
        genre: 'Kỳ ảo',
        lesson: '  Biết chia sẻ  ',
        charactersText: 'Sóc Bông, Thỏ Trắng',
        targetLength: 900,
      },
      context,
      'ai-story-fixed-key',
      20
    );

    expect(request).toEqual({
      topic: 'Phiêu lưu trong rừng',
      genre: 'Kỳ ảo',
      characterMode: 'specified',
      characters: ['Sóc Bông', 'Thỏ Trắng'],
      settingMode: 'ai_suggested',
      setting: undefined,
      lesson: 'Biết chia sẻ',
      vocabularyLevel: 'level_2',
      language: 'vi',
      targetLength: 500,
      childProfileId: 7,
      existingStoryId: 20,
      idempotencyKey: 'ai-story-fixed-key',
    });
  });

  it('uses ai_suggested when no characters are provided', () => {
    const request = buildSubmitRequest(
      7,
      { ...createDefaultFormValues(context), charactersText: '' },
      context,
      'ai-story-fixed-key'
    );
    expect(request.characterMode).toBe('ai_suggested');
    expect(request.characters).toEqual([]);
  });

  it('polls only pending/checking and advances only accepted', () => {
    expect(shouldPollInput(progress('pending_input'))).toBe(true);
    expect(shouldPollInput(progress('checking_input'))).toBe(true);
    expect(shouldPollInput(progress('input_accepted'))).toBe(false);
    expect(phaseFromProgress(progress('input_accepted'))).toBe('input_accepted');
    expect(phaseFromProgress(progress('input_blocked'))).toBe('input_blocked');
    expect(phaseFromProgress(progress('input_check_failed'))).toBe('input_check_failed');
  });
});
