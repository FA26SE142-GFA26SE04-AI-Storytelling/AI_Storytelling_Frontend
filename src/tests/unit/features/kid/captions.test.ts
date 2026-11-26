import { describe, expect, it } from 'vitest';
import {
  chunkAt,
  chunkByRatio,
  splitCaptionChunks,
  type CaptionChunk,
} from '@/app/features/kid/captions';

describe('splitCaptionChunks', () => {
  it('chuỗi rỗng hoặc chỉ khoảng trắng trả []', () => {
    expect(splitCaptionChunks('')).toEqual([]);
    expect(splitCaptionChunks('   \n\t  ')).toEqual([]);
  });

  it('chia theo câu (. ! ? … hoặc xuống dòng) và giữ dấu câu trong khúc', () => {
    const text = 'Chào bạn! Tôi là Ếch Cốm. Bạn có vui không? Đầm sen đẹp lắm…\nHôm nay trời nắng.';
    const chunks = splitCaptionChunks(text);

    expect(chunks.map((c) => c.text)).toEqual([
      'Chào bạn!',
      'Tôi là Ếch Cốm.',
      'Bạn có vui không?',
      'Đầm sen đẹp lắm…',
      'Hôm nay trời nắng.',
    ]);
  });

  it('câu dài hơn 90 ký tự bị cắt, mọi khúc <= 90', () => {
    const longSentenceWithComma =
      'Ngày xửa ngày xưa ở một đầm sen xanh biếc rực rỡ sắc màu, có một chú ếch nhỏ mang tên Cốm rất chăm chỉ rèn luyện giọng hát mỗi sớm mai thức dậy.';
    expect(longSentenceWithComma.length).toBeGreaterThan(90);

    const chunks = splitCaptionChunks(longSentenceWithComma, 90);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 90)).toBe(true);
    expect(chunks[0].text.endsWith(',')).toBe(true);
  });

  it('câu dài không có dấu phẩy ưu tiên cắt tại khoảng trắng và từ siêu dài cắt cứng', () => {
    const longSentenceNoPunct =
      'Mot chu ech con dang nhay mua tung tang tren nhung chiec la sen xanh ngat duoi anh nang am ap cua buoi sang mua ha ruc ro';
    expect(longSentenceNoPunct.length).toBeGreaterThan(90);

    const spaceChunks = splitCaptionChunks(longSentenceNoPunct, 90);
    expect(spaceChunks.every((c) => c.text.length <= 90)).toBe(true);

    const hardWord = 'A'.repeat(120);
    const hardChunks = splitCaptionChunks(hardWord, 50);
    expect(hardChunks.map((c) => c.text)).toEqual(['A'.repeat(50), 'A'.repeat(50), 'A'.repeat(20)]);
  });

  it('start/end khớp text === original.slice(start, end) và không dính khoảng trắng đầu/cuối', () => {
    const original =
      '  Xin chào các bạn nhỏ!   Hôm nay chúng mình cùng nghe chuyện nhé, một câu chuyện thật là vui vẻ và bổ ích...  ';
    const chunks = splitCaptionChunks(original, 50);

    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(original.slice(chunk.start, chunk.end)).toBe(chunk.text);
      expect(chunk.text).toBe(chunk.text.trim());
    }
  });
});

describe('chunkAt', () => {
  const sampleChunks: CaptionChunk[] = [
    { start: 5, end: 15, text: 'Khúc đầu' },
    { start: 20, end: 35, text: 'Khúc giữa' },
    { start: 40, end: 55, text: 'Khúc cuối' },
  ];

  it('mảng rỗng trả -1', () => {
    expect(chunkAt([], 10)).toBe(-1);
  });

  it('offset âm hoặc nhỏ hơn start khúc đầu trả 0', () => {
    expect(chunkAt(sampleChunks, -10)).toBe(0);
    expect(chunkAt(sampleChunks, 0)).toBe(0);
    expect(chunkAt(sampleChunks, 4)).toBe(0);
  });

  it('offset ở đầu, giữa và cuối trong phạm vi một khúc', () => {
    expect(chunkAt(sampleChunks, 5)).toBe(0);
    expect(chunkAt(sampleChunks, 10)).toBe(0);
    expect(chunkAt(sampleChunks, 14)).toBe(0);

    expect(chunkAt(sampleChunks, 20)).toBe(1);
    expect(chunkAt(sampleChunks, 27)).toBe(1);
    expect(chunkAt(sampleChunks, 34)).toBe(1);

    expect(chunkAt(sampleChunks, 40)).toBe(2);
    expect(chunkAt(sampleChunks, 47)).toBe(2);
    expect(chunkAt(sampleChunks, 54)).toBe(2);
  });

  it('offset rơi vào khoảng trống giữa hai khúc trả khúc ngay trước đó', () => {
    expect(chunkAt(sampleChunks, 15)).toBe(0);
    expect(chunkAt(sampleChunks, 19)).toBe(0);
    expect(chunkAt(sampleChunks, 35)).toBe(1);
    expect(chunkAt(sampleChunks, 39)).toBe(1);
  });

  it('offset chạm hoặc vượt quá cuối khúc cuối trả khúc cuối', () => {
    expect(chunkAt(sampleChunks, 55)).toBe(2);
    expect(chunkAt(sampleChunks, 100)).toBe(2);
  });
});

describe('chunkByRatio', () => {
  const sampleChunks: CaptionChunk[] = [
    { start: 0, end: 10, text: 'A' },
    { start: 10, end: 20, text: 'B' },
    { start: 20, end: 30, text: 'C' },
    { start: 30, end: 40, text: 'D' },
  ];

  it('mảng rỗng trả -1', () => {
    expect(chunkByRatio([], 0.5)).toBe(-1);
  });

  it('ratio = 0 trả 0', () => {
    expect(chunkByRatio(sampleChunks, 0)).toBe(0);
  });

  it('ratio = 0.5 trả đúng vị trí giữa', () => {
    expect(chunkByRatio(sampleChunks, 0.5)).toBe(2);
  });

  it('ratio = 1 trả chỉ số cuối cùng (n - 1)', () => {
    expect(chunkByRatio(sampleChunks, 1)).toBe(3);
  });

  it('ratio > 1 được kẹp về 1', () => {
    expect(chunkByRatio(sampleChunks, 1.5)).toBe(3);
    expect(chunkByRatio(sampleChunks, 99)).toBe(3);
  });

  it('ratio < 0 hoặc NaN được kẹp/coi như 0', () => {
    expect(chunkByRatio(sampleChunks, -0.5)).toBe(0);
    expect(chunkByRatio(sampleChunks, Number.NaN)).toBe(0);
  });
});
