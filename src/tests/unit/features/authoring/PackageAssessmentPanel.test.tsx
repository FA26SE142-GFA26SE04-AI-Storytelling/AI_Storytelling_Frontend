import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import PackageAssessmentPanel from '@/app/features/authoring/PackageAssessmentPanel';
import {
  acknowledgementKey,
  assessmentStatusView,
  isCheckEligible,
  isLegacyCheck,
  needsAssessmentAcknowledgement,
  runningBannerText,
  warningReasonVi,
} from '@/app/features/authoring/packageAssessment';
import type { ParentPackage } from '@/app/services/parentPackageService';

function makePackage(overrides: Partial<ParentPackage> = {}): ParentPackage {
  return {
    packageId: 10,
    storyId: 1,
    storyVersionId: 2,
    childProfileId: 3,
    revision: 1,
    packageToken: 'tok-1',
    status: 'Review',
    components: { vocabulary: false, quiz: false, listening: false, images: false, narration: false },
    check: {
      passed: true,
      errors: [],
      safetyScore: 100,
      backendPassed: true,
      safetyStatus: 'Passed',
      grayZoneStatus: 'Passed',
      warnings: [],
      requiresParentAcknowledgement: false,
      acknowledgement: null,
    },
    lastErrorCode: null,
    confirmedAt: null,
    componentStatus: { check: 'Completed' },
    vocabularyCount: 0,
    quizCount: 0,
    listeningCount: 0,
    ...overrides,
  };
}

describe('packageAssessment & PackageAssessmentPanel', () => {
  it('distinguishes pending check from learning generation and shows independent evaluator statuses', () => {
    const pending = makePackage({ status: 'PendingCheck', check: null, componentStatus: { check: 'Pending' } });
    const pendingHtml = renderToStaticMarkup(
      <PackageAssessmentPanel
        pkg={pending}
        kidName="An"
        canConfirmPackage={false}
        canWrite={true}
        busy={false}
        acknowledged={false}
        onAcknowledgeChange={vi.fn()}
      />,
    );
    expect(pendingHtml).toContain('chưa tạo học liệu');
    expect(pendingHtml).not.toContain('Đang tạo học liệu');

    const unavailable = makePackage({
      check: {
        passed: true,
        errors: [],
        safetyScore: null,
        backendPassed: true,
        safetyStatus: 'Unavailable',
        grayZoneStatus: 'Passed',
        warnings: [
          {
            source: 'ContentSafety',
            code: 'CONTENT_SAFETY_UNAVAILABLE',
            reason: 'Content safety AI assessment was unavailable.',
            evidence: [],
            occurredAtUtc: '2026-11-16T00:00:00Z',
          },
        ],
        requiresParentAcknowledgement: true,
      },
    });
    expect(isCheckEligible(unavailable)).toBe(true);
    expect(needsAssessmentAcknowledgement(unavailable)).toBe(true);

    const html = renderToStaticMarkup(
      <PackageAssessmentPanel
        pkg={unavailable}
        kidName="An"
        canConfirmPackage={true}
        canWrite={true}
        busy={false}
        acknowledged={false}
        onAcknowledgeChange={vi.fn()}
      />,
    );
    expect(html).toContain('Đánh giá an toàn: Không kiểm tra được');
    expect(html).toContain('Kiểm tra vùng xám: Đạt');
    expect(html).not.toContain('Chưa phù hợp với bé');
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('checked=""');
    expect(html).toContain('Tôi đã tự đọc lại truyện và các cảnh báo ở trên, xác nhận phù hợp với An.');

    // Pending check with componentStatus.check === 'Processing' must still show checking banner, not learning generation.
    const checkingWithProcessingCheck = makePackage({
      status: 'Checking',
      check: null,
      componentStatus: { check: 'Processing', vocabulary: 'NotStarted' },
    });
    const banner = runningBannerText([checkingWithProcessingCheck]);
    expect(banner).toContain('chưa tạo học liệu');
    expect(banner).not.toContain('Đang tạo học liệu');

    // Unavailable warnings translate to Vietnamese regardless of provider error code.
    expect(
      warningReasonVi({
        source: 'ContentSafety',
        code: 'AI_PROVIDER_ACCESS_DENIED',
        reason: 'English provider access denied',
        evidence: [],
        occurredAtUtc: '2026-11-16T00:00:00Z',
      }),
    ).toContain('AI đánh giá an toàn tạm thời không khả dụng');
    expect(
      warningReasonVi({
        source: 'GrayZone',
        code: 'AI_EVALUATION_TIMEOUT',
        reason: 'English timeout',
        evidence: [],
        occurredAtUtc: '2026-11-16T00:00:00Z',
      }),
    ).toContain('AI kiểm tra vùng xám tạm thời không khả dụng');
  });

  it('renders gray-zone warning with real evidence and scopes acknowledgement key to package+revision+token', () => {
    const pkg = makePackage({
      packageId: 11,
      revision: 2,
      packageToken: 'tok-abc',
      check: {
        passed: true,
        errors: [],
        safetyScore: 90,
        backendPassed: true,
        safetyStatus: 'Passed',
        grayZoneStatus: 'Warning',
        warnings: [
          {
            source: 'GrayZone',
            code: 'GRAY_ZONE_WARNING',
            reason: 'fear: mild suspense',
            evidence: ['Đêm tối có tiếng gió rít.'],
            occurredAtUtc: '2026-11-16T00:00:00Z',
          },
        ],
        requiresParentAcknowledgement: true,
      },
    });

    const html = renderToStaticMarkup(
      <PackageAssessmentPanel
        pkg={pkg}
        kidName="Bình"
        canConfirmPackage={true}
        canWrite={true}
        busy={false}
        acknowledged={false}
        onAcknowledgeChange={vi.fn()}
      />,
    );
    expect(html).toContain('Kiểm tra vùng xám: Cảnh báo — cần đọc lại');
    expect(html).toContain('Đêm tối có tiếng gió rít.');
    expect(acknowledgementKey(pkg)).toBe('11:2:tok-abc');
    expect(acknowledgementKey({ ...pkg, packageToken: 'tok-xyz' })).not.toBe(acknowledgementKey(pkg));
    expect(acknowledgementKey({ ...pkg, revision: 3 })).not.toBe(acknowledgementKey(pkg));
  });

  it('keeps legacy passed checks eligible without acknowledgement and treats Blocked as ineligible', () => {
    const legacy = makePackage({
      check: { passed: true, errors: [], safetyScore: 100 },
    });
    expect(isLegacyCheck(legacy.check)).toBe(true);
    expect(isCheckEligible(legacy)).toBe(true);
    expect(needsAssessmentAcknowledgement(legacy)).toBe(false);

    const blocked = makePackage({
      status: 'Blocked',
      check: {
        passed: false,
        errors: ['MODERATION_HARD_BLOCK'],
        safetyScore: 100,
        backendPassed: true,
        safetyStatus: 'Passed',
        grayZoneStatus: 'Blocked',
        warnings: [],
        requiresParentAcknowledgement: false,
      },
    });
    expect(isCheckEligible(blocked)).toBe(false);
    expect(assessmentStatusView('Blocked').label).toBe('Không đạt');
  });

  it('sends acknowledgeAssessmentWarnings boolean in parentPackageService.confirm payload', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, message: '', data: makePackage({ status: 'Confirmed' }) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const { parentPackageService } = await import('@/app/services/parentPackageService');
      const pkg = makePackage({ packageId: 42, packageToken: 'tok-42' });
      await parentPackageService.confirm(7, pkg, true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      const parsed = JSON.parse(String(init.body));
      expect(parsed.packageToken).toBe('tok-42');
      expect(parsed.acknowledgeAssessmentWarnings).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
