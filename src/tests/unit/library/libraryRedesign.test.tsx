import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BookCover from '@/app/features/library/BookCover';
import { EMPTY_FILTER, isFiltering } from '@/app/features/library/LegacyLibraryFilters';
import { ageLabel } from '@/app/lib/storyView';

describe('BookCover', () => {
  it('truyện chưa có bìa: dùng ảnh mẫu và in tên truyện lên bìa', () => {
    const html = renderToStaticMarkup(<BookCover title="Cây tre trăm đốt" seed={3} />);
    expect(html).toContain('src="/default-cover.svg"');
    expect(html).toContain('bkc-default');
    expect(html).toContain('Cây tre trăm đốt');
  });

  it('bìa có vùng cắt: phóng ảnh để vùng cắt lấp đầy khung, không gửi phần #crop lên máy chủ ảnh', () => {
    const html = renderToStaticMarkup(<BookCover url="https://cdn.example/a.jpg#crop=0.25,0,0.5,1" title="Thạch Sanh" seed={1} />);
    expect(html).toContain('src="https://cdn.example/a.jpg"');
    expect(html).toContain('width:200%');
    expect(html).toContain('left:-50%');
    expect(html).not.toContain('bkc-name');
  });
});

describe('bộ lọc thư viện', () => {
  it('chỉ đổi cách sắp xếp thì không tính là đang lọc', () => {
    expect(isFiltering(EMPTY_FILTER)).toBe(false);
    expect(isFiltering({ ...EMPTY_FILTER, sort: 'views' })).toBe(false);
    expect(isFiltering({ ...EMPTY_FILTER, q: '  ' })).toBe(false);
    expect(isFiltering({ ...EMPTY_FILTER, age: 'Age_6_8' })).toBe(true);
    expect(isFiltering({ ...EMPTY_FILTER, q: 'tre' })).toBe(true);
  });

  it('nhãn tuổi dùng gạch nối dài cho cả dạng "6-8"', () => {
    expect(ageLabel('6-8')).toBe('6–8 tuổi');
    expect(ageLabel('Age_9_10')).toBe('9–10 tuổi');
  });
});
