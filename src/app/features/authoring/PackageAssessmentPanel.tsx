'use client';
import type { PackageCheck, ParentPackage } from '@/app/services/parentPackageService';
import { issueText, topicNames } from './issueText';
import {
  acknowledgementKey,
  assessmentStatusView,
  isLegacyCheck,
  needsAssessmentAcknowledgement,
  warningReasonVi,
  warningSourceLabel,
} from './packageAssessment';

/** Chi tiết khi AI chấm an toàn không đạt: chủ đề bị chặn, câu dính chủ đề và chỗ đổi cài đặt. */
function SafetyDetail({ check, kid }: { check: PackageCheck; kid: string }) {
  const topics = topicNames(check.violations);
  const quotes = [...new Set(check.evidence ?? [])].slice(0, 3);
  return (
    <div className="fp-safety">
      {topics.length > 0 && (
        <span>
          Chủ đề {check.reasonCode === 'BLOCKED_TOPIC' ? 'đang bị chặn' : 'cần lưu ý'} với {kid}:{' '}
          <b>{topics.join(', ')}</b>
        </span>
      )}
      {quotes.length > 0 && <span>Chỗ trong truyện: {quotes.map((q) => `“${q}”`).join(' · ')}</span>}
      {check.reasonCode === 'BLOCKED_TOPIC' && (
        <span>
          Muốn giao cho {kid}, hãy sửa truyện để bỏ chủ đề này, hoặc bỏ chặn ở Hồ sơ bé › An toàn › Chủ đề rồi bấm
          &quot;Đổi thành phần&quot; để tạo bản gói mới.
        </span>
      )}
    </div>
  );
}

export default function PackageAssessmentPanel({
  pkg,
  kidName,
  canConfirmPackage,
  canWrite,
  busy,
  acknowledged,
  onAcknowledgeChange,
}: {
  pkg: ParentPackage;
  kidName: string;
  canConfirmPackage: boolean;
  canWrite: boolean;
  busy: boolean;
  acknowledged: boolean;
  onAcknowledgeChange: (checked: boolean) => void;
}) {
  const check = pkg.check;
  const legacy = isLegacyCheck(check);
  const warnings = check?.warnings ?? [];
  const requiresAck = needsAssessmentAcknowledgement(pkg);
  const ackKey = acknowledgementKey(pkg);

  return (
    <div className="fp-assess">
      {(pkg.status === 'PendingCheck' || pkg.status === 'Checking') && (
        <p className="notice" data-inline-notice>
          Đang kiểm tra truyện theo hồ sơ của {kidName} (chưa tạo học liệu).
        </p>
      )}

      {check && !legacy && (
        <div className="fp-assess-statuses">
          {(() => {
            const s = assessmentStatusView(check.safetyStatus);
            const g = assessmentStatusView(check.grayZoneStatus);
            return (
              <>
                <span className={`pill ${s.tone}`}>
                  Đánh giá an toàn: {s.label}
                  {check.safetyScore != null ? ` (${check.safetyScore} điểm)` : ''}
                </span>
                <span className={`pill ${g.tone}`}>Kiểm tra vùng xám: {g.label}</span>
              </>
            );
          })()}
        </div>
      )}

      {check && !check.passed && check.errors.length > 0 && (
        <ul className="pa-issues">
          {check.errors.map((e) => (
            <li className="err" key={e}>
              {issueText(e)}
              {e === 'CONTENT_SAFETY_NOT_PASSED' && <SafetyDetail check={check} kid={kidName} />}
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="pa-issues fp-warnings">
          {warnings.map((w, idx) => (
            <li className="warn" key={`${w.source}-${w.code}-${idx}`}>
              <b>{warningSourceLabel(w.source)}:</b> {warningReasonVi(w)}
              {w.evidence?.length > 0 && (
                <div className="fp-safety">
                  <span>Dẫn chứng trong truyện: {w.evidence.map((q) => `“${q}”`).join(' · ')}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {pkg.status === 'Review' && requiresAck && canConfirmPackage && (
        <label className="fp-ack" key={ackKey}>
          <input
            type="checkbox"
            checked={acknowledged}
            disabled={busy || !canWrite}
            onChange={(e) => onAcknowledgeChange(e.target.checked)}
          />
          <span>
            Tôi đã tự đọc lại truyện và các cảnh báo ở trên, xác nhận phù hợp với {kidName}.
          </span>
        </label>
      )}

      {pkg.status === 'Confirmed' && check?.acknowledgement && (
        <p className="fp-ack-done">
          Đã xác nhận cảnh báo cho bản {check.acknowledgement.packageRevision}.
        </p>
      )}
    </div>
  );
}
