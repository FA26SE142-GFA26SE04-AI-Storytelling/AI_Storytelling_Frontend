import { describe, expect, it } from 'vitest';
import { signedCredits, validateCreditAdjustment } from '@/app/lib/billing';

describe('validateCreditAdjustment', () => {
  it('accepts non-zero integers with a reason', () => {
    expect(validateCreditAdjustment('3', 'Bù lỗi')).toBeNull();
    expect(validateCreditAdjustment('-2', ' x ')).toBeNull();
  });
  it('rejects zero, decimals, text and empty amount', () => {
    for (const a of ['0', '1.5', 'abc', '', '-0']) expect(validateCreditAdjustment(a, 'x')).not.toBeNull();
  });
  it('requires a trimmed reason of at most 500 chars', () => {
    expect(validateCreditAdjustment('1', '   ')).toBe('Hãy nhập lý do.');
    expect(validateCreditAdjustment('1', 'a'.repeat(500))).toBeNull();
    expect(validateCreditAdjustment('1', 'a'.repeat(501))).not.toBeNull();
  });
  it('formats signed credits', () => {
    expect(signedCredits(3)).toBe('+3');
    expect(signedCredits(-2)).toBe('−2');
  });
});
