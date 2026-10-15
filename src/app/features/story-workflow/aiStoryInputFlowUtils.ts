import {
  AIStoryCreativeInputDto,
  AIStoryInputContextDto,
  AIStoryInputProgressDto,
  SubmitAIStoryInputRequestDto,
  VocabularyLevel,
} from '@/app/types/aiStory';
import { lengthTarget } from '@/app/lib/storyRules';

export interface AIStoryInputFormValues {
  topic: string;
  genre: string;
  lesson: string;
  charactersText: string;
  setting: string;
  vocabularyLevel: VocabularyLevel;
  targetLength: number;
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
/** Trường tự do (nhân vật, bối cảnh, bài học) tối đa 200 ký tự (BR-2.20). */
export const FREE_TEXT_MAX = 200;
export const MIN_TARGET_LENGTH = 100;

export type LengthPreset = 'short' | 'medium' | 'long';

export function clampTargetLength(value: number, maximumLength: number): number {
  const safeMaximum = Math.max(1, maximumLength);
  const safeValue = Number.isFinite(value) ? value : 1;
  return Math.min(Math.max(1, Math.round(safeValue)), safeMaximum);
}

/**
 * Ngắn / vừa / dài = phần ba thấp / giữa / cao của khoảng độ dài (tiếng) theo mức đọc của bé (Luồng 2 mục 5.3b),
 * không vượt độ dài tối đa trong cài đặt an toàn.
 */
export function lengthPresets(maximumLength: number, readingLevel: number): Record<LengthPreset, number> {
  const at = (choice: LengthPreset) => clampTargetLength(lengthTarget(choice, readingLevel || 2, maximumLength), maximumLength);
  return { short: at('short'), medium: at('medium'), long: at('long') };
}

/** Cấp từ vựng thấp hơn / bằng / cao hơn mức theo hồ sơ bé. */
export function vocabularyTone(level: VocabularyLevel, defaultLevel: VocabularyLevel): 'familiar' | 'default' | 'extended' {
  const n = (v: VocabularyLevel) => Number(v.replace('level_', ''));
  return n(level) < n(defaultLevel) ? 'familiar' : n(level) > n(defaultLevel) ? 'extended' : 'default';
}

export function createDefaultFormValues(context: AIStoryInputContextDto): AIStoryInputFormValues {
  const interest = context.interests[0];
  return {
    topic: interest ? `Chuyến phiêu lưu của những người bạn về chủ đề ${interest}` : '',
    genre: 'Phiêu lưu',
    lesson: 'Lòng dũng cảm và sự sẻ chia cùng bạn bè',
    charactersText: 'Sóc Bông, Thỏ Trắng',
    setting: '',
    vocabularyLevel: context.defaultVocabularyLevel,
    // Mặc định độ dài "vừa" theo mức đọc của bé (Luồng 2 mục 5.3b).
    targetLength: lengthPresets(context.maximumLength, context.readingLevel).medium,
  };
}

/**
 * Nạp lại ý tưởng đã gửi (khi quay lại sửa ý tưởng hoặc mở lại trang).
 * Cài đặt an toàn của bé có thể đã đổi nên độ dài và mức từ vựng được kiểm lại theo context mới.
 */
export function restoreFormValues(saved: Partial<AIStoryInputFormValues> | null | undefined, context: AIStoryInputContextDto): AIStoryInputFormValues {
  const defaults = createDefaultFormValues(context);
  if (!saved) return defaults;
  const text = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
  return {
    topic: text(saved.topic, defaults.topic),
    genre: text(saved.genre, defaults.genre),
    lesson: text(saved.lesson, defaults.lesson),
    charactersText: text(saved.charactersText, defaults.charactersText),
    setting: text(saved.setting, defaults.setting),
    vocabularyLevel: saved.vocabularyLevel && context.availableVocabularyLevels.includes(saved.vocabularyLevel)
      ? saved.vocabularyLevel
      : defaults.vocabularyLevel,
    targetLength: typeof saved.targetLength === 'number' ? clampTargetLength(saved.targetLength, context.maximumLength) : defaults.targetLength,
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
  const setting = values.setting.trim();
  const vocabularyLevel = context.availableVocabularyLevels.includes(values.vocabularyLevel)
    ? values.vocabularyLevel
    : context.defaultVocabularyLevel;

  return {
    topic: values.topic.trim(),
    genre: values.genre.trim() || undefined,
    characterMode: characters.length > 0 ? 'specified' : 'ai_suggested',
    characters,
    settingMode: setting ? 'specified' : 'ai_suggested',
    setting: setting || undefined,
    lesson: values.lesson.trim(),
    vocabularyLevel,
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
