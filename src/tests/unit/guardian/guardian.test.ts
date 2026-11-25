import { describe, expect, it } from 'vitest';
import { LEVEL_MODE_STORY_CAP, effectiveStoryLength, groupCategories, passwordProblem, presetBlocked, storyLengthAdvice, storyLengthUpperBound } from '@/app/lib/guardian';
import { normalizeRule } from '@/app/features/children/SafetyBlocks';
import type { ContentCategory } from '@/app/types/childProfile';

const cat = (id: number, code: string, displayName: string): ContentCategory => ({ id, code, displayName, isActive: true });
const CATS = [
  cat(1, 'ANIMALS', 'Động vật'),
  cat(2, 'VIOLENCE', 'Bạo lực'),
  cat(3, 'HORROR', 'Ma quỷ, kinh dị'),
  cat(4, 'MILD_FEAR', 'Gây sợ hãi nhẹ'),
  cat(5, 'RELIGION', 'Tôn giáo'),
  cat(6, 'FRIENDSHIP', 'Tình bạn'),
];

describe('presetBlocked', () => {
  it('ưu tiên danh sách chặn mặc định do backend gắn cho từng danh mục', () => {
    const fromApi: ContentCategory[] = [
      { ...cat(1, 'ANIMALS', 'Động vật'), defaultBlockedAgeBands: [] },
      { ...cat(4, 'MILD_FEAR', 'Gây sợ hãi nhẹ'), defaultBlockedAgeBands: ['Age_6_8'] },
      { ...cat(5, 'RELIGION', 'Tôn giáo'), defaultBlockedAgeBands: ['Age_6_8', 'Age_9_10'] },
    ];
    expect(presetBlocked(fromApi, 'Age_6_8')).toEqual([4, 5]);
    expect(presetBlocked(fromApi, 'Age_9_10')).toEqual([5]);
  });

  it('chặn nội dung nhạy cảm cho mọi nhóm tuổi', () => {
    expect(presetBlocked(CATS, 'Age_9_10')).toEqual([2, 3, 5]);
  });

  it('nhóm 6–8 tuổi chặn thêm nội dung gây sợ hãi nhẹ', () => {
    expect(presetBlocked(CATS, 'Age_6_8')).toEqual([2, 3, 4, 5]);
  });

  it('không chặn danh mục thông thường', () => {
    expect(presetBlocked([cat(1, 'ANIMALS', 'Động vật'), cat(6, 'FAMILY', 'Gia đình')], 'Age_6_8')).toEqual([]);
  });
});

describe('groupCategories', () => {
  const g = (id: number, group?: string): ContentCategory => ({ ...cat(id, `C${id}`, `Chủ đề ${id}`), group: group as ContentCategory['group'] });

  it('chia theo nhóm backend trả về, đúng thứ tự nhóm và giữ thứ tự trong nhóm', () => {
    const out = groupCategories([g(1, 'SafetyWarning'), g(2, 'Genre'), g(3, 'Learning'), g(4, 'Genre'), g(5, 'LifeValue')]);
    expect(out.map((s) => s.id)).toEqual(['Genre', 'LifeValue', 'Learning', 'SafetyWarning']);
    expect(out[0].items.map((c) => c.id)).toEqual([2, 4]);
  });

  it('bỏ nhóm rỗng và gom danh mục thiếu hoặc lạ nhóm vào "Khác" ở cuối', () => {
    const out = groupCategories([g(1), g(2, 'Genre'), g(3, 'Unknown')]);
    expect(out.map((s) => s.id)).toEqual(['Genre', 'Other']);
    expect(out[1].items.map((c) => c.id)).toEqual([1, 3]);
  });

  it('không có danh mục thì không có nhóm nào', () => {
    expect(groupCategories([])).toEqual([]);
  });
});

describe('passwordProblem', () => {
  it('yêu cầu ít nhất 8 ký tự', () => {
    expect(passwordProblem('abc123')).toMatch(/8 ký tự/);
  });

  it('yêu cầu có cả chữ và số', () => {
    expect(passwordProblem('abcdefgh')).toMatch(/chữ và số/);
    expect(passwordProblem('12345678')).toMatch(/chữ và số/);
  });

  it('chấp nhận mật khẩu hợp lệ', () => {
    expect(passwordProblem('meobong2026')).toBeNull();
  });
});

describe('normalizeRule', () => {
  it('coi mức Hạn chế cũ là Chặn', () => {
    expect(normalizeRule('Restricted')).toBe('Blocked');
    expect(normalizeRule('Allowed')).toBe('Allowed');
  });
});

describe('effectiveStoryLength', () => {
  it('theo mức đọc khi chưa tự chỉnh: 900 cho bé 6–8 tuổi mức 1–3, 1500 cho mức 4–5 hoặc 9–10 tuổi', () => {
    expect(effectiveStoryLength('Age_6_8', 2, null, 2000)).toEqual({ value: 900, custom: false });
    expect(effectiveStoryLength('Age_6_8', 4, undefined, 2000)).toEqual({ value: 1500, custom: false });
    expect(effectiveStoryLength('Age_9_10', 1, null, 2000)).toEqual({ value: 1500, custom: false });
  });

  it('ưu tiên số phụ huynh tự chỉnh', () => {
    expect(effectiveStoryLength('Age_6_8', 2, 1200, 1320)).toEqual({ value: 1200, custom: true });
  });

  it('giới hạn cũ thấp hơn mặc định được coi là tự chỉnh bằng đúng giới hạn đó (khớp backend StoryLengthRules)', () => {
    expect(effectiveStoryLength('Age_6_8', 2, null, 700)).toEqual({ value: 700, custom: true });
  });

  it('trần bằng hoặc cao hơn mặc định thì vẫn là theo mức đọc', () => {
    expect(effectiveStoryLength('Age_6_8', 2, null, 900)).toEqual({ value: 900, custom: false });
  });

  it('trần lưu ở chế độ theo mức đọc không bao giờ bị coi là giới hạn cũ, kể cả khi mức đọc hoặc nhóm tuổi tăng lên', () => {
    expect(effectiveStoryLength('Age_6_8', 4, null, LEVEL_MODE_STORY_CAP)).toEqual({ value: 1500, custom: false });
    expect(effectiveStoryLength('Age_6_8', 2, null, LEVEL_MODE_STORY_CAP)).toEqual({ value: 900, custom: false });
    expect(effectiveStoryLength('Age_9_10', 3, null, LEVEL_MODE_STORY_CAP)).toEqual({ value: 1500, custom: false });
  });
});

describe('storyLengthUpperBound', () => {
  it('110% làm tròn lên bằng số nguyên, khớp backend (không lệch do số thực)', () => {
    expect(storyLengthUpperBound(900)).toBe(990);
    expect(storyLengthUpperBound(1500)).toBe(1650);
    expect(storyLengthUpperBound(1200)).toBe(1320);
    expect(storyLengthUpperBound(101)).toBe(112);
  });
});

describe('LEVEL_MODE_STORY_CAP', () => {
  it('phủ độ dài mặc định lớn nhất (1500 từ)', () => {
    expect(LEVEL_MODE_STORY_CAP).toBe(1650);
  });
});

describe('storyLengthAdvice', () => {
  it('không cảnh báo khi bằng, ngắn hơn hoặc dài không quá 110% mức mặc định', () => {
    expect(storyLengthAdvice('Age_6_8', 2, 600)).toBeNull();
    expect(storyLengthAdvice('Age_6_8', 2, 900)).toBeNull();
    expect(storyLengthAdvice('Age_6_8', 2, 990)).toBeNull();
  });

  it('cảnh báo dài hơn mức phù hợp, nêu nhóm tuổi của bé và việc tạo truyện lâu hơn', () => {
    const advice = storyLengthAdvice('Age_6_8', 2, 1200);
    expect(advice?.severity).toBe('long');
    expect(advice?.text).toContain('6–8 tuổi');
    expect(advice?.text).toMatch(/thời gian/);
  });

  it('cảnh báo rất dài khi vượt 150% mức mặc định', () => {
    const advice = storyLengthAdvice('Age_6_8', 2, 1400);
    expect(advice?.severity).toBe('very-long');
    expect(advice?.text).toMatch(/Rất dài/);
    expect(advice?.text).toMatch(/duyệt/);
  });

  it('so với mức mặc định của bé 9–10 tuổi (1500), không phải 900', () => {
    expect(storyLengthAdvice('Age_9_10', 3, 1500)).toBeNull();
    expect(storyLengthAdvice('Age_9_10', 3, 1700)?.severity).toBe('long');
    expect(storyLengthAdvice('Age_9_10', 3, 2300)?.severity).toBe('very-long');
  });
});
