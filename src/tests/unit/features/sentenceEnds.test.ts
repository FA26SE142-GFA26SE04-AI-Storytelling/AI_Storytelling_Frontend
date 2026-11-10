import { describe, it, expect } from 'vitest';
import { addSentenceEnds, linesMissingEnd } from '@/app/features/authoring/ReadabilityHints';

describe('Dòng thiếu dấu kết câu ở bước soạn', () => {
  const story = 'Ông lão bắt được cá vàng\n\nCá vàng xin ông tha mạng\n\nÔng lão tha cho cá\n\nCá cảm ơn ông';

  it('phát hiện mọi dòng chưa có . ! ?', () => {
    expect(linesMissingEnd(story)).toHaveLength(4);
  });

  it('không báo khi chỉ có một dòng hoặc đã đủ dấu', () => {
    expect(linesMissingEnd('Cá cảm ơn ông')).toEqual([]);
    expect(linesMissingEnd('Ông lão thả cá.\nCá vui quá!\nCá hỏi: ông có khỏe không?')).toEqual([]);
  });

  it('thêm dấu chấm, giữ dòng trống và đặt trước dấu đóng ngoặc', () => {
    expect(addSentenceEnds(story)).toBe('Ông lão bắt được cá vàng.\n\nCá vàng xin ông tha mạng.\n\nÔng lão tha cho cá.\n\nCá cảm ơn ông.');
    expect(addSentenceEnds('Cá nói: “Cảm ơn ông”\nÔng cười…')).toBe('Cá nói: “Cảm ơn ông.”\nÔng cười.');
    expect(linesMissingEnd(addSentenceEnds(story))).toEqual([]);
  });

  it('dòng kết bằng dấu chấm trong ngoặc kép được coi là đủ', () => {
    expect(linesMissingEnd('Cá nói: “Cảm ơn ông.”\nÔng cười.')).toEqual([]);
  });
});
