import { describe, expect, it } from 'vitest';
import {
  analyzeDifficulty, analyzePersonalization, completionRate, modifyOptions, monitorOutcome, topicAllowed, type AnalysisInput,
} from '@/app/lib/adaptiveRules';

const NOW = Date.parse('2026-10-15T10:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const quiz = (percent: number, d = 1, extra: { challenge?: boolean; isRetake?: boolean } = {}) =>
  ({ storyId: d, title: `Truyện ${d}`, percent, at: daysAgo(d), isRetake: false, challenge: false, ...extra });
const read = (genre: string, d = 1, fromSupervisor = false) => ({ storyId: d, title: `Truyện ${d}`, genre, at: daysAgo(d), fromSupervisor });

const base = (patch: Partial<AnalysisInput> = {}): AnalysisInput => ({
  now: NOW, readingLevel: 2, threshold: 70, onHold: false,
  quizzes: [1, 2, 3, 4, 5].map((d) => quiz(90, d)),
  reads: [1, 2, 3, 4, 5].map((d) => read('Cổ tích', d)),
  abandons: [], favoriteTopics: [], wishTopics: [], blockedNames: [], allowedNames: [], recentTopics: [],
  ...patch,
});

describe('Nhánh A — mức đọc', () => {
  it('đề xuất tăng 1 bậc khi 5 câu đố gần nhất ≥ 85% và hoàn thành ≥ 90%', () => {
    const p = analyzeDifficulty(base());
    expect(p?.proposed.readingLevel).toBe(3);
    expect(p?.evidence.length).toBeGreaterThan(2);
  });

  it('chưa đủ 5 phiên trong 14 ngày thì không đề xuất (Mục 1.2)', () => {
    expect(analyzeDifficulty(base({ reads: [1, 2, 3, 20, 30].map((d) => read('Cổ tích', d)) }))).toBeNull();
  });

  it('không đề xuất khi đang Hold Mode (BR-6.10)', () => {
    expect(analyzeDifficulty(base({ onHold: true }))).toBeNull();
  });

  it('không dựa vào một chỉ số duy nhất: điểm cao nhưng hay bỏ ngang thì không tăng (BR-6.3)', () => {
    expect(analyzeDifficulty(base({ abandons: [1, 2].map((d) => ({ storyId: 9, at: daysAgo(d) })) }))).toBeNull();
  });

  it('đề xuất giảm khi ≥ 4/5 câu đố dưới ngưỡng và hoàn thành dưới 80%', () => {
    const p = analyzeDifficulty(base({
      quizzes: [40, 50, 60, 80, 45].map((v, i) => quiz(v, i + 1)),
      abandons: [1, 2].map((d) => ({ storyId: 9, at: daysAgo(d) })),
    }));
    expect(p?.proposed.readingLevel).toBe(1);
  });

  it('điểm thấp ở truyện Thử thách không dùng để giảm mức', () => {
    const quizzes = [...[1, 2, 3, 4, 5].map((d) => quiz(30, d, { challenge: true })), ...[6, 7, 8, 9, 10].map((d) => quiz(75, d))];
    expect(analyzeDifficulty(base({ quizzes, abandons: [1, 2].map((d) => ({ storyId: 9, at: daysAgo(d) })) }))).toBeNull();
  });

  it('không tính phiên đọc lại để mở khoá', () => {
    const quizzes = [...[1, 2, 3, 4].map((d) => quiz(95, d)), quiz(100, 0.5, { isRetake: true })];
    expect(analyzeDifficulty(base({ quizzes }))).toBeNull();
  });

  it('không vượt mức 5', () => {
    expect(analyzeDifficulty(base({ readingLevel: 5 }))).toBeNull();
  });
});

describe('Nhánh B — gợi ý chủ đề', () => {
  it('gợi ý thể loại bé tự chọn nhiều nhất (≥ 3/5)', () => {
    const p = analyzePersonalization(base({ reads: ['Động vật', 'Động vật', 'Cổ tích', 'Động vật', 'Ngụ ngôn'].map((g, i) => read(g, i + 1)) }));
    expect(p?.proposed.topic).toBe('Động vật');
  });

  it('không dùng phiên bố mẹ chọn làm tín hiệu sở thích', () => {
    const reads = [1, 2, 3, 4, 5].map((d) => read('Động vật', d, true));
    expect(analyzePersonalization(base({ reads }))).toBeNull();
  });

  it('không gợi ý chủ đề bị chặn hoặc nằm ngoài danh sách Cho phép', () => {
    const reads = [1, 2, 3, 4, 5].map((d) => read('Động vật', d));
    expect(analyzePersonalization(base({ reads, blockedNames: ['Động vật'] }))).toBeNull();
    expect(analyzePersonalization(base({ reads, allowedNames: ['Khoa học'] }))).toBeNull();
    expect(topicAllowed('Khoa học vui', [], ['Khoa học'])).toBe(true);
  });

  it('trẻ mới chưa đủ dữ liệu: gợi ý theo chủ đề yêu thích phụ huynh khai báo', () => {
    const p = analyzePersonalization(base({ reads: [read('Cổ tích', 1)], favoriteTopics: ['vũ trụ'] }));
    expect(p?.proposed.topic).toBe('vũ trụ');
  });

  it('điều ước lặp lại cùng nhân vật / nơi chốn là tín hiệu sở thích', () => {
    const p = analyzePersonalization(base({ reads: [read('Cổ tích', 1)], wishTopics: ['Đáy biển', 'Chú mèo', 'Đáy biển'] }));
    expect(p?.proposed.topic).toBe('Đáy biển');
  });

  it('không gợi ý lặp chủ đề vừa gợi ý', () => {
    const p = analyzePersonalization(base({ reads: [read('Cổ tích', 1)], favoriteTopics: ['vũ trụ', 'biển cả'], recentTopics: ['vũ trụ'] }));
    expect(p?.proposed.topic).toBe('biển cả');
  });
});

describe('Quy tắc khác', () => {
  it('Sửa chỉ trong cùng hướng đề xuất', () => {
    expect(modifyOptions(2, 3)).toEqual([3, 4, 5]);
    expect(modifyOptions(3, 2)).toEqual([1, 2]);
  });

  it('tỷ lệ hoàn thành bỏ qua phiên ngoài 14 ngày', () => {
    expect(completionRate({ now: NOW, reads: [read('x', 1), read('x', 2), read('x', 3)], abandons: [{ storyId: 1, at: daysAgo(2) }, { storyId: 1, at: daysAgo(30) }] })).toBe(75);
  });

  it('theo dõi sau điều chỉnh: cần đủ 5 câu đố, đạt thì Validated, không đạt thì cần xem lại (Bước 6.8)', () => {
    expect(monitorOutcome([90], [80, 80], 100)).toBeNull();
    expect(monitorOutcome([90, 90], [80, 75, 85, 70, 90], 100)?.status).toBe('validated');
    expect(monitorOutcome([90, 90], [50, 60, 55, 40, 65], 100)?.status).toBe('reassessment_required');
  });
});
