import { describe, expect, it } from 'vitest';
import { earnedBadges, isAnswerCorrect, nextStreak, normalizeAnswer, readingModeFor, sequencingItems, tokenize, treeStage } from '@/app/lib/readingRules';

describe('chấm câu đố (Bước 3.3.1)', () => {
  const short = { type: 'short_answer', acceptedAnswers: ['Thỏ Trắng'] };

  it('bỏ dấu, chữ hoa, khoảng trắng thừa', () => {
    expect(normalizeAnswer('  Đôi   bạn THÂN! ')).toBe('doi ban than');
  });

  it('tự luận chấp nhận có dấu lẫn không dấu', () => {
    expect(isAnswerCorrect(short, 'tho trang')).toBe(true);
    expect(isAnswerCorrect(short, 'Thỏ trắng')).toBe(true);
  });

  it('tự luận cho phép sai 1 ký tự với đáp án ≥ 4 ký tự', () => {
    expect(isAnswerCorrect(short, 'tho trag')).toBe(true);
    expect(isAnswerCorrect(short, 'tho tr')).toBe(false);
  });

  it('trắc nghiệm phải đúng nguyên văn (không tính dấu câu)', () => {
    const mc = { type: 'multiple_choice', acceptedAnswers: ['Động viên nhau'] };
    expect(isAnswerCorrect(mc, 'Động viên nhau')).toBe(true);
    expect(isAnswerCorrect(mc, 'Động viên nha')).toBe(false);
  });

  it('câu trả lời trống là sai', () => {
    expect(isAnswerCorrect(short, '   ')).toBe(false);
  });
});

describe('Cây tri thức (Bước 3.4)', () => {
  it('lớn theo các mốc cố định', () => {
    expect(treeStage(0).label).toBe('Hạt giống');
    expect(treeStage(20).label).toBe('Mầm non');
    expect(treeStage(250).label).toBe('Cây ra hoa');
    expect(treeStage(250).next).toBeNull();
  });

  it('tính phần trăm tới mốc kế', () => {
    expect(treeStage(40).progress).toBeCloseTo(0.5);
  });
});

describe('chuỗi ngày đọc', () => {
  it('tăng khi đọc liên tiếp, giữ nguyên khi đọc lại trong ngày, về 1 khi bỏ một ngày', () => {
    expect(nextStreak('2026-10-14', 3, '2026-10-15')).toBe(4);
    expect(nextStreak('2026-10-15', 4, '2026-10-15')).toBe(4);
    expect(nextStreak('2026-10-12', 4, '2026-10-15')).toBe(1);
    expect(nextStreak(null, 0, '2026-10-15')).toBe(1);
  });
});

describe('huy hiệu', () => {
  it('chỉ trao huy hiệu chưa có', () => {
    const stats = { storiesCompleted: 1, streakDays: 7, wordsCollected: 3, roadmapFinished: false, wishFulfilled: false };
    expect(earnedBadges(stats, [])).toEqual(['first_story', 'streak_7']);
    expect(earnedBadges(stats, ['first_story'])).toEqual(['streak_7']);
  });
});

describe('khác', () => {
  it('chế độ đọc mặc định theo tuổi', () => {
    expect(readingModeFor('Age_6_8')).toBe('listen_first');
    expect(readingModeFor('Age_9_12')).toBe('read_first');
  });

  it('trò chơi sắp xếp lấy câu theo đúng thứ tự trong truyện', () => {
    const items = sequencingItems(['Sáng nay Ếch dậy sớm lắm. Ếch rủ Thỏ đi chơi.', 'Hai bạn gặp một cây cầu gãy. Cuối cùng hai bạn về nhà vui vẻ.']);
    expect(items[0]).toMatch(/Sáng nay/);
    expect(items[items.length - 1]).toMatch(/Cuối cùng|cây cầu/);
  });

  it('tách chữ giữ nguyên dấu câu và khoảng trắng', () => {
    expect(tokenize('Ếch, nhảy!').map((t) => t.text).join('')).toBe('Ếch, nhảy!');
    expect(tokenize('Ếch, nhảy!').filter((t) => t.word).map((t) => t.text)).toEqual(['Ếch', 'nhảy']);
  });
});
