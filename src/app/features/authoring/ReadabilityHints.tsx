'use client';
import { useMemo } from 'react';

const WORD = /\p{L}+(?:['’-]\p{L}+)?/gu;
const wordCount = (s: string) => s.match(WORD)?.length ?? 0;

/**
 * Chỉ ra các câu dài nhất để người dùng biết nên rút gọn chỗ nào khi báo "chưa đủ dễ đọc".
 * Backend chấm độ dễ đọc trên cả bài (độ dài câu và tỉ lệ từ dài) và không trả vị trí, nên đây là gợi ý, không phải kết luận từng câu.
 * Câu tách theo dấu . ! ? giống cách backend đếm câu.
 */
export default function ReadabilityHints({ content }: { content: string }) {
  const longest = useMemo(() => (content.match(/[^.!?\n]+[.!?]*/g) ?? [])
    .map(s => s.trim()).map(text => ({ text, words: wordCount(text) }))
    .filter(s => s.words >= 12).sort((a, b) => b.words - a.words).slice(0, 3), [content]);
  if (!longest.length) return null;
  return <div className="pa-hints">
    <b>Các câu dài nhất, nên rút gọn hoặc tách ra</b>
    <ul className="pa-issues">{longest.map(s => <li className="warn" key={s.text}>“{s.text}” <b>({s.words} từ)</b></li>)}</ul>
  </div>;
}
