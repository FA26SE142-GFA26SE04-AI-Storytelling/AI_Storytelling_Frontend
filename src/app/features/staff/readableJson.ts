/**
 * Backend lưu một số dữ liệu kiểm duyệt dưới dạng chuỗi JSON (ghi chú hệ thống, lịch sử bộ tiêu chí).
 * Các hàm ở đây đổi chúng thành câu tiếng Việt để không bao giờ hiện JSON thô ra giao diện.
 */
import { formatFlagCriterion, formatFlagKind, formatFlagName, formatFlagReason } from './moderationFlagDisplay';

type Obj = Record<string, unknown>;

const parse = (raw: string | null | undefined): unknown => {
  const text = (raw ?? '').trim();
  if (!text || !/^[[{]/.test(text)) return undefined;
  try { return JSON.parse(text); } catch { return undefined; }
};
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
/** Đọc khoá không phân biệt hoa thường (backend có chỗ dùng camelCase, có chỗ PascalCase). */
const get = (o: unknown, key: string): unknown => {
  if (!isObj(o)) return undefined;
  const k = Object.keys(o).find((x) => x.toLowerCase() === key.toLowerCase());
  return k === undefined ? undefined : o[k];
};
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const short = (s: string, max = 120) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** Trích xuất lý do Creator yêu cầu gỡ từ trường JSON `Flags.requestReason` (trả về null nếu trống hoặc không hợp lệ). */
export function extractRemovalRequestReason(raw: string | null | undefined): string | null {
  const text = (raw ?? '').trim();
  if (!text) return null;
  if (/^[[{]/.test(text)) {
    const v = parse(text);
    if (!isObj(v)) return null;
    return str(get(v, 'requestReason')) || str(get(v, 'reason')) || null;
  }
  return text;
}

const ZONE: Record<string, string> = { Safe: 'An toàn', GrayZone: 'Vùng xám, cần người duyệt', HardBlock: 'Bị chặn', '1': 'An toàn', '2': 'Vùng xám, cần người duyệt', '3': 'Bị chặn' };

/** Ghi chú hệ thống của một mục trong hàng đợi kiểm duyệt. Không phải JSON thì giữ nguyên chữ. */
export function flagsSummary(raw: string | null | undefined): string {
  const text = (raw ?? '').trim();
  if (!text) return '';
  const v = parse(text);
  if (v === undefined) return text;
  if (!isObj(v)) return '';
  const lines: string[] = [];
  const reason = str(get(v, 'requestReason'));
  if (reason) lines.push(reason);
  const zone = str(get(v, 'zone'));
  if (zone) lines.push(`Kết luận của AI: ${ZONE[zone] ?? zone}`);
  const risk = get(v, 'riskScore');
  if (typeof risk === 'number') lines.push(`Mức rủi ro: ${Math.round(risk * 100) / 100}`);
  const quality = get(v, 'qualityPassed');
  if (typeof quality === 'boolean') lines.push(`Kiểm tra chất lượng: ${quality ? 'Đạt' : 'Chưa đạt'}`);
  const findings = get(v, 'findings');
  if (Array.isArray(findings) && findings.length) {
    lines.push('Điểm cần xem:');
    for (const f of findings) {
      const kind = str(get(f, 'kind'));
      const rawName = str(get(f, 'name'));
      const rawCategory = str(get(f, 'criterionCode')) || str(get(f, 'category'));
      const name = rawName ? formatFlagName(rawName, kind) : (formatFlagCriterion(rawCategory) || formatFlagKind(kind) || '');
      const rawWhy = str(get(f, 'reason'));
      const why = rawWhy ? formatFlagReason(rawWhy) : '';
      const quote = str(get(f, 'evidenceQuote'));
      lines.push(`• ${[name, why].filter(Boolean).join(': ')}${quote ? ` (“${short(quote, 90)}”)` : ''}`);
    }
  }
  const sections = get(v, 'sections');
  if (Array.isArray(sections) && sections.length) {
    lines.push(`Phần cần rà soát: ${sections.map((s) => formatFlagName(str(s), 'section')).filter(Boolean).join(', ')}`);
  }
  const artifacts = get(v, 'artifacts');
  if (Array.isArray(artifacts) && artifacts.length) {
    lines.push(`Học liệu cần rà soát: ${artifacts.map((a) => formatFlagName(str(a), 'artifact')).filter(Boolean).join(', ')}`);
  }
  const rawSummaryReason = str(get(v, 'reason'));
  if (!(Array.isArray(findings) && findings.length) && rawSummaryReason) {
    lines.push(formatFlagReason(rawSummaryReason));
  }
  const scores = get(v, 'scores');
  if (Array.isArray(scores) && scores.length) {
    const parts = scores
      .map((s) => {
        const code = formatFlagCriterion(str(get(s, 'code'))) ?? str(get(s, 'code'));
        return `${code} mức ${str(get(s, 'level'))}`;
      })
      .filter((p) => !p.startsWith(' '));
    if (parts.length) lines.push(`Điểm theo tiêu chí: ${parts.join(', ')}`);
  }
  const resolved = get(v, 'resolved');
  if (Array.isArray(resolved) && resolved.length) {
    lines.push(`Đã xử lý ${resolved.length} cảnh báo:`);
    for (const r of resolved) { const why = str(get(r, 'reason')); if (why) lines.push(`• ${why}`); }
  }
  return lines.join('\n');
}

const AUDIT_ACTION: Record<string, string> = {
  Created: 'Tạo bộ tiêu chí', Updated: 'Sửa bộ tiêu chí', Cloned: 'Nhân bản', Deleted: 'Xoá bản nháp',
  Retired: 'Ngừng dùng', Activated: 'Kích hoạt', Evaluated: 'Chạy thử đánh giá', Validated: 'Kiểm tra',
};
export const auditActionLabel = (action: string) => AUDIT_ACTION[action] ?? action;

const STATUS: Record<string, string> = { Draft: 'Bản nháp', Active: 'Đang dùng', Retired: 'Đã ngừng' };
const show = (v: unknown) => { const s = str(v); return s ? `“${short(STATUS[s] ?? s, 80)}”` : '(trống)'; };

/** Các dòng mô tả thay đổi của một bản ghi lịch sử bộ tiêu chí (so sánh bản trước và bản sau). */
export function rubricAuditLines(beforeJson: string | null, afterJson: string | null): string[] {
  const before = parse(beforeJson), after = parse(afterJson);
  const lines: string[] = [];
  const diff = (label: string, a: unknown, b: unknown) => { if (str(a) !== str(b)) lines.push(`${label}: ${show(a)} → ${show(b)}`); };
  if (isObj(after) && get(after, 'riskScore') !== undefined && !get(after, 'definition')) {
    lines.push(`Mức rủi ro: ${str(get(after, 'riskScore'))}`);
    const model = str(get(after, 'model')); if (model) lines.push(`Mô hình AI: ${model}`);
    return lines;
  }
  const source = get(before, 'sourceId');
  if (source !== undefined) lines.push(`Nhân bản từ bộ #${str(source)}`);
  if (!isObj(after)) return lines;
  if (!isObj(before) || source !== undefined) {
    lines.push(`Tên bộ: ${show(get(after, 'name'))}`, `Phiên bản: ${show(get(after, 'versionNo'))}`);
    return lines;
  }
  diff('Tên bộ', get(before, 'name'), get(after, 'name'));
  diff('Phiên bản', get(before, 'versionNo'), get(after, 'versionNo'));
  diff('Trạng thái', get(before, 'status'), get(after, 'status'));
  const bd = get(before, 'definition'), ad = get(after, 'definition');
  diff('Mục đích', get(bd, 'purpose'), get(ad, 'purpose'));
  const bc = get(bd, 'criteria'), ac = get(ad, 'criteria');
  if (Array.isArray(ac)) ac.forEach((c, i) => {
    const old = Array.isArray(bc) ? bc.find((x) => str(get(x, 'code')) === str(get(c, 'code'))) ?? bc[i] : undefined;
    const code = str(get(c, 'code')) || `Tiêu chí ${i + 1}`;
    diff(`${code} · tên`, get(old, 'name'), get(c, 'name'));
    diff(`${code} · cách đánh giá`, get(old, 'check'), get(c, 'check'));
    diff(`${code} · ngữ cảnh`, get(old, 'context'), get(c, 'context'));
    const levels = get(c, 'levels');
    if (isObj(levels)) for (const k of Object.keys(levels)) diff(`${code} · mức ${k}`, get(get(old, 'levels'), k), levels[k]);
    const ex = (x: unknown) => { const e = get(x, 'examples'); return Array.isArray(e) ? e.length : 0; };
    if (ex(old) !== ex(c)) lines.push(`${code} · số ví dụ: ${ex(old)} → ${ex(c)}`);
  });
  return lines;
}
