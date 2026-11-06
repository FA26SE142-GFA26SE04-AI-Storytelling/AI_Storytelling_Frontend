import { describe, expect, it } from 'vitest';
import { coverFor, joinCover, splitCover } from '@/app/lib/storyView';

describe('Vùng cắt ảnh bìa trong đường dẫn', () => {
  it('ghép rồi tách lại đúng vùng cắt', () => {
    const url = joinCover('https://x.com/a.jpg', { x: 0.1, y: 0.2, w: 0.5, h: 0.6 });
    expect(url).toBe('https://x.com/a.jpg#crop=0.1,0.2,0.5,0.6');
    expect(splitCover(url)).toEqual({ src: 'https://x.com/a.jpg', crop: { x: 0.1, y: 0.2, w: 0.5, h: 0.6 } });
  });
  it('đường dẫn thường không có vùng cắt', () => {
    expect(splitCover('https://x.com/a.jpg')).toEqual({ src: 'https://x.com/a.jpg', crop: null });
    expect(splitCover(null)).toEqual({ src: '', crop: null });
  });
  it('vùng cắt hỏng thì bỏ qua', () => {
    expect(splitCover('https://x.com/a.jpg#crop=0,0,2,0.5').crop).toBeNull();
  });
  it('coverFor phóng đúng vùng: nửa trái-trên của ảnh', () => {
    expect(coverFor('https://x.com/a.jpg#crop=0,0,0.5,0.5')).toContain('0% 0% / 200% 200% no-repeat url("https://x.com/a.jpg")');
  });
  it('coverFor không có ảnh thì dùng ảnh mẫu, không có vùng cắt thì lấy giữa', () => {
    expect(coverFor('')).toContain('default-cover.svg');
    expect(coverFor('https://x.com/a.jpg')).toContain('center / cover no-repeat url("https://x.com/a.jpg")');
  });
});
