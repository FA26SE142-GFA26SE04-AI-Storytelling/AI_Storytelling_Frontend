import { describe, expect, it } from 'vitest';
import { passwordProblem, presetBlocked } from '@/app/lib/guardian';
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
