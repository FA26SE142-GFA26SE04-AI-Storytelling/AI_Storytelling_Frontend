import {
  AIStoryCreativeInputDto,
  AIStoryInputContextDto,
  AIStoryInputProgressDto,
  GenerationMode,
  StoryOutputMode,
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
  /** Kèm học liệu (từ vựng, câu đố) hoặc chỉ để đọc. */
  outputMode: StoryOutputMode;
  generationMode?: GenerationMode;
  quizQuestionCount?: number;
}

/** Chế độ đầu ra backend cho phép với bé này; context cũ chưa có trường thì chỉ có "kèm học liệu". */
export const outputModesOf = (context: AIStoryInputContextDto): StoryOutputMode[] =>
  context.availableOutputModes?.length ? context.availableOutputModes : ['learning'];

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

/** Các ô của form ý tưởng có kiểm tra độ dài, theo thứ tự hiển thị trên form. */
export type BriefField = 'topic' | 'lesson' | 'genre' | 'setting';
export const BRIEF_FIELDS: readonly BriefField[] = ['topic', 'lesson', 'genre', 'setting'];

/** Độ dài tối đa từng ô, khớp AIStoryCreativeInputDto ở backend. */
export const BRIEF_LIMITS: Record<BriefField, number> = { topic: 200, lesson: 500, genre: 50, setting: 300 };
const BRIEF_REQUIRED: Partial<Record<BriefField, string>> = { topic: 'Hãy nhập ý tưởng câu chuyện.', lesson: 'Hãy nhập bài học muốn gửi tới con.' };
const BRIEF_MIN = 2;

/**
 * Lỗi của từng ô (tính sau khi bỏ khoảng trắng hai đầu, như lúc gửi). Quá dài thì báo ngay;
 * ô bắt buộc trống hoặc quá ngắn chỉ báo khi `submitted` (đã bấm gửi), để không bắt lỗi lúc phụ huynh chưa kịp gõ.
 */
export function briefFieldErrors(
  values: Pick<AIStoryInputFormValues, BriefField>,
  submitted: boolean,
): Partial<Record<BriefField, string>> {
  const errors: Partial<Record<BriefField, string>> = {};
  for (const key of BRIEF_FIELDS) {
    const length = values[key].trim().length;
    const required = BRIEF_REQUIRED[key];
    if (length > BRIEF_LIMITS[key]) errors[key] = `Tối đa ${BRIEF_LIMITS[key]} ký tự (đang có ${length}).`;
    else if (submitted && required && length === 0) errors[key] = required;
    else if (submitted && required && length < BRIEF_MIN) errors[key] = `Cần ít nhất ${BRIEF_MIN} ký tự.`;
  }
  return errors;
}

// Lỗi backend bắt đầu bằng nhãn tiếng Việt của DTO ("Ý tưởng câu chuyện từ 2…") hoặc tên trường ("Topic: tối đa…").
const BRIEF_MESSAGE_PREFIXES: [BriefField, string[]][] = [
  ['topic', ['ý tưởng câu chuyện', 'topic:']],
  ['lesson', ['bài học', 'lesson:']],
  ['genre', ['thể loại', 'genre:']],
  ['setting', ['bối cảnh', 'setting:']],
];

/** Ô mà một thông báo lỗi từ server nói tới; null nếu không gắn được với ô nào. */
export function briefFieldOfMessage(message: string | null | undefined): BriefField | null {
  const text = message?.trim().toLowerCase();
  if (!text) return null;
  return BRIEF_MESSAGE_PREFIXES.find(([, prefixes]) => prefixes.some((p) => text.startsWith(p)))?.[0] ?? null;
}

export type LengthPreset = 'short' | 'medium' | 'long';

export function clampTargetLength(value: number, maximumLength: number): number {
  const safeMaximum = Math.max(1, maximumLength);
  const safeValue = Number.isFinite(value) ? value : 1;
  return Math.min(Math.max(1, Math.round(safeValue)), safeMaximum);
}

/**
 * Lấy đề xuất backend làm mức vừa; các lựa chọn đều tuân thủ giới hạn an toàn.
 * Context từ server cũ chưa có đề xuất vẫn dùng khoảng theo mức đọc.
 */
export function lengthPresets(maximumLength: number, readingLevel: number, recommendedTargetLength?: number): Record<LengthPreset, number> {
  if (recommendedTargetLength && Number.isFinite(recommendedTargetLength) && recommendedTargetLength > 0) {
    const medium = clampTargetLength(recommendedTargetLength, maximumLength);
    return {
      short: clampTargetLength(Math.max(MIN_TARGET_LENGTH, Math.round(medium * 0.8 / 10) * 10), maximumLength),
      medium,
      long: clampTargetLength(Math.round(medium * 1.2 / 10) * 10, maximumLength),
    };
  }
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
    targetLength: lengthPresets(context.maximumLength, context.readingLevel, context.recommendedTargetLength).medium,
    outputMode: 'learning',
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
    outputMode: saved.outputMode && outputModesOf(context).includes(saved.outputMode) ? saved.outputMode : defaults.outputMode,
    generationMode: saved.generationMode === 'quick' ? 'quick' : undefined,
    quizQuestionCount: [3, 4, 5, 6].find((count) => count === saved.quizQuestionCount),
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

export function generationOptions(outputMode: string, mode?: GenerationMode, quizCount = 3) {
  if (mode !== 'quick') return {};
  return { generationMode: mode, ...(outputMode === 'learning' ? { quizQuestionCount: quizCount } : {}) };
}

export function buildSubmitRequest(
  childProfileId: number,
  values: AIStoryInputFormValues,
  context: AIStoryInputContextDto,
  idempotencyKey: string,
  existingStoryId?: number
): SubmitAIStoryInputRequestDto {
  const outputMode = outputModesOf(context).includes(values.outputMode) ? values.outputMode : 'learning';
  return {
    ...buildCreativeInput(values, context),
    outputMode,
    ...generationOptions(outputMode, values.generationMode, values.quizQuestionCount),
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
