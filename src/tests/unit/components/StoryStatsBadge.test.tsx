import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StoryStatsBadge } from '@/app/components/StoryStatsBadge';

/**
 * Giả lập helper render tương tự @testing-library/react cho môi trường Node/SSR,
 * giữ kiểu dùng renderToStaticMarkup đồng bộ với các test khác trong tests/unit/components/
 */
function render(ui: React.ReactElement) {
  const html = renderToStaticMarkup(ui);
  return {
    html,
    container: {
      innerHTML: html,
      querySelector: (selector: string) => {
        if (selector === '.story-stats-heart') {
          return html.includes('story-stats-heart') ? { className: 'story-stats-heart' } : null;
        }
        return null;
      },
    },
  };
}

describe('StoryStatsBadge', () => {
  it('viewCount=1234, favoriteCount=56: hiện "1.234" và "56" (toLocaleString vi-VN); aria-label chứa "lượt đọc" và "lượt yêu thích"', () => {
    const { html } = render(<StoryStatsBadge viewCount={1234} favoriteCount={56} />);

    expect(html).toContain('1.234');
    expect(html).toContain('56');
    expect(html).toContain('lượt đọc');
    expect(html).toContain('lượt yêu thích');
    expect(html).toContain('aria-label="1.234 lượt đọc, 56 lượt yêu thích"');
    expect(html).toContain('story-stats-heart');
  });

  it('cả hai null/undefined: container rỗng (không render gì)', () => {
    expect(render(<StoryStatsBadge viewCount={null} favoriteCount={null} />).html).toBe('');
    expect(render(<StoryStatsBadge viewCount={undefined} favoriteCount={undefined} />).html).toBe('');
    expect(render(<StoryStatsBadge viewCount={null} favoriteCount={undefined} />).html).toBe('');
    expect(render(<StoryStatsBadge />).html).toBe('');
  });

  it('chỉ viewCount=3, favoriteCount=null: chỉ hiện "3", không có icon tim (không có phần tử .story-stats-heart)', () => {
    const { html, container } = render(<StoryStatsBadge viewCount={3} favoriteCount={null} />);

    expect(html).toContain('3');
    expect(html).toContain('lượt đọc');
    expect(html).not.toContain('lượt yêu thích');
    expect(html).not.toContain('story-stats-heart');
    expect(container.querySelector('.story-stats-heart')).toBeNull();
  });
});
