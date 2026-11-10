import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { canSubmitWithSafety, creatorSafetyMessage } from '@/app/features/story-workflow/creatorSafety';
import { matchedEvidence } from '@/app/features/story-workflow/moderationEvidence';
import CreatorSafetyPanel from '@/app/features/staff/CreatorSafetyPanel';
import ModerationEvidence from '@/app/features/staff/ModerationEvidence';
import type { CreatorSafetyCheckDto, PublicReviewFlagDto } from '@/app/types/backendContracts';

it.each(['Safe', 'GrayZone'] as const)('permits a current %s result without another AI call', zone => {
  expect(canSubmitWithSafety({ required: true, state: 'Current', zone })).toBe(true);
  const html = renderToStaticMarkup(<CreatorSafetyPanel check={{ required: true, state: 'Current', zone }} busy={false} checkable onCheck={() => { throw new Error('render must not call AI'); }}/>);
  expect(html).not.toContain('<button');
  expect(html).not.toContain('Bạn chờ quyết định');
});
it.each(['NotChecked', 'Stale', 'Unavailable'] as const)('blocks submission and explains %s without calling it a safety rejection', state => {
  const check: CreatorSafetyCheckDto = { required: true, state, zone: null };
  expect(canSubmitWithSafety(check)).toBe(false);
  expect(creatorSafetyMessage(check)).not.toContain('Nội dung bị chặn');
  const html = renderToStaticMarkup(<CreatorSafetyPanel check={check} busy checkable onCheck={() => {}}/>);
  expect(html).toContain('disabled'); expect(html).toContain('Đang kiểm tra');
});
it('preserves disabled-moderation policy but never treats an unknown or HardBlock result as Safe', () => {
  expect(canSubmitWithSafety(undefined)).toBe(false);
  expect(canSubmitWithSafety({ required: true, state: 'Current', zone: 'HardBlock' })).toBe(false);
  expect(canSubmitWithSafety({ required: false, state: 'Unavailable', zone: null })).toBe(true);
  expect(canSubmitWithSafety({ required: false, state: 'Unavailable', zone: 'HardBlock' })).toBe(false);
});
it('explains that Creator GrayZone continues to public review', () => {
  expect(creatorSafetyMessage({ required: true, state: 'Current', zone: 'GrayZone' })).toContain('vẫn có thể hoàn thiện và gửi duyệt');
});
const content = 'Mở đầu. Bé đang buồn. Kết thúc.';
const flag = { evidenceQuote: 'Bé đang buồn.', reason: 'Cần xem ngữ cảnh', contextNote: 'Đọc cả truyện', startOffset: 8, endOffset: 21 } as PublicReviewFlagDto;
it('highlights only evidence that matches the submitted text within valid offsets', () => {
  expect(matchedEvidence(content, flag)?.quote).toBe(flag.evidenceQuote);
  const html = renderToStaticMarkup(<ModerationEvidence flag={flag} content={content}/>);
  expect(html).toContain('<mark'); expect(html).toContain(flag.reason!);
});
it.each([{ startOffset: -1 }, { endOffset: 999 }, { evidenceQuote: 'Không có trong truyện' }, { startOffset: null }])('keeps evidence but does not highlight mismatched positions: %j', patch => {
  const invalid = { ...flag, ...patch };
  expect(matchedEvidence(content, invalid)).toBeNull();
  const html = renderToStaticMarkup(<ModerationEvidence flag={invalid} content={content}/>);
  expect(html).not.toContain('<mark'); expect(html).toContain('đối chiếu trực tiếp');
});
