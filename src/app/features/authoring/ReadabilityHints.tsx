'use client';
import { useMemo } from 'react';
import { PenLine } from 'lucide-react';

const WORD = /\p{L}+(?:['’-]\p{L}+)?/gu;
const wordCount = (s: string) => s.match(WORD)?.length ?? 0;
/** Backend chỉ coi . ! ? là hết câu (xuống dòng hay dấu … không tính). */
const ENDS = /[.!?]$/;
/** Dấu đóng ngoặc / ngoặc kép ở cuối dòng: dấu chấm phải đứng trước chúng. */
const CLOSERS = /["”’»)\]]+$/;

/** Các dòng có chữ nhưng chưa kết thúc bằng . ! ? (bỏ qua dấu đóng ngoặc ở cuối). */
export function linesMissingEnd(content: string) {
  const lines = content.split('\n').map((l) => l.trim()).filter((l) => wordCount(l) > 0);
  if (lines.length < 2) return [];
  return lines.filter((l) => !ENDS.test(l.replace(CLOSERS, '').trimEnd()));
}

/** Thêm dấu chấm vào cuối mỗi dòng còn thiếu, đặt trước dấu đóng ngoặc nếu có. */
export function addSentenceEnds(content: string) {
  return content.split('\n').map((line) => {
    const body = line.trimEnd();
    if (!wordCount(body)) return line;
    const closer = body.match(CLOSERS)?.[0] ?? '';
    const core = body.slice(0, body.length - closer.length).trimEnd();
    if (ENDS.test(core)) return line;
    return `${core.replace(/[,;:…]+$/, '')}.${closer}`;
  }).join('\n');
}

/**
 * Lưu ý ở bước soạn: dòng thiếu dấu kết câu bị chấm chung thành một câu dài, dễ bị báo "chưa đủ dễ đọc".
 * Có nút thêm dấu chấm một lần cho tất cả (bị khoá theo khung soạn khi bản chỉ xem).
 */
export function SentenceEndHint({ content, onFix }: { content: string; onFix: (next: string) => void }) {
  const missing = useMemo(() => linesMissingEnd(content), [content]);
  if (!missing.length) return null;
  return <div className="pa-hint-end" data-inline-notice>
    <div className="pa-hint-end-txt">
      <b>{missing.length} dòng chưa có dấu kết câu</b>
      <span>Hệ thống chỉ tính hết câu khi có dấu chấm, chấm hỏi hoặc chấm than. Các dòng này sẽ bị gộp thành một câu dài, khiến truyện dễ bị báo khó đọc với bé.</span>
      <ul>{missing.slice(0, 3).map((l) => <li key={l}>“{l}”</li>)}{missing.length > 3 && <li>… và {missing.length - 3} dòng khác</li>}</ul>
    </div>
    <button type="button" className="btn btn-s" onClick={() => onFix(addSentenceEnds(content))}><PenLine className="ic" />Thêm dấu chấm</button>
  </div>;
}

/**
 * Chỉ ra các câu dài nhất để người dùng biết nên rút gọn chỗ nào khi báo "chưa đủ dễ đọc".
 * Backend chấm độ dễ đọc trên cả bài (độ dài câu và tỉ lệ từ dài) và không trả vị trí, nên đây là gợi ý, không phải kết luận từng câu.
 * Câu tách đúng như backend: chỉ theo dấu . ! ? (dòng thiếu dấu bị nối vào câu sau).
 */
export default function ReadabilityHints({ content }: { content: string }) {
  const longest = useMemo(() => (content.match(/[^.!?]+[.!?]*/g) ?? [])
    .map(s => s.replace(/\s+/g, ' ').trim()).map(text => ({ text, words: wordCount(text) }))
    .filter(s => s.words >= 12).sort((a, b) => b.words - a.words).slice(0, 3), [content]);
  if (!longest.length) return null;
  return <div className="pa-hints">
    <b>Các câu dài nhất, nên rút gọn hoặc tách ra</b>
    <ul className="pa-issues">{longest.map(s => <li className="warn" key={s.text}>“{s.text}” <b>({s.words} từ)</b></li>)}</ul>
  </div>;
}
