import { describe, expect, it } from 'vitest';
import { detectPii, piiMessage } from '@/app/features/story-workflow/piiHints';

describe('PII hints (rule-based)', () => {
  it('finds Vietnamese phone numbers, emails and links', () => {
    const kinds = detectPii('Gọi 0912 345 678 hoặc +84 912345678, mail be@nha.vn, xem facebook.com/be.an').map((h) => h.kind);
    expect(kinds).toEqual(expect.arrayContaining(['phone', 'email', 'link']));
    expect(kinds.filter((k) => k === 'phone')).toHaveLength(2);
  });

  it('finds addresses and school names', () => {
    const kinds = detectPii('Nhà ở số 12 đường Lê Lợi, bé học Trường Tiểu học Kim Đồng lớp 2A').map((h) => h.kind);
    expect(kinds).toEqual(expect.arrayContaining(['address', 'school']));
  });

  it('flags the child nickname softly, including accented names', () => {
    const hints = detectPii('Bé Mây đi chơi', 'Mây');
    expect(hints).toEqual([{ kind: 'nickname', match: 'Mây', soft: true }]);
    expect(detectPii('Bầu trời nhiều mây', 'Mây')).toHaveLength(1);
    expect(detectPii('Mâyxanh', 'Mây')).toHaveLength(0);
    expect(piiMessage(hints)).toContain('biệt danh');
  });

  it('stays quiet for ordinary story ideas', () => {
    expect(detectPii('Rùa Bông mang đèn lồng đến hội Trung thu', 'An')).toEqual([]);
    expect(piiMessage([])).toBeNull();
  });

  it('prefers the hard warning when both kinds are present', () => {
    expect(piiMessage(detectPii('Mây gọi 0912345678', 'Mây'))).toContain('số điện thoại');
  });
});
