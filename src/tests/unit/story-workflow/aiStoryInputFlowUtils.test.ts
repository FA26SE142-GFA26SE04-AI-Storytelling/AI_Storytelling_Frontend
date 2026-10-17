import { describe, expect, it } from 'vitest';
import { AIStoryInputContextDto, AIStoryInputProgressDto } from '@/app/types/aiStory';
import {
  buildSubmitRequest,
  createDefaultFormValues,
  lengthPresets,
  phaseFromProgress,
  restoreFormValues,
  shouldPollInput,
  vocabularyTone,
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
        setting: '  ',
        vocabularyLevel: 'level_2',
        targetLength: 900,
        outputMode: 'learning',
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
      outputMode: 'learning',
      childProfileId: 7,
      existingStoryId: 20,
      idempotencyKey: 'ai-story-fixed-key',
    });
  });

  it('gửi chế độ "Chỉ để đọc" khi backend cho phép, ngược lại quay về "learning"', () => {
    const values = { ...createDefaultFormValues(context), outputMode: 'reading_media_only' as const };
    expect(buildSubmitRequest(7, values, { ...context, availableOutputModes: ['learning', 'reading_media_only'] }, 'ai-story-fixed-key').outputMode).toBe('reading_media_only');
    expect(buildSubmitRequest(7, values, { ...context, availableOutputModes: ['learning'] }, 'ai-story-fixed-key').outputMode).toBe('learning');
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

  it('sends a specified setting and an allowed vocabulary level', () => {
    const request = buildSubmitRequest(
      7,
      { ...createDefaultFormValues(context), setting: ' Khu rừng tre ', vocabularyLevel: 'level_1' },
      context,
      'k'
    );
    expect(request.settingMode).toBe('specified');
    expect(request.setting).toBe('Khu rừng tre');
    expect(request.vocabularyLevel).toBe('level_1');
  });

  it('falls back to the profile vocabulary level when the chosen one is not allowed', () => {
    const request = buildSubmitRequest(7, { ...createDefaultFormValues(context), vocabularyLevel: 'level_5' }, context, 'k');
    expect(request.vocabularyLevel).toBe('level_2');
  });

  it('splits the reading-level length range into short / medium / long presets', () => {
    // Mức 2: 400–700 tiếng (Luồng 2 mục 5.3b).
    expect(lengthPresets(2000, 2)).toEqual({ short: 450, medium: 550, long: 650 });
    expect(lengthPresets(500, 2).long).toBe(500);
    const tiny = lengthPresets(120, 3);
    expect(Math.max(tiny.short, tiny.medium, tiny.long)).toBeLessThanOrEqual(120);
  });

  it('labels vocabulary levels relative to the profile level', () => {
    expect(vocabularyTone('level_1', 'level_2')).toBe('familiar');
    expect(vocabularyTone('level_2', 'level_2')).toBe('default');
    expect(vocabularyTone('level_3', 'level_2')).toBe('extended');
  });

  it('restores a previous idea within the current safety limits', () => {
    const restored = restoreFormValues({ topic: 'Rùa học bơi', setting: 'Hồ sen', targetLength: 900, vocabularyLevel: 'level_5' }, context);
    expect(restored).toMatchObject({ topic: 'Rùa học bơi', setting: 'Hồ sen', targetLength: 500, vocabularyLevel: 'level_2' });
    expect(restored.lesson).toBe(createDefaultFormValues(context).lesson);
    expect(restoreFormValues(null, context)).toEqual(createDefaultFormValues(context));
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
