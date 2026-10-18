import type { Evidence, LearningConfig, RecommendationCategory, RecommendationStatus } from "@/app/types/adaptive";
import { READING_MODES } from "@/app/lib/guardian";

/**
 * Quy tắc Luồng 6 (rule-based v1) — hàm thuần, không đọc/ghi dữ liệu.
 * AI chỉ đề xuất; mọi thay đổi hồ sơ học tập phải qua người giám sát (BR-6.1).
 */

export const MIN_SESSIONS = 5;          // Mục 1.2 — tối thiểu 5 phiên hoàn thành trong 14 ngày
export const WINDOW_DAYS = 14;
export const TREND_SIZE = 5;            // baseline v1: 5 phiên gần nhất cùng xu hướng
export const UP_QUIZ_PERCENT = 85;      // Bước 6.4 — đọc hiểu > 85%
export const UP_COMPLETION_PERCENT = 90; // tỷ lệ hoàn thành > 90%
export const DOWN_COMPLETION_PERCENT = 80;
export const REVIEW_DAYS = 14;          // Bước 6.5 — Awaiting Review quá 14 ngày → stale
export const REMIND_DAY = 7;            // ngày 7 nhắc lại 1 lần
export const PERSONALIZE_COOLDOWN_DAYS = 7; // Nhánh B cho trẻ mới tối đa 1 lần / 7 ngày
export const VALIDATED_PERCENT = 70;    // Bước 6.8 — sau điều chỉnh vẫn đạt ngưỡng đọc hiểu

const DAY = 86_400_000;

export type QuizSignal = { storyId: number; title: string; percent: number; at: string; isRetake: boolean; challenge: boolean };
export type ReadSignal = { storyId: number; title: string; genre: string | null; at: string; fromSupervisor: boolean };
export type AbandonSignal = { storyId: number; at: string };

export type AnalysisInput = {
  now: number;
  readingLevel: number;
  /** Ngưỡng Hold Mode trong SafetyPolicy (mặc định 70%). */
  threshold: number;
  onHold: boolean;
  quizzes: QuizSignal[];
  /** Phiên đọc xong (không gồm phiên đọc lại để mở khoá). */
  reads: ReadSignal[];
  /** Phiên bé tự thoát giữa chừng (không gồm phiên bị hệ thống buộc thoát). */
  abandons: AbandonSignal[];
  /** Chủ đề yêu thích phụ huynh khai báo (learning_profile_topics.favorite_topic). */
  favoriteTopics: string[];
  /** Nhân vật / nơi chốn trên thẻ ước bé đã gửi, mới nhất trước. */
  wishTopics: string[];
  blockedNames: string[];
  allowedNames: string[];
  /** Chủ đề đã gợi ý gần đây hoặc bị từ chối — không gợi ý lặp. */
  recentTopics: string[];
};

export type Proposal = {
  category: RecommendationCategory;
  current: { readingLevel?: number; topic?: string };
  proposed: { readingLevel?: number; topic?: string };
  observation: string;
  evidence: Evidence[];
};

const inWindow = (at: string, now: number) => now - Date.parse(at) <= WINDOW_DAYS * DAY;
const avg = (list: number[]) => (list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0);

/** Số phiên đọc xong trong 14 ngày (BR-6.9: phiên đọc lại không tính). */
export const sessionsInWindow = (input: Pick<AnalysisInput, "reads" | "now">) => input.reads.filter((r) => inWindow(r.at, input.now)).length;

/** Tỷ lệ hoàn thành trong 14 ngày = đọc xong / (đọc xong + tự bỏ ngang). Phiên bị buộc thoát không tính. */
export function completionRate(input: Pick<AnalysisInput, "reads" | "abandons" | "now">): number {
  const done = sessionsInWindow(input);
  const quit = input.abandons.filter((a) => inWindow(a.at, input.now)).length;
  return done + quit ? Math.round((done / (done + quit)) * 100) : 100;
}

/**
 * Nhánh A — Reading Level (Core). Cần đủ 5 phiên/14 ngày và ≥ 2 tín hiệu (BR-6.2, BR-6.3):
 * tăng khi 5 câu đố gần nhất đều ≥ 85% và hoàn thành ≥ 90% (truyện Thử thách điểm cao được tính là bằng chứng);
 * giảm khi ≥ 4/5 câu đố vừa sức dưới ngưỡng và hoàn thành dưới 80% (điểm thấp ở truyện Thử thách không dùng để giảm).
 * Không đề xuất khi đang Hold Mode (BR-6.10).
 */
export function analyzeDifficulty(input: AnalysisInput): Proposal | null {
  if (input.onHold || sessionsInWindow(input) < MIN_SESSIONS) return null;
  const quizzes = input.quizzes.filter((q) => !q.isRetake).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const rate = completionRate(input);
  const level = input.readingLevel;
  const common: Evidence[] = [
    { label: "Phiên đọc xong trong 14 ngày", value: String(sessionsInWindow(input)) },
    { label: "Tỷ lệ hoàn thành", value: `${rate}%` },
  ];

  const last = quizzes.slice(-TREND_SIZE);
  if (level < 5 && last.length === TREND_SIZE && last.every((q) => q.percent >= UP_QUIZ_PERCENT) && rate >= UP_COMPLETION_PERCENT) {
    return {
      category: "reading_difficulty",
      current: { readingLevel: level },
      proposed: { readingLevel: level + 1 },
      observation: `Bé hoàn thành ${rate}% truyện và đạt đọc hiểu từ ${UP_QUIZ_PERCENT}% trở lên ở ${TREND_SIZE} lần gần nhất — truyện mức ${level} có thể đã dễ.`,
      evidence: [...common, ...last.map((q) => ({ label: `Câu đố “${q.title}”${q.challenge ? " (Thử thách)" : ""}`, value: `${q.percent}%` }))],
    };
  }

  const fair = quizzes.filter((q) => !q.challenge).slice(-TREND_SIZE);
  const low = fair.filter((q) => q.percent < input.threshold).length;
  if (level > 1 && fair.length === TREND_SIZE && low >= TREND_SIZE - 1 && rate < DOWN_COMPLETION_PERCENT) {
    return {
      category: "reading_difficulty",
      current: { readingLevel: level },
      proposed: { readingLevel: level - 1 },
      observation: `${low}/${TREND_SIZE} câu đố gần nhất dưới ${input.threshold}% (trung bình ${avg(fair.map((q) => q.percent))}%) và bé chỉ hoàn thành ${rate}% truyện — truyện mức ${level} có thể đang khó.`,
      evidence: [...common, ...fair.map((q) => ({ label: `Câu đố “${q.title}”`, value: `${q.percent}%` }))],
    };
  }
  return null;
}

const norm = (s: string) => s.trim().toLowerCase();

/** Không gợi ý chủ đề thuộc danh mục bị chặn; có danh sách Cho phép thì chỉ gợi ý trong danh sách đó (Luồng 1 Bước 1.4). */
export function topicAllowed(topic: string, blockedNames: string[], allowedNames: string[]): boolean {
  const t = norm(topic);
  if (!t) return false;
  const hit = (name: string) => { const n = norm(name); return !!n && (t.includes(n) || n.includes(t)); };
  if (blockedNames.some(hit)) return false;
  return allowedNames.length === 0 || allowedNames.some(hit);
}

/**
 * Nhánh B — gợi ý chủ đề truyện (Core, chỉ mang tính gợi ý).
 * Tín hiệu theo thứ tự: thể loại bé tự chọn nhiều nhất (≥ 3/5 phiên gần nhất, không tính phiên bố mẹ chọn),
 * thẻ ước lặp lại; trẻ mới chưa đủ 5 phiên thì dùng chủ đề yêu thích phụ huynh khai báo hoặc thẻ ước.
 */
export function analyzePersonalization(input: AnalysisInput): Proposal | null {
  const ok = (t: string) => topicAllowed(t, input.blockedNames, input.allowedNames) && !input.recentTopics.some((r) => norm(r) === norm(t));
  const own = input.reads.filter((r) => !r.fromSupervisor && r.genre && inWindow(r.at, input.now)).slice(-TREND_SIZE);
  const counts = new Map<string, number>();
  for (const r of own) counts.set(r.genre!, (counts.get(r.genre!) ?? 0) + 1);
  const [topGenre, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  if (topGenre && topCount >= 3 && ok(topGenre)) {
    return {
      category: "content_personalization",
      current: {},
      proposed: { topic: topGenre },
      observation: `Bé tự chọn ${topCount}/${own.length} truyện gần nhất thuộc “${topGenre}”.`,
      evidence: own.map((r) => ({ label: `Bé tự chọn “${r.title}”`, value: r.genre ?? "—" })),
    };
  }

  const wishCount = new Map<string, number>();
  for (const w of input.wishTopics) wishCount.set(w, (wishCount.get(w) ?? 0) + 1);
  const repeated = [...wishCount.entries()].filter(([t, n]) => n >= 2 && ok(t)).sort((a, b) => b[1] - a[1])[0];
  if (repeated) {
    return {
      category: "content_personalization",
      current: {},
      proposed: { topic: repeated[0] },
      observation: `Bé đã ước ${repeated[1]} lần truyện có “${repeated[0]}”.`,
      evidence: [{ label: "Thẻ ước bé tự chọn", value: `${repeated[0]} × ${repeated[1]}` }],
    };
  }

  // Ngoại lệ trẻ mới (Mục 1.2): chưa đủ dữ liệu đọc thì dựa vào chủ đề yêu thích và thẻ ước.
  if (sessionsInWindow(input) < MIN_SESSIONS) {
    const fav = input.favoriteTopics.find(ok);
    if (fav) return { category: "content_personalization", current: {}, proposed: { topic: fav }, observation: `Bé chưa đọc nhiều; gợi ý theo chủ đề yêu thích bạn đã khai báo: “${fav}”.`, evidence: [{ label: "Chủ đề yêu thích trong hồ sơ học tập", value: fav }] };
    const wish = input.wishTopics.find(ok);
    if (wish) return { category: "content_personalization", current: {}, proposed: { topic: wish }, observation: `Bé chưa đọc nhiều; gợi ý theo điều ước gần đây của bé: “${wish}”.`, evidence: [{ label: "Thẻ ước bé tự chọn", value: wish }] };
  }
  return null;
}

/** Bước 6.6 — "Sửa" chỉ trong cùng category và cùng hướng đề xuất. */
export function modifyOptions(current: number, proposed: number): number[] {
  const all = [1, 2, 3, 4, 5];
  return proposed > current ? all.filter((n) => n > current) : all.filter((n) => n < current);
}

/**
 * Bước 6.8 (mức đơn giản) — so sánh 5 câu đố trước / sau khi đổi mức đọc.
 * Chưa đủ 5 phiên sau điều chỉnh → null (tiếp tục theo dõi).
 */
export function monitorOutcome(before: number[], after: number[], afterCompletion: number): { status: RecommendationStatus; beforePercent: number | null; afterPercent: number; note: string } | null {
  if (after.length < TREND_SIZE) return null;
  const a = avg(after.slice(0, TREND_SIZE));
  const b = before.length ? avg(before.slice(-TREND_SIZE)) : null;
  const good = a >= VALIDATED_PERCENT && afterCompletion >= DOWN_COMPLETION_PERCENT;
  return {
    status: good ? "validated" : "reassessment_required",
    beforePercent: b,
    afterPercent: a,
    note: good
      ? `Sau điều chỉnh, đọc hiểu trung bình ${a}%${b !== null ? ` (trước đó ${b}%)` : ""}, hoàn thành ${afterCompletion}% — mức mới phù hợp.`
      : `Sau điều chỉnh, đọc hiểu trung bình ${a}%${b !== null ? ` (trước đó ${b}%)` : ""}, hoàn thành ${afterCompletion}% — nên xem lại mức đọc.`,
  };
}

export const CATEGORY_LABEL: Record<RecommendationCategory, string> = {
  reading_difficulty: "Điều chỉnh mức đọc",
  content_personalization: "Gợi ý chủ đề truyện",
};

export const STATUS_LABEL: Record<RecommendationStatus, [tone: string, label: string]> = {
  detected: ["draft", "Mới phát hiện"],
  recommendation_created: ["draft", "Mới tạo"],
  awaiting_review: ["wait", "Chờ bạn xem"],
  stale: ["draft", "Đã hết hạn"],
  observe_more: ["draft", "Theo dõi thêm"],
  rejected: ["flag", "Đã từ chối"],
  approved: ["ok", "Đã đồng ý"],
  modified: ["ok", "Đã sửa và đồng ý"],
  applied: ["ok", "Đã áp dụng"],
  monitoring: ["ai", "Đang theo dõi hiệu quả"],
  validated: ["ok", "Đã phù hợp"],
  reassessment_required: ["wait", "Cần xem lại"],
};

const modeLabel = (mode?: string | null) => READING_MODES.find((m) => m.id === mode)?.label ?? null;

/** Bước 6.7 — mô tả một lần đổi cấu hình học tập: mức đọc và / hoặc chế độ đọc. */
export function configChange(prev: LearningConfig, next: LearningConfig): string {
  const parts: string[] = [];
  if (prev.readingLevel !== next.readingLevel) parts.push(`Mức ${prev.readingLevel} → Mức ${next.readingLevel}`);
  const [a, b] = [modeLabel(prev.readingMode), modeLabel(next.readingMode)];
  if (a && b && a !== b) parts.push(`${a} → ${b}`);
  return parts.join(" · ") || `Mức ${next.readingLevel}`;
}
