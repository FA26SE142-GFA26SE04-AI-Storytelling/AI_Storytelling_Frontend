import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/services/accessControlService', () => ({ accessControlService: { mine: vi.fn() } }));
vi.mock('@/app/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1, role: 'Administrator', username: 'a' } }) }));

const { AccessNotice, accessOf, StaffAccessProvider, toAccessMap } = await import('@/app/features/staff/staffAccess');
const { default: RoadmapTemplates } = await import('@/app/features/staff/RoadmapTemplates');
const { AdminCreators } = await import('@/app/features/staff/AdminCreators');
const { default: ConnectedModerationQueue } = await import('@/app/features/staff/ConnectedModerationQueue');
const { default: WishCardManagement } = await import('@/app/features/staff/WishCardManagement');
const { default: RubricWorkspace } = await import('@/app/features/staff/RubricWorkspace');

const WHY = 'Còn kiểm duyệt viên';
const map = (entries: Record<string, 'Allowed' | 'Limited' | 'Blocked'>) =>
  toAccessMap(Object.entries(entries).map(([code, state]) => ({ code, state, reason: state === 'Allowed' ? null : WHY })));
const render = (node: React.ReactNode, access: ReturnType<typeof map> | null) =>
  renderToStaticMarkup(<StaffAccessProvider value={access}>{node}</StaffAccessProvider>);

describe('accessOf', () => {
  it('hides unknown codes, but allows everything while access is not loaded', () => {
    expect(accessOf(map({ a: 'Blocked' }), 'a')).toEqual({ state: 'Blocked', reason: WHY });
    expect(accessOf(map({ a: 'Allowed' }), 'b').state).toBe('Hidden');
    expect(accessOf(null, 'b').state).toBe('Allowed');
  });

  it('explains blocked and limited access only', () => {
    expect(renderToStaticMarkup(<AccessNotice access={{ state: 'Blocked', reason: WHY }} />)).toContain('chế độ chỉ xem');
    expect(renderToStaticMarkup(<AccessNotice access={{ state: 'Limited', reason: WHY }} />)).toContain(WHY);
    expect(renderToStaticMarkup(<AccessNotice access={{ state: 'Allowed', reason: null }} />)).toBe('');
  });
});

describe('pages follow access, not role', () => {
  const base = { 'template.roadmap.view': 'Allowed', 'review.roadmap': 'Allowed' } as const;

  it('roadmap authoring tab follows template.roadmap.author for an Administrator', () => {
    expect(render(<RoadmapTemplates />, map(base))).not.toContain('Soạn lộ trình');
    const allowed = render(<RoadmapTemplates />, map({ ...base, 'template.roadmap.author': 'Allowed' }));
    expect(allowed).toContain('Soạn lộ trình');
    expect(allowed).toContain('Tạo lộ trình mới');
    const blocked = render(<RoadmapTemplates />, map({ ...base, 'template.roadmap.author': 'Blocked' }));
    expect(blocked).toContain('Soạn lộ trình');
    expect(blocked).not.toContain('Tạo lộ trình mới');
  });

  it('creator tabs follow their own permission', () => {
    const html = render(<AdminCreators />, map({ 'creator.payout.manage': 'Allowed' }));
    expect(html).toContain('Chi trả');
    expect(html).not.toContain('Đơn đăng ký');
  });

  it('config pages lock write buttons and say why when blocked', () => {
    const wish = render(<WishCardManagement />, map({ 'wishcard.manage': 'Blocked' }));
    expect(wish).toContain(WHY);
    expect(wish).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Thêm thẻ mới"|<button[^>]*aria-label="Thêm thẻ mới"[^>]*disabled=""/);
    const rubric = render(<RubricWorkspace />, map({ 'rubric.manage': 'Blocked' }));
    expect(rubric).toContain(WHY);
    expect(rubric).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Tạo bản nháp"|<button[^>]*aria-label="Tạo bản nháp"[^>]*disabled=""/);
    expect(render(<RubricWorkspace />, map({ 'rubric.manage': 'Allowed' }))).not.toContain(WHY);
  });

  it('fallback queue tells the Administrator why claiming is limited', () => {
    expect(render(<ConnectedModerationQueue />, map({ 'moderation.queue.process': 'Limited', 'review.gray_zone': 'Limited' }))).toContain(WHY);
  });
});
