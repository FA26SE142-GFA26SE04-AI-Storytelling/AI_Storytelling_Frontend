import { describe, expect, it } from 'vitest';
import { copyrightHits, detectPii, lengthChoiceOf, lengthTarget, revisionInstruction, vocabularyLevelFor } from '@/app/lib/storyRules';
import { buildCreativeInput, createDefaultFormValues } from '@/app/features/story-workflow/aiStoryInputFlowUtils';
import type { AIStoryInputContextDto } from '@/app/types/aiStory';

describe('lengthTarget', () => {
  it('chia khoảng độ dài của mức đọc thành ngắn / vừa / dài', () => {
    // Mức 2: 400–700 tiếng
    expect(lengthTarget('short', 2, 5000)).toBe(450);
    expect(lengthTarget('medium', 2, 5000)).toBe(550);
    expect(lengthTarget('long', 2, 5000)).toBe(650);
  });

  it('không vượt độ dài tối đa của bé', () => {
    expect(lengthTarget('long', 5, 1000)).toBe(1000);
  });

  it('nhận lại đúng lựa chọn từ độ dài', () => {
    expect(lengthChoiceOf(450, 2)).toBe('short');
    expect(lengthChoiceOf(550, 2)).toBe('medium');
    expect(lengthChoiceOf(650, 2)).toBe('long');
  });
});

describe('vocabularyLevelFor', () => {
  it('quen thuộc hạ 1 mức, mở rộng tăng 1 mức, giới hạn 1–5', () => {
    expect(vocabularyLevelFor('familiar', 'level_3', 3)).toBe('level_2');
    expect(vocabularyLevelFor('extended', 'level_3', 3)).toBe('level_4');
    expect(vocabularyLevelFor('extended', 'level_5', 5)).toBe('level_5');
    expect(vocabularyLevelFor('default', 'level_3', 3)).toBe('level_3');
  });
});

describe('detectPii', () => {
  it('bắt số điện thoại, email, tên trường và biệt danh của bé', () => {
    const kinds = detectPii('Gọi mẹ số 0912 345 678, email me@nha.vn, bé Na học Trường Tiểu học Kim Đồng', 'Na').map((h) => h.kind);
    expect(kinds).toEqual(expect.arrayContaining(['số điện thoại', 'email', 'tên trường', 'biệt danh của bé']));
  });

  it('không báo nhầm với văn bản thông thường', () => {
    expect(detectPii('Chú ếch nhảy qua ba chiếc lá sen trong đầm.')).toEqual([]);
  });
});

describe('copyrightHits', () => {
  it('nhận ra nhân vật có bản quyền', () => {
    expect(copyrightHits('Truyện về Doraemon và bạn bè')).toContain('doraemon');
  });
});

describe('revisionInstruction', () => {
  it('ghép chỉ dẫn cố định với ghi chú, cắt ghi chú ở 200 ký tự', () => {
    const text = revisionInstruction('shorten', 'x'.repeat(300));
    expect(text).toMatch(/Rút ngắn/);
    expect(text.length).toBeLessThan(400);
  });

  it('mục đích "Khác" chỉ dùng ghi chú', () => {
    expect(revisionInstruction('custom', '')).toBe('');
  });
});

describe('form yêu cầu', () => {
  const context = { childProfileId: 1, childNickname: 'Na', ageBand: 'Age_6_8', readingLevel: 2, defaultVocabularyLevel: 'level_2', availableVocabularyLevels: ['level_1', 'level_2', 'level_3'], maximumLength: 2000, defaultLanguage: 'vi', interests: [] } as unknown as AIStoryInputContextDto;

  it('gửi bối cảnh khi phụ huynh nhập, và mức từ vựng theo lựa chọn', () => {
    const input = buildCreativeInput({ ...createDefaultFormValues(context), topic: 'Ếch đi chợ', lesson: 'Biết chia sẻ', setting: 'Đầm sen', vocabularyLevel: 'level_3' }, context);
    expect(input.settingMode).toBe('specified');
    expect(input.setting).toBe('Đầm sen');
    expect(input.vocabularyLevel).toBe('level_3');
  });

  it('mặc định độ dài "vừa" theo mức đọc', () => {
    expect(createDefaultFormValues(context).targetLength).toBe(550);
  });
});
