import { describe, expect, it } from 'vitest';
import { auditStateRows } from '@/app/features/staff/readableJson';
import { regenerationMessage } from '@/app/lib/storyRules';

describe('auditStateRows', () => {
  it('flattens before/after JSON into fields and marks changes', () => {
    const rows = auditStateRows('{"tier":"Standard","account":{"bank":"VCB"},"tags":["a","b"]}', '{"tier":"Partner","account":{"bank":"VCB"},"ok":true}');
    expect(rows).toEqual([
      { field: 'tier', before: 'Standard', after: 'Partner', changed: true },
      { field: 'account.bank', before: 'VCB', after: 'VCB', changed: false },
      { field: 'tags', before: 'a, b', after: '—', changed: true },
      { field: 'ok', before: '—', after: 'Có', changed: true },
    ]);
  });

  it('keeps plain text and empty states readable', () => {
    expect(auditStateRows(null, 'not json')).toEqual([{ field: 'Giá trị', before: '—', after: 'not json', changed: true }]);
    expect(auditStateRows(null, null)).toEqual([]);
    expect(auditStateRows('{"items":[{"id":1}]}', null)[0].field).toBe('items[1].id');
  });
});

describe('regenerationMessage', () => {
  it('strips the backend limit code only', () => {
    expect(regenerationMessage('REGENERATION_LIMIT_REACHED: đã dùng hết 3 lần.')).toBe('Đã dùng hết 3 lần.');
    expect(regenerationMessage('PARENT_STORY_FINALIZED: x')).toBe('PARENT_STORY_FINALIZED: x');
  });
});
