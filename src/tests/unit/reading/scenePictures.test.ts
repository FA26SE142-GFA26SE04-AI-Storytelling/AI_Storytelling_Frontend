import { describe, expect, it } from 'vitest';
import { charInSegment, parseWordTimings, pictureAt, pictureParts, scenePictures, secondsAtChar, segmentStarts, wordAt } from '@/app/features/kid/scenePictures';
import type { ReadingScene } from '@/app/types/childReading';

const text = 'Thỏ ra vườn. Thỏ thấy cà rốt. Thỏ chia cho bạn.';
const scene = (over: Partial<ReadingScene> = {}): ReadingScene => ({
  sceneId: 1, sceneIndex: 0, text, illustrationUrl: 'one.png', interaction: null, attemptedInSession: false,
  segments: [
    { segmentOrder: 1, text: 'Thỏ ra vườn.', audioUrl: 'a1.mp3', wordTimingsJson: null },
    { segmentOrder: 2, text: 'Thỏ thấy cà rốt.', audioUrl: 'a2.mp3', wordTimingsJson: null },
    { segmentOrder: 3, text: 'Thỏ chia cho bạn.', audioUrl: 'a3.mp3', wordTimingsJson: null },
  ],
  ...over,
});

describe('tranh của cảnh', () => {
  it('Backend cũ chỉ có một tranh: một tranh phủ cả cảnh', () => {
    expect(scenePictures(scene())).toEqual([{ url: 'one.png', start: 0, end: text.length }]);
  });

  it('nhiều tranh: xếp theo thứ tự beat, bỏ tranh chưa có link', () => {
    const pictures = scenePictures(scene({ illustrations: [
      { beatOrder: 3, startOffset: 30, endOffset: 48, url: 'b3.png' },
      { beatOrder: 1, startOffset: 0, endOffset: 12, url: 'b1.png' },
      { beatOrder: 2, startOffset: 13, endOffset: 29, url: null },
    ] }));
    expect(pictures.map((p) => p.url)).toEqual(['b1.png', 'b3.png']);
  });

  it('đoạn chữ của từng tranh: từ câu của tranh tới trước câu của tranh sau, ghép lại đủ cả cảnh', () => {
    const pictures = [{ url: 'a', start: 0, end: 12 }, { url: 'b', start: 13, end: 29 }, { url: 'c', start: 30, end: 47 }];
    const parts = pictureParts(pictures, text);
    expect(parts.map((p) => text.slice(p.start, p.end))).toEqual(['Thỏ ra vườn.', 'Thỏ thấy cà rốt.', 'Thỏ chia cho bạn.']);
    // Câu của tranh không nằm ở đầu cảnh: tranh đầu vẫn lấy từ đầu cảnh, không sót chữ.
    const late = pictureParts([{ url: 'a', start: 13, end: 29 }, { url: 'b', start: 30, end: 47 }], text);
    expect(late.map((p) => text.slice(p.start, p.end))).toEqual(['Thỏ ra vườn. Thỏ thấy cà rốt.', 'Thỏ chia cho bạn.']);
    // Cảnh 1 tranh: cả cảnh.
    expect(pictureParts(scenePictures(scene()), text)).toEqual([{ start: 0, end: text.length }]);
  });

  it('chọn tranh theo vị trí đang đọc; khoảng trống giữa hai tranh thì giữ tranh phía trước', () => {
    const pictures = [{ url: 'a', start: 0, end: 12 }, { url: 'b', start: 13, end: 29 }, { url: 'c', start: 30, end: 48 }];
    expect(pictureAt(pictures, 0)).toBe(0);
    expect(pictureAt(pictures, 15)).toBe(1);
    expect(pictureAt(pictures, 12)).toBe(0);
    expect(pictureAt(pictures, 47)).toBe(2);
  });
});

describe('vị trí đang đọc', () => {
  it('vị trí đoạn: dùng startOffset của Backend, không có thì tự tìm trong chữ của cảnh', () => {
    expect(segmentStarts(scene())).toEqual([0, 13, 30]);
    const withOffsets = scene({ segments: scene().segments.map((s, i) => ({ ...s, startOffset: [0, 13, 30][i] + 100 })) });
    expect(segmentStarts(withOffsets)).toEqual([100, 113, 130]);
  });

  it('đọc mốc thời gian dạng [{ word, start, end }] (giây); sai định dạng thì bỏ qua', () => {
    expect(parseWordTimings('[{"word":"Thỏ","start":0,"end":0.4},{"word":"thấy","start":0.4,"end":null}]'))
      .toEqual([{ word: 'Thỏ', start: 0, end: 0.4 }, { word: 'thấy', start: 0.4, end: null }]);
    expect(parseWordTimings('không phải JSON')).toEqual([]);
    expect(parseWordTimings(null)).toEqual([]);
  });

  it('chữ đang đọc theo mốc thời gian; không có mốc thì ước theo tỉ lệ thời gian', () => {
    const timings = parseWordTimings('[{"word":"Thỏ","start":0,"end":0.3},{"word":"thấy","start":0.3,"end":0.6},{"word":"cà","start":0.6,"end":0.8},{"word":"rốt","start":0.8,"end":1}]');
    expect(charInSegment('Thỏ thấy cà rốt.', timings, 0.65, 1)).toBe(9);
    expect(charInSegment('Thỏ thấy cà rốt.', [], 0.5, 2)).toBe(4);
    expect(charInSegment('Thỏ thấy cà rốt.', [], 1, Number.NaN)).toBe(0);
  });

  describe('mốc thời gian theo vị trí ký tự (secondsAtChar)', () => {
    const sampleText = 'Thỏ thấy cà rốt.';
    const timings = parseWordTimings('[{"word":"Thỏ","start":0,"end":0.3},{"word":"thấy","start":0.3,"end":0.6},{"word":"cà","start":0.6,"end":0.8},{"word":"rốt","start":0.8,"end":1.0}]');

    it('không có timings: tính theo tỉ lệ ký tự', () => {
      expect(secondsAtChar(sampleText, null, 8, 16)).toBe(8);
      expect(secondsAtChar(sampleText, [], 4, 16)).toBe(4);
    });

    it('có timings: lấy mốc thời gian của từ tương ứng', () => {
      expect(secondsAtChar(sampleText, timings, 1, 1.0)).toBe(0);
      expect(secondsAtChar(sampleText, timings, 5, 1.0)).toBe(0.3);
      expect(secondsAtChar(sampleText, timings, 9, 1.0)).toBe(0.6);
    });

    it('charOffset = 0 hoặc <= 0 trả về 0', () => {
      expect(secondsAtChar(sampleText, timings, 0, 1.0)).toBe(0);
      expect(secondsAtChar(sampleText, null, 0, 1.0)).toBe(0);
      expect(secondsAtChar(sampleText, timings, -2, 1.0)).toBe(0);
    });

    it('charOffset >= length trả về duration', () => {
      expect(secondsAtChar(sampleText, timings, sampleText.length, 1.5)).toBe(1.5);
      expect(secondsAtChar(sampleText, timings, sampleText.length + 5, 2.0)).toBe(2.0);
      expect(secondsAtChar(sampleText, null, sampleText.length, 3.0)).toBe(3.0);
    });

    it('duration không hợp lệ (NaN hoặc <= 0) trả về 0', () => {
      expect(secondsAtChar(sampleText, timings, 5, Number.NaN)).toBe(0);
      expect(secondsAtChar(sampleText, timings, 5, 0)).toBe(0);
      expect(secondsAtChar(sampleText, timings, 5, -1)).toBe(0);
    });
  });
});

describe('wordAt: chữ đang được kể để tô sáng', () => {
  it('trả cả chữ chứa vị trí, kể cả khi vị trí nằm giữa chữ', () => {
    expect(wordAt(text, 0)).toEqual({ start: 0, end: 3 });
    expect(wordAt(text, 5)).toEqual({ start: 4, end: 6 });
    expect(text.slice(7, 12)).toBe('vườn.');
    expect(wordAt(text, 9)).toEqual({ start: 7, end: 12 });
  });
  it('vị trí rơi vào khoảng trắng thì lấy chữ ngay sau', () => {
    expect(wordAt(text, 3)).toEqual({ start: 4, end: 6 });
  });
  it('ngoài phạm vi hoặc chỉ còn khoảng trắng thì null', () => {
    expect(wordAt(text, -1)).toBeNull();
    expect(wordAt(text, text.length)).toBeNull();
    expect(wordAt('abc   ', 4)).toBeNull();
    expect(wordAt('', 0)).toBeNull();
  });
});
