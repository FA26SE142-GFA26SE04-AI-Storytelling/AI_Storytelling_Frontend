/**
 * Phát hiện thông tin có thể định danh bé/gia đình bằng rule, không dùng AI (Luồng 2 mục 3.3b).
 * Ở phía giao diện chỉ dùng để nhắc phụ huynh trước khi gửi; backend vẫn là nơi kiểm tra chính thức.
 */
export type PiiKind = 'phone' | 'email' | 'link' | 'address' | 'school' | 'nickname';

export interface PiiHint {
  kind: PiiKind;
  match: string;
  /** Biệt danh của bé chỉ cảnh báo nhẹ: phụ huynh có thể chủ ý cho con làm nhân vật. */
  soft: boolean;
}

export const PII_LABEL: Record<PiiKind, string> = {
  phone: 'số điện thoại',
  email: 'email',
  link: 'đường link / tài khoản mạng xã hội',
  address: 'địa chỉ nhà',
  school: 'tên trường, lớp',
  nickname: 'biệt danh của bé',
};

const RULES: [PiiKind, RegExp][] = [
  ['phone', /(?:\+84|\b0)(?:[\s.-]?\d){9,10}\b/g],
  ['email', /[\w.+-]+@[\w-]+\.[\w.]+/g],
  ['link', /\b(?:https?:\/\/|www\.)\S+|\b(?:facebook|fb|zalo|tiktok|instagram|youtube)\.(?:com|me|vn)\/?\S*/gi],
  ['address', /\b(?:số\s*)?\d+[a-z]?(?:\/\d+)*\s+(?:đường|phố|ngõ|hẻm|kiệt)\s+[\p{L}\d ]+|\b(?:phường|quận|xã|huyện)\s+[\p{L}\d]+/giu],
  ['school', /\btrường\s+(?:tiểu học|mầm non|mẫu giáo|thcs|trung học)\s+[\p{L}\d ]+|\blớp\s+\d[a-z]\d?\b/giu],
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function detectPii(text: string, childNickname?: string | null): PiiHint[] {
  const hints: PiiHint[] = [];
  for (const [kind, rule] of RULES) {
    for (const m of text.matchAll(rule)) hints.push({ kind, match: m[0].trim(), soft: false });
  }
  const nickname = childNickname?.trim();
  if (nickname && nickname.length >= 2) {
    // Không dùng \b vì \b của JS không hiểu chữ có dấu tiếng Việt.
    const rule = new RegExp(`(^|[^\\p{L}])${escapeRegExp(nickname)}(?![\\p{L}])`, 'iu');
    if (rule.test(text)) hints.push({ kind: 'nickname', match: nickname, soft: true });
  }
  return hints;
}

/** Một câu nhắc ngắn cho phụ huynh, null nếu không phát hiện gì. */
export function piiMessage(hints: PiiHint[]): string | null {
  if (hints.length === 0) return null;
  const hard = [...new Set(hints.filter((h) => !h.soft).map((h) => PII_LABEL[h.kind]))];
  if (hard.length > 0) return `Có vẻ có ${hard.join(', ')}. Nên bỏ đi để bảo vệ thông tin của bé.`;
  return 'Truyện sẽ dùng biệt danh của bé. Không sao nếu bạn muốn bé làm nhân vật, chỉ cần tránh khi chia sẻ truyện ra cộng đồng.';
}
