import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OutlineHistoryPanel, OutlineHistoryPanelProps, AIStoryOutlineHistory } from '../../../app/components/closet/subcomponents/AIStoryOutlineHistory';
import { OutlineVersionDto } from '../../../app/types/aiStory';

const version: OutlineVersionDto = {
  id: 12, versionNo: 2, editType: 'Initial', title: 'Tình bạn', opening: 'Hai bạn gặp nhau',
  development: 'Cùng giúp đỡ', ending: 'Biết sẻ chia', isCurrent: true, editorUserId: null,
  outlineApprovedByUserId: null, outlineApprovedAt: null, createdAt: '2026-10-01T00:00:00Z',
};
const props: OutlineHistoryPanelProps = {
  versions: [version], selectedVersionNo: 2, selectedVersion: version, loading: false,
  detailLoading: false, error: null, onSelect: () => {}, onRefresh: () => {},
};
const render = (updates: Partial<OutlineHistoryPanelProps> = {}) => renderToStaticMarkup(<OutlineHistoryPanel {...props} {...updates} />);

describe('outline history UI', () => {
  it('starts closed without exposing an unloaded preview', () => {
    const html = renderToStaticMarkup(<AIStoryOutlineHistory storyId={23} />);
    expect(html).toContain('Lịch sử dàn ý');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('Phiên bản dàn ý');
  });
  it('shows the version selector and real outline text, without mutation controls', () => {
    const html = render();
    expect(html).toContain('Phiên bản 2 · Hiện hành');
    expect(html).toContain('Hai bạn gặp nhau');
    expect(html).toContain('Cùng giúp đỡ');
    expect(html).toContain('Biết sẻ chia');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('Bắt đầu viết toàn văn');
    expect(html).not.toContain('Lưu dàn ý');
  });
  it('labels historical approved versions as read-only', () => {
    const old = { ...version, isCurrent: false, outlineApprovedAt: '2026-10-01T01:00:00Z' };
    const html = render({ versions: [old], selectedVersion: old });
    expect(html).toContain('Bản lịch sử — chỉ xem');
    expect(html).toContain('Đã duyệt');
  });
  it('hides preview while the selected detail is loading', () => {
    const html = render({ detailLoading: true });
    expect(html).toContain('Đang tải phiên bản đã chọn');
    expect(html).not.toContain('Hai bạn gặp nhau');
  });
  it('shows empty history and API errors without invented outlines', () => {
    expect(render({ versions: [], selectedVersion: null })).toContain('Chưa có dàn ý nào được lưu');
    const html = render({ versions: null, selectedVersion: null, error: 'Không có quyền xem dàn ý.' });
    expect(html).toContain('role="alert"');
    expect(html).toContain('Không có quyền xem dàn ý.');
    expect(html).not.toContain('Hai bạn gặp nhau');
  });
});
