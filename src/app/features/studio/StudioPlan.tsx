"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import type { UseAIStoryInputFlowResult } from "@/app/features/story-workflow/useAIStoryInputFlow";
import BriefForm from "./BriefForm";
import OutlinePanel from "./OutlinePanel";
import StageProgress from "./StageProgress";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import type { Stage, StatusSnapshot } from "./useStoryPipeline";
import { useSwap } from "@/app/lib/motion";

type Props = {
  flow: UseAIStoryInputFlowResult;
  stage: Stage;
  storyId: number | null;
  snapshot: StatusSnapshot | null;
  errorCode: string | null;
  timedOut: boolean;
  statusError: string | null;
  /** Có khi bước AI vừa lỗi và backend cho thử lại (viết truyện / học liệu, dàn ý lần đầu). */
  retryFailed?: () => Promise<{ success: boolean; message: string }>;
  refresh: () => void;
  onOutlineApproved: () => void;
};

type View = "brief" | "outline" | "status";
const VIEW_ORDER: Record<View, number> = { brief: 0, status: 1, outline: 2 };

/** Ô lớn mặc định hiện thứ cần làm ở bước hiện tại: form ý tưởng, dàn ý chờ duyệt, hoặc thẻ AI đang làm. */
function autoView(stage: Stage): View {
  if (stage === "brief") return "brief";
  if (stage === "outline") return "outline";
  return "status";
}

export default function StudioPlan({ flow, stage, storyId, snapshot, errorCode, timedOut, statusError, retryFailed, refresh, onOutlineApproved }: Props) {
  // Lựa chọn tab chỉ có hiệu lực trong bước đã chọn; sang bước mới thì quay về view mặc định.
  const [choice, setChoice] = useState<{ stage: Stage; view: View } | null>(null);
  const hasOutline = !!snapshot?.outline?.currentVersion && storyId !== null;
  const auto = autoView(stage);
  let view = choice?.stage === stage ? choice.view : auto;
  if (view === "outline" && !hasOutline) view = auto === "outline" ? "status" : auto;
  const pick = (v: View) => setChoice({ stage, view: v });
  // Nội dung ô lớn trượt theo hướng của bước: tiến tới thì trượt từ phải, quay lại thì từ trái.
  const viewRef = useSwap<HTMLDivElement>(view, VIEW_ORDER[view] >= VIEW_ORDER[auto] ? 1 : -1);
  const blocked = stage === "blocked";
  const statusLabel = blocked ? "Ý tưởng bị chặn" : stage === "stopped" ? "Đã dừng" : "AI đang làm";

  return (
    <>
      <div className="center plan-center">
        <div className="tabs plan-tabs" role="tablist">
          <button role="tab" aria-selected={view === "brief"} className={view === "brief" ? "on" : ""} disabled={!flow.context && stage !== 'brief'} onClick={() => pick("brief")}>Yêu cầu</button>
          <button role="tab" aria-selected={view === "outline"} className={view === "outline" ? "on" : ""} disabled={!hasOutline} onClick={() => pick("outline")}>
            Dàn ý{stage === "outline" && <i className="tab-dot" aria-label="chờ bạn duyệt" />}
          </button>
          {auto === "status" && (
            <button role="tab" aria-selected={view === "status"} className={view === "status" ? "on" : ""} onClick={() => pick("status")}>{statusLabel}</button>
          )}
        </div>
        <div className="plan-stage">
          <PondBackdrop />
          <div ref={viewRef} className="plan-view">
            {view === "brief" && <div className="plan-scroll"><BriefForm flow={flow} locked={stage !== "brief"} /></div>}
            {/* Luôn dựng khi đã có dàn ý (ẩn khi xem tab khác) để nút duyệt trên thanh tiến trình còn đó. */}
            {hasOutline && storyId !== null && (
              <div className="plan-scroll" hidden={view !== "outline"}>
                <OutlinePanel storyId={storyId} version={snapshot?.outline?.currentVersion ?? null} editable={stage === "outline"} visible={view === "outline"} onReveal={() => pick("outline")} onApproved={onOutlineApproved} onChanged={refresh} />
              </div>
            )}
            {view === "status" && (
              <StageProgress
                stage={stage}
                snapshot={snapshot}
                message={blocked ? flow.errorMessage : statusError}
                errorCode={errorCode}
                timedOut={timedOut || flow.isPollingTimedOut}
                onRetry={blocked && flow.canRetryInput ? () => void flow.retry() : flow.isPollingTimedOut ? () => void flow.checkStatus() : refresh}
                onRetryFailed={retryFailed}
                onEdit={blocked && flow.valuesKnown ? flow.editInput : undefined}
              />
            )}
          </div>
        </div>
      </div>

      <AsidePane title="Quy tắc an toàn" icon={ShieldCheck}>
          {flow.context ? (
            <>
              <div className="kv">
                <div><small>Độ dài tối đa</small><b>{flow.context.maximumLength.toLocaleString("vi-VN")} tiếng</b></div>
                <div><small>Từ vựng</small><b>{flow.context.defaultVocabularyLevel.replace("level_", "Mức ")}</b></div>
                <div><small>Chế độ duyệt</small><b>{/auto/i.test(flow.context.requiredApprovalMode) ? "Tự duyệt" : "Duyệt tay"}</b></div>
                <div><small>Ngôn ngữ</small><b>Tiếng Việt</b></div>
              </div>
              {flow.context.interests.length > 0 && <div className="sec"><div className="sec-h">Sở thích của bé</div><div className="chips">{flow.context.interests.map((i) => <span key={i} className="chip">{i}</span>)}</div></div>}
              {flow.context.blockedCategoryCodes.length > 0 && <div className="sec"><div className="sec-h">Chủ đề bị chặn</div><div className="chips">{flow.context.blockedCategoryCodes.map((i) => <span key={i} className="chip block">{i}</span>)}</div></div>}
            </>
          ) : <p className="sub">{storyId ? 'Đang tiếp tục truyện đã lưu. Trạng thái và quyền thao tác được kiểm tra lại từ backend của truyện này.' : 'Đang tải…'}</p>}
      </AsidePane>
    </>
  );
}
