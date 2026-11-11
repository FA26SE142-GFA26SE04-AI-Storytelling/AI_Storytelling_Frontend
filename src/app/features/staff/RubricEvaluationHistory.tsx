'use client';
import { CheckCheck, ChevronLeft, ChevronRight, History, Play } from 'lucide-react';
import Select from '@/app/components/Select';
import type * as B from '@/app/types/backendContracts';
import type { RubricAudit, RubricEvaluation, RubricPage } from '@/app/services/rubricService';
import { auditActionLabel, rubricAuditLines } from './readableJson';
import { fmt } from './ui';

const TRIAL_OPTIONS = {
  phase: ['phase1', 'phase2', 'phase3', 'phase4'].map((value, i) => ({ value, label: `Giai đoạn ${i + 1}` })),
  ageBand: [{ value: '6-8', label: '6–8 tuổi' }, { value: '9-10', label: '9–10 tuổi' }],
  language: [{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'Tiếng Anh' }],
};

export type ValidationResult = { valid: boolean; id: number; revision: number; contentHash: string; schemaVersion: string };
export type TrialInput = { phase: string; ageBand: string; language: string; title: string; content: string };

/** Khối Kiểm tra định nghĩa, Thử đánh giá AI và Lịch sử thay đổi của một bộ tiêu chí (tài liệu 09). */
export default function RubricEvaluationHistory({
  rubric,
  dirty,
  busy,
  conflictBlocked,
  validation,
  onValidate,
  trial,
  onTrialChange,
  evaluation,
  onEvaluate,
  audit,
  auditPage,
  onLoadAudit,
}: {
  rubric: B.RubricDto;
  dirty: boolean;
  busy: boolean;
  conflictBlocked: boolean;
  validation: ValidationResult | null;
  onValidate: () => void;
  trial: TrialInput;
  onTrialChange: (next: TrialInput) => void;
  evaluation: RubricEvaluation | null;
  onEvaluate: () => void;
  audit: RubricPage<RubricAudit> | null;
  auditPage: number;
  onLoadAudit: (page: number) => void;
}) {
  const locked = busy || conflictBlocked;
  const matchingEval = evaluation && evaluation.rubricId === rubric.id ? evaluation : null;

  return (
    <>
      <section className="rb-sec" aria-label="Kiểm tra định nghĩa">
        <b className="st-group-title">Kiểm tra định nghĩa</b>
        <p className="sub">
          Lưu bản nháp không tự kiểm tra hay kích hoạt bộ tiêu chí. Hãy kiểm tra định nghĩa ở revision hiện tại ({rubric.revision}) trước khi dùng.
        </p>
        {dirty && (
          <p className="notice warn" role="status" data-inline-notice>
            Bạn có thay đổi chưa lưu; kiểm tra chỉ áp dụng trên bản đã lưu (revision {rubric.revision}).
          </p>
        )}
        <div className="row st-wrap">
          <button type="button" className="btn btn-s" disabled={locked || dirty} onClick={onValidate}>
            <CheckCheck className="ic" />Kiểm tra định nghĩa
          </button>
        </div>
        {validation && validation.id === rubric.id && (
          <div className={`notice ${validation.valid ? 'ok' : 'err'}`} role="status" data-inline-notice>
            <span>
              {validation.valid ? 'Định nghĩa hợp lệ' : 'Định nghĩa chưa hợp lệ'} · Revision {validation.revision} · Schema {validation.schemaVersion} · Hash <code>{validation.contentHash}</code>
            </span>
          </div>
        )}
      </section>

      <section className="rb-sec" aria-label="Thử đánh giá AI">
        <b className="st-group-title">Thử đánh giá AI</b>
        <p className="sub">Thao tác này gọi AI thật bằng bộ tiêu chí đang mở và ghi lịch sử đánh giá; không tự chạy khi mở trang.</p>
        <div className="row st-fields st-wrap">
          {(['phase', 'ageBand', 'language'] as const).map(key => (
            <div className="field" key={key}>
              <span>{({ phase: 'Giai đoạn', ageBand: 'Độ tuổi', language: 'Ngôn ngữ' })[key]}</span>
              <Select<string> ariaLabel={key} disabled={locked} value={trial[key]} options={TRIAL_OPTIONS[key]} onChange={v => onTrialChange({ ...trial, [key]: v })} />
            </div>
          ))}
        </div>
        <label className="field">
          Tên truyện thử
          <input className="inp" disabled={locked} placeholder="Nhập tên truyện cần thử đánh giá" value={trial.title} onChange={e => onTrialChange({ ...trial, title: e.target.value })} />
        </label>
        <label className="field">
          Nội dung truyện thử
          <textarea className="inp" rows={5} disabled={locked} placeholder="Dán nội dung truyện để AI thử đánh giá theo bộ tiêu chí này" value={trial.content} onChange={e => onTrialChange({ ...trial, content: e.target.value })} />
        </label>
        <div>
          <button type="button" className="btn btn-s" disabled={locked || !trial.title.trim() || !trial.content.trim()} onClick={onEvaluate}>
            <Play className="ic" />Chạy thử
          </button>
        </div>
        {matchingEval && (
          <div className="sec">
            <b>Mức rủi ro: {matchingEval.riskScore}</b>
            <p className="sub">
              Áp dụng bộ #{matchingEval.rubricId} · {matchingEval.version} (revision {matchingEval.revision}) · {matchingEval.provider} · {matchingEval.model}
            </p>
            {matchingEval.findings.map((f, i) => (
              <blockquote key={i}>
                {f.evidenceQuote}
                <p>{f.reason} · {f.contextNote}</p>
              </blockquote>
            ))}
          </div>
        )}
      </section>

      <section className="rb-sec" aria-label="Lịch sử thay đổi">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <b className="st-group-title">Lịch sử thay đổi bộ tiêu chí</b>
          <button type="button" className="btn btn-s st-fit" disabled={busy} onClick={() => onLoadAudit(1)}>
            <History className="ic" />{audit ? 'Tải lại lịch sử' : 'Tải lịch sử'}
          </button>
        </div>
        {audit && (
          <>
            {audit.items.length === 0 ? (
              <p className="sub">Chưa có bản ghi lịch sử thay đổi cho bộ này.</p>
            ) : (
              <ul className="rb-audit-list">
                {audit.items.map(a => {
                  const lines = rubricAuditLines(a.beforeJson, a.afterJson);
                  return (
                    <li key={a.id}>
                      {fmt(a.createdAt)} · <b>{auditActionLabel(a.action)}</b> · tài khoản #{a.actorUserId}
                      {lines.length > 0 && (
                        <details>
                          <summary>Nội dung thay đổi</summary>
                          <ul>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="row">
              <button type="button" className="btn btn-s" disabled={busy || auditPage === 1} aria-label="Lịch sử trước" title="Lịch sử trước" onClick={() => onLoadAudit(auditPage - 1)}>
                <ChevronLeft className="ic" />
              </button>
              <span className="sub">Trang {auditPage}</span>
              <button type="button" className="btn btn-s" disabled={busy || auditPage * audit.pageSize >= audit.totalCount} aria-label="Lịch sử tiếp" title="Lịch sử tiếp" onClick={() => onLoadAudit(auditPage + 1)}>
                <ChevronRight className="ic" />
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
