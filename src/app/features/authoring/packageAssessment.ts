import type { PackageAssessmentWarning, PackageCheck, ParentPackage } from '@/app/services/parentPackageService';

export function isLegacyCheck(check: PackageCheck | null | undefined): boolean {
  if (!check) return false;
  return check.backendPassed == null && check.safetyStatus == null && check.grayZoneStatus == null;
}

export function isCheckEligible(p: ParentPackage): boolean {
  const c = p.check;
  if (!c || p.status === 'Blocked') return false;
  if (isLegacyCheck(c)) return c.passed;
  return (
    c.passed &&
    c.backendPassed === true &&
    (c.errors?.length ?? 0) === 0 &&
    c.safetyStatus !== 'Blocked' &&
    c.grayZoneStatus !== 'Blocked' &&
    c.safetyStatus !== 'NotRun'
  );
}

export function needsAssessmentAcknowledgement(p: ParentPackage): boolean {
  const c = p.check;
  if (!c || isLegacyCheck(c)) return false;
  return !!c.requiresParentAcknowledgement || (c.warnings?.length ?? 0) > 0;
}

/** Khóa xác nhận gắn chặt với gói, bản (revision) và token hiện tại để polling/tải lại không chuyển nhầm sang bản mới. */
export function acknowledgementKey(p: ParentPackage): string {
  return `${p.packageId}:${p.revision}:${p.packageToken}`;
}

export function assessmentStatusView(status: string | null | undefined): { tone: string; label: string } {
  switch (status) {
    case 'Passed':
      return { tone: 'ok', label: 'Đạt' };
    case 'Warning':
      return { tone: 'wait', label: 'Cảnh báo — cần đọc lại' };
    case 'Unavailable':
      return { tone: 'wait', label: 'Không kiểm tra được' };
    case 'Blocked':
      return { tone: 'flag', label: 'Không đạt' };
    case 'NotRun':
    default:
      return { tone: 'draft', label: 'Chưa chạy' };
  }
}

export function warningSourceLabel(source: string): string {
  if (source === 'ContentSafety') return 'Đánh giá an toàn (AI)';
  if (source === 'GrayZone') return 'Kiểm tra vùng xám (AI)';
  return source;
}

export function warningReasonVi(w: PackageAssessmentWarning): string {
  if (w.source === 'ContentSafety') {
    return 'AI đánh giá an toàn tạm thời không khả dụng. Bạn cần tự đọc lại truyện trước khi xác nhận.';
  }
  if (w.source === 'GrayZone' && w.code === 'GRAY_ZONE_WARNING') {
    return w.reason
      ? `Nội dung cần phụ huynh xem lại: ${w.reason}`
      : 'Nội dung có chi tiết cần phụ huynh tự đọc lại và xác nhận.';
  }
  if (w.source === 'GrayZone') {
    return 'AI kiểm tra vùng xám tạm thời không khả dụng. Bạn cần tự đọc lại truyện trước khi xác nhận.';
  }
  return w.reason;
}

export function isCheckingPackage(p: ParentPackage): boolean {
  return p.status === 'PendingCheck' || p.status === 'Checking';
}

export function isGeneratingPackage(p: ParentPackage): boolean {
  if (p.status === 'Generating') return true;
  return Object.entries(p.componentStatus ?? {}).some(
    ([k, v]) => k !== 'check' && (v === 'Pending' || v === 'Processing'),
  );
}

export function runningBannerText(live: ParentPackage[]): string | null {
  const generatingAny = live.some(isGeneratingPackage);
  if (generatingAny) {
    return 'Đang tạo học liệu. Tạm khoá chuyển bước, giao và mở lại cho tới khi xong.';
  }
  if (live.some(isCheckingPackage)) {
    return 'Đang kiểm tra truyện theo hồ sơ từng bé (chưa tạo học liệu). Tạm khoá chuyển bước, giao và mở lại cho tới khi xong.';
  }
  return null;
}
