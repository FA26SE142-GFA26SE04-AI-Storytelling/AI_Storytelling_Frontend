import { USE_MOCK } from '@/app/mocks/config';
import type { ApiResponse } from '@/app/types/auth';
import type { ProfileVersion, Recommendation, ReviewInput, ReviewResult } from '@/app/types/adaptive';
import type { ReadingMode, TopicRelation } from '@/app/types/childProfile';
import { apiRequest } from './apiClient';
import { childProfileService } from './childProfileService';
import { adaptiveLocal, type AdaptiveContext, type ApplyLevel, type Reviewer } from './adaptiveLocal';

/**
 * Luồng 6 — học tập thích ứng. AI (rule-based v1) chỉ đề xuất; người giám sát quyết định (BR-6.1).
 *
 * HỢP ĐỒNG API ĐỀ XUẤT (backend chưa có — xem docs/FRONTEND_PROGRESS.md, "Luồng 6 — cần backend bổ sung"):
 *   GET  /children/{id}/recommendations              → Recommendation[] (đang chờ + đã quyết định gần đây; job định kỳ tạo mới, chuyển stale sau 14 ngày)
 *   POST /recommendations/{id}/reviews               { decision, modifiedValue, reason } → ReviewResult
 *        backend kiểm tra quyền LIVE, ghi had_final_authority; review is_final đầu tiên khoá đề xuất (optimistic lock);
 *        Accept/Modify Nhánh A cập nhật learning_profiles + child_profile_version_history trong cùng transaction
 *   GET  /children/{id}/learning-profile/versions    → ProfileVersion[]
 *        PUT /LearningProfile/{id} đổi mức đọc thì backend tự ghi một dòng source='manual'
 */

let backendReady: boolean | null = USE_MOCK ? false : null;

async function call<T>(path: string, fallback: () => Promise<ApiResponse<T>>, opts: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<ApiResponse<T>> {
  if (backendReady === false) return fallback();
  const r = await apiRequest<T>(path, 'Không kết nối được.', opts);
  if (r.success) { backendReady = true; return r; }
  if (backendReady === null) { backendReady = false; return fallback(); }
  return r;
}

/** Cấu hình hiện tại của bé cho bộ máy cục bộ. */
async function contextFor(childId: number): Promise<AdaptiveContext> {
  const [lp, sp, cats] = await Promise.all([
    childProfileService.getLearningProfile(childId), childProfileService.getSafetyPolicy(childId), childProfileService.getContentCategories(),
  ]);
  const nameOf = (id: number) => cats.data?.find((c) => c.id === id)?.displayName ?? '';
  const rules = sp.data?.categories ?? [];
  return {
    readingLevel: lp.data?.readingLevel ?? 2,
    threshold: Number(sp.data?.comprehensionThresholdPercent ?? 70),
    favoriteTopics: (lp.data?.topics ?? []).filter((t) => t.relation === 'FavoriteTopic').map((t) => t.topic),
    // Dữ liệu cũ "Restricted" được coi là Chặn (Luồng 1 Bước 1.4).
    blockedNames: rules.filter((r) => r.rule !== 'Allowed').map((r) => nameOf(r.contentCategoryId)).filter(Boolean),
    allowedNames: rules.filter((r) => r.rule === 'Allowed').map((r) => nameOf(r.contentCategoryId)).filter(Boolean),
  };
}

/** Nhánh A — đổi mức đọc trên hồ sơ học tập thật, giữ nguyên các trường khác. */
const applyLevel = (childId: number): ApplyLevel => async (level) => {
  const lp = await childProfileService.getLearningProfile(childId);
  if (!lp.success || !lp.data) return { ok: false, message: lp.message || 'Không đọc được hồ sơ học tập.', previous: level };
  const r = await childProfileService.setLearningProfile(childId, {
    readingLevel: level,
    readingMode: (lp.data.readingMode as ReadingMode | undefined) || undefined,
    comprehensionGoal: lp.data.comprehensionGoal ?? undefined,
    topics: lp.data.topics.map((t) => ({ topic: t.topic, relation: t.relation as TopicRelation })),
  });
  return { ok: r.success, message: r.message, previous: lp.data.readingLevel };
};

export type { Reviewer };

export const adaptiveService = {
  isLocal: () => backendReady !== true,

  recommendations: (childId: number): Promise<ApiResponse<Recommendation[]>> =>
    call(`/children/${childId}/recommendations`, async () => ({ success: true, message: '', data: adaptiveLocal.refresh(childId, await contextFor(childId)) })),

  review: (childId: number, recId: number, reviewer: Reviewer, input: ReviewInput): Promise<ApiResponse<ReviewResult>> =>
    call(`/recommendations/${recId}/reviews`, () => adaptiveLocal.review(childId, recId, reviewer, input, applyLevel(childId)),
      { method: 'POST', body: { decision: input.decision, modifiedValue: input.modifiedValue ?? null, reason: input.reason ?? null } }),

  versions: (childId: number): Promise<ApiResponse<ProfileVersion[]>> =>
    call(`/children/${childId}/learning-profile/versions`, async () => ({ success: true, message: '', data: adaptiveLocal.versions(childId) })),

  /** Luồng 1 Bước 1.3 — phụ huynh sửa mức đọc thủ công sau khi hồ sơ Active. Backend tự ghi; chỉ bộ máy cục bộ cần gọi. */
  recordManualChange(childId: number, previous: number, next: number, byName: string) {
    if (backendReady !== true) adaptiveLocal.recordVersion(childId, previous, next, 'manual', null, byName);
  },
};
