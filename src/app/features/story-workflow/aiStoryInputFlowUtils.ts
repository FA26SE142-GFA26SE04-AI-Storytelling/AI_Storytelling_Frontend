import {
  AIStoryCreativeInputDto,
  AIStoryInputContextDto,
  AIStoryInputProgressDto,
  SubmitAIStoryInputRequestDto,
} from '@/app/types/aiStory';
import { lengthTarget, vocabularyLevelFor, type VocabChoice } from '@/app/lib/storyRules';

export interface AIStoryInputFormValues {
  topic: string;
  genre: string;
  lesson: string;
  charactersText: string;
  targetLength: number;
  /** Bỏ trống để AI gợi ý bối cảnh. */
  setting?: string;
  vocabularyChoice?: VocabChoice;
}

export type AIStoryInputFlowPhase =
  | 'loading_context'
  | 'editing_input'
  | 'submitting'
  | 'checking_input'
  | 'input_accepted'
  | 'waiting_outline'
  | 'input_blocked'
  | 'input_check_failed';

export const DEFAULT_TARGET_LENGTH = 800;

export function clampTargetLength(value: number, maximumLength: number): number {
  const safeMaximum = Math.max(1, maximumLength);
  const safeValue = Number.isFinite(value) ? value : 1;
  return Math.min(Math.max(1, Math.round(safeValue)), safeMaximum);
}

export function createDefaultFormValues(context: AIStoryInputContextDto): AIStoryInputFormValues {
  const interest = context.interests[0];
  return {
    topic: interest ? `Chuyến phiêu lưu của những người bạn về chủ đề ${interest}` : '',
    genre: 'Phiêu lưu',
    lesson: '',
    charactersText: '',
    setting: '',
    vocabularyChoice: 'default',
    targetLength: clampTargetLength(lengthTarget('medium', context.readingLevel || 2, context.maximumLength), context.maximumLength),
  };
}

export function buildCreativeInput(
  values: AIStoryInputFormValues,
  context: AIStoryInputContextDto
): AIStoryCreativeInputDto {
  const characters = values.charactersText
    .split(',')
    .map((character) => character.trim())
    .filter(Boolean);

  return {
    topic: values.topic.trim(),
    genre: values.genre.trim() || undefined,
    characterMode: characters.length > 0 ? 'specified' : 'ai_suggested',
    characters,
    settingMode: values.setting?.trim() ? 'specified' : 'ai_suggested',
    setting: values.setting?.trim() || undefined,
    lesson: values.lesson.trim(),
    vocabularyLevel: vocabularyLevelFor(values.vocabularyChoice, context.defaultVocabularyLevel, context.readingLevel),
    language: context.defaultLanguage || undefined,
    targetLength: clampTargetLength(values.targetLength, context.maximumLength),
  };
}

export function buildSubmitRequest(
  childProfileId: number,
  values: AIStoryInputFormValues,
  context: AIStoryInputContextDto,
  idempotencyKey: string,
  existingStoryId?: number
): SubmitAIStoryInputRequestDto {
  return {
    ...buildCreativeInput(values, context),
    childProfileId,
    existingStoryId,
    idempotencyKey,
  };
}

export function shouldPollInput(progress: AIStoryInputProgressDto): boolean {
  return progress.inputStatus === 'pending_input' || progress.inputStatus === 'checking_input';
}

export function phaseFromProgress(progress: AIStoryInputProgressDto): AIStoryInputFlowPhase {
  switch (progress.inputStatus) {
    case 'input_accepted':
      return 'input_accepted';
    case 'input_blocked':
      return 'input_blocked';
    case 'input_check_failed':
      return 'input_check_failed';
    default:
      return 'checking_input';
  }
}
