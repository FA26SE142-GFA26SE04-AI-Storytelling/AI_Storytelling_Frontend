'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import Select from '@/app/components/Select';
import {
  buildChangeRequestPayload,
  changeDialogReducer,
  changePartConfigs,
  changeTargetOptions,
  createChangeDialogState,
  submitChangeRequest,
  type ChangeReviewItem,
  type ValidChangeRequestPayload,
} from './changeRequestOptions';

export interface ChangeRequestDialogProps {
  open: boolean;
  item: ChangeReviewItem;
  initialNote: string;
  initialPartType?: string;
  initialTargetId?: string;
  busy: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (payload: ValidChangeRequestPayload) => Promise<boolean>;
}

/** Hộp thoại Yêu cầu chỉnh sửa: chọn trực tiếp cảnh, câu đố, từ vựng, tương tác hoặc truyện trong lộ trình thay cho nhập ID. */
export default function ChangeRequestDialog({
  open,
  item,
  initialNote,
  initialPartType,
  initialTargetId,
  busy,
  errorMessage,
  onClose,
  onSubmit,
}: ChangeRequestDialogProps) {
  const [state, dispatch] = useReducer(
    changeDialogReducer,
    undefined,
    () => createChangeDialogState(item, initialNote, initialPartType, initialTargetId),
  );
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const itemKey = `${item.kind}:${item.data.itemId}`;
  const prevOpenKey = useRef('');

  useEffect(() => {
    if (!open) {
      prevOpenKey.current = '';
      return;
    }
    if (prevOpenKey.current !== itemKey) {
      prevOpenKey.current = itemKey;
      dispatch({ type: 'reset', item, initialNote, initialPartType, initialTargetId });
    }
  }, [open, itemKey, item, initialNote, initialPartType, initialTargetId]);

  if (!open) return null;

  const locked = busy || submitting;
  const partConfigs = changePartConfigs(item.kind);
  const activePart = partConfigs.find(c => c.value === state.partType) ?? partConfigs[0];
  const targetOptions = activePart.requiresTarget ? changeTargetOptions(item, activePart.value) : [];
  const selectedOption = activePart.requiresTarget
    ? targetOptions.find(o => o.value === state.targetId) ?? null
    : null;
  const missingTargets = activePart.requiresTarget && targetOptions.length === 0;
  const canSubmit = !!state.note.trim() && (!activePart.requiresTarget || !!selectedOption);
  const displayError = state.localError || errorMessage || '';

  const handleSubmit = async () => {
    const built = buildChangeRequestPayload(item, activePart.value, state.targetId, state.note);
    if (!built.ok) {
      if (built.error.includes('không còn') || built.error.includes('Vui lòng chọn')) {
        dispatch({ type: 'setTargetId', targetId: '' });
      }
      dispatch({ type: 'setError', error: built.error });
      return;
    }
    await submitChangeRequest(
      () => onSubmit(built),
      () => inFlight.current || busy,
      (v) => { inFlight.current = v; setSubmitting(v); },
      onClose,
    );
  };

  return (
    <Dialog
      title="Yêu cầu chỉnh sửa"
      className="st-dlg st-change-dlg"
      onClose={() => { if (!locked) onClose(); }}
    >
      <div className="st-form">
        <div className="field">
          <span className="lbl">Phần cần sửa</span>
          <Select<string>
            portal
            disabled={locked}
            ariaLabel="Phần cần sửa"
            value={activePart.value}
            options={partConfigs.map(p => ({ value: p.value, label: p.label }))}
            onChange={(v) => dispatch({ type: 'setPartType', partType: v })}
          />
        </div>

        {activePart.requiresTarget && (
          <div className="field">
            <span className="lbl">Chọn nội dung cần sửa</span>
            {missingTargets ? (
              <p className="notice warn" role="status">{activePart.emptyMessage}</p>
            ) : (
              <>
                <Select<string>
                  portal
                  disabled={locked}
                  ariaLabel="Chọn nội dung cần sửa"
                  placeholder="Chọn nội dung cần sửa…"
                  value={state.targetId}
                  options={targetOptions.map(o => ({ value: o.value, label: o.label }))}
                  onChange={(v) => dispatch({ type: 'setTargetId', targetId: v })}
                />
                {selectedOption && (
                  <div className="st-quote st-change-preview" role="region" aria-label="Xem trước nội dung đã chọn">
                    <small>{selectedOption.previewTitle}</small>
                    <p style={{ whiteSpace: 'pre-line' }}>{selectedOption.previewBody}</p>
                    {selectedOption.previewMeta && <span className="st-review-meta">{selectedOption.previewMeta}</span>}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <label className="field">
          <span className="lbl">
            Nội dung cần sửa <span className="st-review-meta">({state.note.length}/1000)</span>
          </span>
          <textarea
            className="inp"
            rows={4}
            maxLength={1000}
            disabled={locked}
            value={state.note}
            onChange={(e) => dispatch({ type: 'setNote', note: e.target.value })}
          />
        </label>

        {displayError && <div className="notice err" role="alert">{displayError}</div>}

        <div className="row st-wrap" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-g" disabled={locked} onClick={onClose}>Huỷ</button>
          <button type="button" className="btn btn-p" disabled={locked || !canSubmit} onClick={() => void handleSubmit()}>
            <Check className="ic" />{locked ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
