'use client';

import React from 'react';
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { AIStoryInputFlowPhase } from '../hooks/aiStoryInputFlowUtils';
import { AIStoryInputProgressDto } from '../../../types/aiStory';

interface AIStoryGuardrailStatusProps {
  phase: AIStoryInputFlowPhase;
  progress: AIStoryInputProgressDto | null;
  message: string | null;
  isPollingTimedOut: boolean;
  onRetry: () => void;
  onCheckStatus: () => void;
  onEdit: () => void;
  canRetryInput?: boolean;
}

export const AIStoryGuardrailStatus: React.FC<AIStoryGuardrailStatusProps> = ({
  phase,
  progress,
  message,
  isPollingTimedOut,
  onRetry,
  onCheckStatus,
  onEdit,
  canRetryInput = true,
}) => {
  const isChecking = phase === 'submitting' || phase === 'checking_input';
  const isBlocked = phase === 'input_blocked';
  const isFailed = phase === 'input_check_failed';

  return (
    <div className={`p-8 rounded-3xl bg-tod-card border text-center space-y-4 shadow-xl ${isBlocked || isFailed ? 'border-rose-500/40' : 'border-sky-500/40'}`}>
      <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center border ${isBlocked || isFailed ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' : 'bg-sky-500/20 text-sky-500 border-sky-500/30'}`}>
        {isChecking && !isPollingTimedOut ? <Loader2 className="w-7 h-7 animate-spin" /> : isBlocked || isFailed ? <AlertCircle className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
      </div>
      <div>
        <h4 className="text-base font-extrabold text-tod-text">
          {isBlocked
            ? 'Ý tưởng cần được điều chỉnh'
            : isFailed
              ? 'Chưa thể hoàn tất kiểm tra an toàn'
              : isPollingTimedOut
                ? 'Kiểm tra đang lâu hơn dự kiến'
                : 'Trợ lý AI đang kiểm tra an toàn'}
        </h4>
        <p className="text-xs text-tod-text-muted mt-1 max-w-md mx-auto">
          {message || progress?.fallbackMessage || 'Hệ thống đang đối chiếu ý tưởng với chính sách an toàn dành cho bé.'}
        </p>
      </div>
      {progress && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-tod-text-muted">
          <span className="px-2.5 py-1 rounded-full bg-tod-surface border border-tod-border">
            {isBlocked ? 'Cần điều chỉnh' : isFailed ? 'Chưa hoàn tất' : 'Đang kiểm tra'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-tod-surface border border-tod-border">
            Lần kiểm tra: {progress.attemptCount}/{progress.maxAttempts}
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {isFailed && progress?.canRetry && !canRetryInput && <p className="text-xs text-tod-text-muted">Ý tưởng trước không được lưu trên trình duyệt. Vui lòng nhập lại nội dung để tiếp tục.</p>}
        {isPollingTimedOut && (
          <button type="button" onClick={onCheckStatus} className="btn-dashboard-primary text-xs px-4 py-2 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Kiểm tra lại trạng thái
          </button>
        )}
        {isFailed && progress?.canRetry && canRetryInput && (
          <button type="button" onClick={onRetry} className="btn-dashboard-primary text-xs px-4 py-2 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại kiểm tra
          </button>
        )}
        {(isBlocked || isFailed) && (
          <button type="button" onClick={onEdit} className="px-4 py-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text text-xs font-bold transition-colors cursor-pointer">
            Chỉnh sửa nội dung
          </button>
        )}
      </div>
    </div>
  );
};
