import { ContentGenerationProgressDto, OutlineProgressDto } from '@/app/types/aiStory';

export function providerFailureMessage(code?: string | null): string | null {
  if (code === 'AI_PROVIDER_ACCESS_DENIED')
    return 'Nhà cung cấp AI từ chối truy cập. Quản trị viên cần kiểm tra quyền truy cập và thông báo của Google trước khi bạn thử lại.';
  if (code === 'AI_PROVIDER_CONFIGURATION_REJECTED')
    return 'Nhà cung cấp AI từ chối cấu hình yêu cầu. Vui lòng liên hệ quản trị viên trước khi thử lại.';
  return null;
}

/** Lời giải thích thân thiện cho mã lỗi khi AI tạo dàn ý / viết truyện / học liệu. Mã lạ dùng câu chung, không hiện mã kỹ thuật. */
const GENERATION_FAILURE_VI: Record<string, string> = {
  CONTENT_QUALITY_NOT_MET: 'AI đã viết và chỉnh sửa truyện vài lần nhưng bản viết vẫn chưa đạt yêu cầu chất lượng (độ dài, độ dễ đọc, từ vựng hoặc bám sát dàn ý). Bạn bấm Thử lại để AI viết bản mới, hoặc sửa ý tưởng cho đơn giản hơn.',
  CONTENT_GENERATION_TIMEOUT: 'AI viết truyện lâu hơn dự kiến nên đã dừng lại. Bạn bấm Thử lại để AI viết lại nhé.',
  AI_TIMEOUT: 'Dịch vụ AI đang phản hồi chậm. Bạn vui lòng đợi một chút rồi bấm Thử lại.',
  CONTENT_SAFETY_BLOCKED: 'Nội dung AI viết ra chưa an toàn cho trẻ nên đã bị chặn. Bạn hãy sửa ý tưởng rồi tạo lại truyện.',
  CONTENT_SAFETY_SCORE_NOT_MET: 'Truyện chưa đạt mức an toàn tối thiểu cho lứa tuổi đã chọn. Bạn bấm Thử lại hoặc sửa ý tưởng nhẹ nhàng hơn.',
  CONTENT_SAFETY_SCORE_UNAVAILABLE: 'Hệ thống chưa chấm được mức an toàn của truyện. Bạn vui lòng thử lại sau ít phút.',
  MODERATION_HARD_BLOCK: 'Truyện có nội dung không phù hợp với trẻ nên đã bị chặn. Bạn hãy sửa ý tưởng rồi tạo lại truyện.',
  CONTENT_ARTIFACT_HANDOFF_FAILED: 'Truyện đã viết xong nhưng hệ thống chưa lưu được. Bạn bấm Thử lại để lưu lại nhé.',
  CONTENT_SCHEMA_INVALID: 'AI trả về truyện không đúng định dạng. Bạn bấm Thử lại để AI viết lại.',
  CONTENT_TECHNICAL_GENERATION_FAILED: 'Có trục trặc kỹ thuật khi AI viết truyện. Bạn vui lòng thử lại sau ít phút.',
};

export function generationFailureMessage(code?: string | null): string {
  return providerFailureMessage(code)
    ?? (code ? GENERATION_FAILURE_VI[code] : undefined)
    ?? 'Bước này chưa hoàn thành do có sự cố khi xử lý. Bạn bấm Thử lại; nếu vẫn lỗi, hãy thử lại sau ít phút hoặc liên hệ quản trị viên.';
}

export function normalizeStoryStatus(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function isMediaStage(status: string): boolean {
  return ['approved', 'media_processing', 'media_review', 'ready'].includes(normalizeStoryStatus(status));
}

export function contentDestination(progress: ContentGenerationProgressDto): 'media' | 'review' | 'waiting' | 'stopped' {
  const status = normalizeStoryStatus(progress.storyStatus);
  if (isMediaStage(status)) return 'media';
  if (['rejected', 'archived'].includes(status)) return 'stopped';
  if (status === 'content_review' && progress.isComplete) return 'review';
  return 'waiting';
}

export function generationDisplayPhase(progress: ContentGenerationProgressDto | null): 'content' | 'learning' {
  // A candidate or a completed AI call is not enough: the backend must promote stable content.
  return progress?.outputMode !== 'reading_media_only' && progress?.content === 'stable' && typeof progress.stableStoryVersionId === 'number' && progress.stableStoryVersionId > 0
    ? 'learning'
    : 'content';
}

export function outlineReady(progress: OutlineProgressDto, previousVersion?: number): boolean {
  return normalizeStoryStatus(progress.storyStatus) === 'outline_review' &&
    !!progress.currentVersion?.isCurrent && !progress.activeOperation &&
    !progress.currentVersion.outlineApprovedAt &&
    (previousVersion === undefined || progress.currentVersion.versionNo > previousVersion);
}
