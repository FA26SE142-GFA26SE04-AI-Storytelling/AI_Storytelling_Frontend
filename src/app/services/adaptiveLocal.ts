import type { ApiResponse } from '@/app/types/auth';
import type { ProfileVersion, Recommendation, RecommendationReview, ReviewInput, ReviewResult } from '@/app/types/adaptive';
import {
  analyzeDifficulty, analyzePersonalization, completionRate, modifyOptions, monitorOutcome,
  PERSONALIZE_COOLDOWN_DAYS, REMIND_DAY, REVIEW_DAYS, type AnalysisInput, type Proposal,
} from '@/app/lib/adaptiveRules';
import { WISH_CARDS, activeHold, loadChild } from './readingLocal';
import { pushNotification } from './notificationLocal';

/**
 * Bộ máy cục bộ cho Luồng 6 — phân tích dữ liệu đọc của bộ máy đọc cục bộ (Luồng 3/4) rồi tạo đề xuất.
 * Chỉ dùng cho dữ liệu mẫu / dự phòng khi backend chưa có API (xem adaptiveService).
 */

/** Cấu hình hiện tại của bé, lấy từ hồ sơ học tập và cài đặt an toàn. */
export type AdaptiveContext = { readingLevel: number; threshold: number; favoriteTopics: string[]; blockedNames: string[]; allowedNames: string[] };
/** Người review — had_final_authority do nơi gọi kiểm tra LIVE ngay lúc bấm. */
export type Reviewer = { userId: number; name: string; hasFinalAuthority: boolean };
/** Áp dụng mức đọc mới lên hồ sơ học tập thật; trả về mức cũ để ghi lịch sử. */
export type ApplyLevel = (level: number) => Promise<{ ok: boolean; message: string; previous: number }>;

type Store = { nextId: number; recs: Recommendation[]; versions: ProfileVersion[] };

const DAY = 86_400_000;
const KEY = (childId: number) => `taletale-adaptive:v1:${childId}`;
const memory = new Map<number, Store>();
const ok = <T>(data: T, message = ''): ApiResponse<T> => ({ success: true, message, data });
const fail = <T>(message: string): ApiResponse<T> => ({ success: false, message, data: null });

function load(childId: number): Store {
  const hit = memory.get(childId);
  if (hit) return hit;
  let s: Store = { nextId: 1, recs: [], versions: [] };
  try { const raw = sessionStorage.getItem(KEY(childId)); if (raw) s = { ...s, ...JSON.parse(raw) }; } catch { /* dùng kho mới */ }
  memory.set(childId, s);
  return s;
}
function save(childId: number) { try { sessionStorage.setItem(KEY(childId), JSON.stringify(memory.get(childId))); } catch { /* bỏ qua */ } }

const cardLabel = (id: number | null) => WISH_CARDS.find((c) => c.id === id)?.label ?? null;

function inputFor(childId: number, ctx: AdaptiveContext, store: Store, now: number): AnalysisInput {
  const s = loadChild(childId);
  const wishes = s.wishes.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return {
    now,
    readingLevel: ctx.readingLevel,
    threshold: ctx.threshold,
    onHold: !!activeHold(s),
    quizzes: s.quizLog,
    reads: s.readLog,
    abandons: s.abandonLog ?? [],
    favoriteTopics: ctx.favoriteTopics,
    wishTopics: wishes.flatMap((w) => [cardLabel(w.characterCardId), cardLabel(w.placeCardId)]).filter((x): x is string => !!x),
    blockedNames: ctx.blockedNames,
    allowedNames: ctx.allowedNames,
    // Chủ đề đã gợi ý trong 30 ngày hoặc từng bị từ chối thì không gợi ý lặp.
    recentTopics: store.recs.filter((r) => r.category === 'content_personalization' && (now - Date.parse(r.createdAt) < 30 * DAY || r.status === 'rejected'))
      .map((r) => r.proposedChange.topic ?? '').filter(Boolean),
  };
}

function create(childId: number, store: Store, p: Proposal, now: number) {
  const rec: Recommendation = {
    id: store.nextId++, childProfileId: childId, category: p.category, status: 'awaiting_review',
    currentState: p.current, proposedChange: p.proposed, observation: p.observation, evidence: p.evidence,
    createdAt: new Date(now).toISOString(), expiresAt: new Date(now + REVIEW_DAYS * DAY).toISOString(), remindedAt: null,
    decidedByName: null, decidedAt: null, appliedChange: null, reviews: [], monitoring: null,
  };
  store.recs.unshift(rec);
  // Notification chỉ là lời nhắc; nguồn chính là khối "Cần xử lý" (Bước 6.5).
  pushNotification('recommendation_awaiting_review', { childProfileId: childId, recommendationId: rec.id });
}

/** Bước 6.8 — theo dõi hiệu quả sau khi đổi mức đọc. */
function monitor(childId: number, rec: Recommendation, now: number) {
  const s = loadChild(childId);
  const since = Date.parse(rec.decidedAt ?? rec.createdAt);
  const quizzes = s.quizLog.filter((q) => !q.isRetake);
  const before = quizzes.filter((q) => Date.parse(q.at) < since).map((q) => q.percent);
  const after = quizzes.filter((q) => Date.parse(q.at) >= since).map((q) => q.percent);
  const rate = completionRate({ now, reads: s.readLog.filter((r) => Date.parse(r.at) >= since), abandons: (s.abandonLog ?? []).filter((a) => Date.parse(a.at) >= since) });
  const result = monitorOutcome(before, after, rate);
  if (!result) {
    rec.monitoring = { beforePercent: null, afterPercent: null, note: `Đang theo dõi: ${after.length}/5 câu đố sau khi điều chỉnh.` };
    return;
  }
  rec.status = result.status;
  rec.monitoring = { beforePercent: result.beforePercent, afterPercent: result.afterPercent, note: result.note };
}

const recentlyClosed = (r: Recommendation, now: number) =>
  (r.status === 'observe_more' || r.status === 'rejected') && now - Date.parse(r.decidedAt ?? r.createdAt) < PERSONALIZE_COOLDOWN_DAYS * DAY;

export const adaptiveLocal = {
  /**
   * Chạy một chu kỳ: hết hạn / nhắc lại (Bước 6.5), theo dõi hiệu quả (6.8), phân tích và tạo đề xuất mới (6.1–6.4).
   * Mỗi category chỉ có tối đa 1 đề xuất đang chờ; Nhánh A không tạo mới khi đang theo dõi một điều chỉnh.
   */
  refresh(childId: number, ctx: AdaptiveContext, now = Date.now()): Recommendation[] {
    const store = load(childId);
    for (const r of store.recs) {
      if (r.status === 'awaiting_review') {
        if (now > Date.parse(r.expiresAt)) r.status = 'stale';
        else if (!r.remindedAt && now - Date.parse(r.createdAt) >= REMIND_DAY * DAY) {
          r.remindedAt = new Date(now).toISOString();
          pushNotification('recommendation_awaiting_review', { childProfileId: childId, recommendationId: r.id, reminder: true });
        }
      }
      if (r.status === 'monitoring') monitor(childId, r, now);
    }

    const input = inputFor(childId, ctx, store, now);
    const ofA = store.recs.filter((r) => r.category === 'reading_difficulty');
    if (!ofA.some((r) => r.status === 'awaiting_review' || r.status === 'monitoring' || recentlyClosed(r, now))) {
      const p = analyzeDifficulty(input);
      if (p) create(childId, store, p, now);
    }
    const ofB = store.recs.filter((r) => r.category === 'content_personalization');
    const lastB = ofB[0] ? Date.parse(ofB[0].createdAt) : 0;
    if (!ofB.some((r) => r.status === 'awaiting_review') && now - lastB >= PERSONALIZE_COOLDOWN_DAYS * DAY) {
      const p = analyzePersonalization(input);
      if (p) create(childId, store, p, now);
    }
    save(childId);
    return store.recs.slice();
  },

  /**
   * Bước 6.6 — review đầu tiên có quyền quyết định cuối sẽ khoá đề xuất; review sau đó chỉ lưu như góp ý.
   * Nhánh B: mọi người giám sát hợp lệ đều quyết định được. Accept/Modify Nhánh A áp dụng mức đọc mới (Bước 6.7).
   */
  async review(childId: number, recId: number, reviewer: Reviewer, input: ReviewInput, apply: ApplyLevel): Promise<ApiResponse<ReviewResult>> {
    const store = load(childId);
    const rec = store.recs.find((r) => r.id === recId);
    if (!rec) return fail('Không tìm thấy đề xuất.');
    const authority = rec.category === 'content_personalization' || reviewer.hasFinalAuthority;
    const row: RecommendationReview = {
      id: store.nextId++, reviewerUserId: reviewer.userId, reviewerName: reviewer.name, decision: input.decision,
      modifiedValue: input.modifiedValue ?? null, reason: input.reason?.trim() || null, isFinal: false, hadFinalAuthority: authority, createdAt: new Date().toISOString(),
    };

    if (rec.status !== 'awaiting_review' || !authority) {
      rec.reviews.push(row);
      save(childId);
      const message = rec.decidedByName ? `Đề xuất đã được ${rec.decidedByName} quyết định — ý kiến của bạn được lưu làm góp ý.`
        : rec.status === 'stale' ? 'Đề xuất đã hết hạn — ý kiến của bạn được lưu làm góp ý.'
        : 'Đã lưu góp ý. Người quản lý chính hoặc người có quyền "Sửa mức đọc" sẽ quyết định.';
      return ok({ outcome: 'comment', message, recommendation: rec });
    }

    const now = new Date().toISOString();
    let outcome: ReviewResult['outcome'];
    let message: string;
    if (input.decision === 'accept' || input.decision === 'modify') {
      if (rec.category === 'reading_difficulty') {
        const cur = rec.currentState.readingLevel!;
        const target = input.decision === 'modify' ? input.modifiedValue ?? NaN : rec.proposedChange.readingLevel!;
        if (input.decision === 'modify' && !modifyOptions(cur, rec.proposedChange.readingLevel!).includes(target)) {
          return fail('Chỉ sửa được mức đọc theo cùng hướng đề xuất.');
        }
        const applied = await apply(target);
        if (!applied.ok) return fail(applied.message || 'Chưa áp dụng được mức đọc mới.');
        adaptiveLocal.recordVersion(childId, applied.previous, target, 'recommendation', rec.id, reviewer.name);
        rec.appliedChange = { readingLevel: target };
        // Applied → Monitoring (Bước 6.8).
        rec.status = 'monitoring';
        message = `Đã đổi mức đọc thành ${target}. Truyện tạo sau sẽ theo mức mới; hệ thống tiếp tục theo dõi 5 lần đọc tới.`;
      } else {
        rec.appliedChange = rec.proposedChange;
        rec.status = 'applied';
        message = 'Đã ghi nhận gợi ý chủ đề. Bạn có thể tạo truyện với chủ đề này ngay.';
      }
      outcome = 'applied';
    } else if (input.decision === 'reject') {
      rec.status = 'rejected';
      outcome = 'rejected';
      message = 'Đã từ chối đề xuất. Hồ sơ học tập giữ nguyên.';
    } else {
      rec.status = 'observe_more';
      outcome = 'observe_more';
      message = 'Hệ thống tiếp tục theo dõi và có thể đề xuất lại sau.';
    }
    row.isFinal = true;
    rec.reviews.push(row);
    rec.decidedByName = reviewer.name;
    rec.decidedAt = now;
    save(childId);
    return ok({ outcome, message, recommendation: rec });
  },

  versions(childId: number): ProfileVersion[] {
    return load(childId).versions.slice();
  },

  /** Bước 6.7 / Luồng 1 Bước 1.3 — không ghi đè: bản mới active, bản trước superseded. */
  recordVersion(childId: number, previous: number, next: number, source: ProfileVersion['source'], recommendationId: number | null, byName: string) {
    if (previous === next) return;
    const store = load(childId);
    for (const v of store.versions) v.versionStatus = 'superseded';
    store.versions.unshift({
      id: store.nextId++, childProfileId: childId, previousConfig: { readingLevel: previous }, newConfig: { readingLevel: next },
      source, recommendationId, appliedByName: byName, versionStatus: 'active_version', createdAt: new Date().toISOString(),
    });
    save(childId);
  },
};
