import { describe, expect, it } from 'vitest';
import type { GuidePlaceholder } from '@/app/types/backendContracts';
import {
  extractTemplateKeys,
  mergePlaceholders,
  validatePlaceholders,
  toPlaceholderPayload,
  PLACEHOLDER_LABEL_MAX,
  PLACEHOLDER_HINT_MAX,
} from '@/app/features/staff/GuideItemEditor';

describe('extractTemplateKeys', () => {
  it('trả về mảng rỗng khi templateText là null hoặc chuỗi rỗng', () => {
    expect(extractTemplateKeys(null)).toEqual([]);
    expect(extractTemplateKeys('')).toEqual([]);
  });

  it('trích xuất đúng danh sách key không trùng lặp theo thứ tự xuất hiện', () => {
    expect(extractTemplateKeys('Bé {{name}} và {{name}} đi {{place}}')).toEqual(['name', 'place']);
  });

  it('chỉ lấy key gồm chữ thường và dấu gạch dưới, bỏ qua key có số hoặc ký tự không hợp lệ', () => {
    expect(extractTemplateKeys('Bé {{name}} và {{name}} đi {{place_1}}')).toEqual(['name']);
  });
});

describe('mergePlaceholders', () => {
  it('giữ label/hint của key còn tồn tại, thêm key mới với label/hint null, và loại bỏ key không còn trong template', () => {
    const prev: GuidePlaceholder[] = [
      { key: 'name', label: 'Tên bé', hint: 'Nhập tên' },
      { key: 'old', label: 'Cũ', hint: null },
    ];
    const text = 'Bé {{name}} {{new}}';
    expect(mergePlaceholders(prev, text)).toEqual([
      { key: 'name', label: 'Tên bé', hint: 'Nhập tên' },
      { key: 'new', label: null, hint: null },
    ]);
  });
});

describe('validatePlaceholders', () => {
  it('trả về null khi danh sách rỗng', () => {
    expect(validatePlaceholders([])).toBeNull();
  });

  it('báo lỗi chứa {{name}} khi label là null', () => {
    const list: GuidePlaceholder[] = [{ key: 'name', label: null, hint: null }];
    const error = validatePlaceholders(list);
    expect(error).not.toBeNull();
    expect(error).toContain('{{name}}');
  });

  it('báo lỗi khi label chỉ chứa khoảng trắng', () => {
    const list: GuidePlaceholder[] = [{ key: 'name', label: '   ', hint: null }];
    expect(validatePlaceholders(list)).not.toBeNull();
  });

  it('báo lỗi khi label dài hơn PLACEHOLDER_LABEL_MAX ký tự', () => {
    const list: GuidePlaceholder[] = [
      { key: 'name', label: 'a'.repeat(PLACEHOLDER_LABEL_MAX + 1), hint: null },
    ];
    expect(validatePlaceholders(list)).not.toBeNull();
  });

  it('hợp lệ khi label có đúng PLACEHOLDER_LABEL_MAX ký tự', () => {
    const list: GuidePlaceholder[] = [
      { key: 'name', label: 'a'.repeat(PLACEHOLDER_LABEL_MAX), hint: null },
    ];
    expect(validatePlaceholders(list)).toBeNull();
  });

  it('báo lỗi khi hint dài hơn PLACEHOLDER_HINT_MAX ký tự', () => {
    const list: GuidePlaceholder[] = [
      { key: 'name', label: 'Tên bé', hint: 'b'.repeat(PLACEHOLDER_HINT_MAX + 1) },
    ];
    expect(validatePlaceholders(list)).not.toBeNull();
  });

  it('hợp lệ khi hint là null và label hợp lệ', () => {
    const list: GuidePlaceholder[] = [{ key: 'name', label: 'Tên bé', hint: null }];
    expect(validatePlaceholders(list)).toBeNull();
  });
});

describe('toPlaceholderPayload', () => {
  it('trim khoảng trắng cho label và hint, chuyển hint rỗng thành null', () => {
    const input: GuidePlaceholder[] = [{ key: 'name', label: '  Tên bé ', hint: '  ' }];
    expect(toPlaceholderPayload(input)).toEqual([
      { key: 'name', label: 'Tên bé', hint: null },
    ]);
  });

  it('trim nội dung của hint khi hint có giá trị', () => {
    const input: GuidePlaceholder[] = [{ key: 'name', label: 'Tên bé', hint: '  Gợi ý nhập  ' }];
    expect(toPlaceholderPayload(input)).toEqual([
      { key: 'name', label: 'Tên bé', hint: 'Gợi ý nhập' },
    ]);
  });
});
