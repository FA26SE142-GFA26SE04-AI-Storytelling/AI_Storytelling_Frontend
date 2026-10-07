"use client";

import { useState } from "react";
import type { UseAIStoryInputFlowResult } from "../../closet/hooks/useAIStoryInputFlow";
import BriefForm from "./BriefForm";
import OutlinePanel from "./OutlinePanel";
import StageProgress from "./StageProgress";
import PondBackdrop from "../../brand/PondBackdrop";
import type { Stage, StatusSnapshot } from "./useStoryPipeline";

type Props = {
  flow: UseAIStoryInputFlowResult;
  stage: Stage;
  storyId: number | null;
  snapshot: StatusSnapshot | null;
  errorCode: string | null;
  timedOut: boolean;
  statusError: string | null;
  refresh: () => void;
  onOutlineApproved: () => void;
  onNew: () => void;
};

export default function StudioPlan({ flow, stage, storyId, snapshot, errorCode, timedOut, statusError, refresh, onOutlineApproved, onNew }: Props) {
  const [tab, setTab] = useState<"brief" | "outline">("brief");
  const hasOutline = !!snapshot?.outline?.currentVersion;
  // Khi dàn ý sẵn sàng chờ duyệt, tự chuyển sang tab Dàn ý.
  const shown = hasOutline && (stage === "outline" || tab === "outline") ? "outline" : "brief";
  const blocked = stage === "blocked";

  return (
    <section className="ws create">
      <div className="pane">
        <div className="tabs">
          <button className={shown === "brief" ? "on" : ""} onClick={() => setTab("brief")}>Yêu cầu</button>
          <button className={shown === "outline" ? "on" : ""} disabled={!hasOutline} onClick={() => setTab("outline")}>Dàn ý</button>
          {stage !== "brief" && <button style={{ marginLeft: "auto", color: "var(--link)" }} onClick={onNew}>Làm truyện mới</button>}
        </div>
        {shown === "brief"
          ? <BriefForm flow={flow} locked={stage !== "brief"} />
          : storyId !== null && <OutlinePanel storyId={storyId} version={snapshot?.outline?.currentVersion ?? null} editable={stage === "outline"} onApproved={onOutlineApproved} onChanged={refresh} />}
      </div>

      <div className="center">
        <div className="board" style={{ padding: 0 }}>
          <div className="board-wrap">
            <PondBackdrop />
            <StageProgress
              stage={stage}
              snapshot={snapshot}
              message={blocked ? flow.errorMessage : statusError}
              errorCode={errorCode}
              timedOut={timedOut || flow.isPollingTimedOut}
              onRetry={blocked && flow.canRetryInput ? () => void flow.retry() : flow.isPollingTimedOut ? () => void flow.checkStatus() : refresh}
              onEdit={blocked ? flow.editInput : undefined}
            />
          </div>
        </div>
      </div>

      <div className="pane">
        <div className="ph"><span>Quy tắc an toàn</span></div>
        <div className="pb">
          {flow.context ? (
            <>
              <div className="kv">
                <div><small>Độ dài tối đa</small><b>{flow.context.maximumLength} từ</b></div>
                <div><small>Từ vựng</small><b>{flow.context.defaultVocabularyLevel.replace("level_", "Mức ")}</b></div>
                <div><small>Chế độ duyệt</small><b>{/auto/i.test(flow.context.requiredApprovalMode) ? "Tự duyệt" : "Duyệt tay"}</b></div>
                <div><small>Ngôn ngữ</small><b>{flow.context.defaultLanguage}</b></div>
              </div>
              {flow.context.interests.length > 0 && <div className="sec"><div className="sec-h">Sở thích của bé</div><div className="chips">{flow.context.interests.map((i) => <span key={i} className="chip">{i}</span>)}</div></div>}
              {flow.context.blockedCategoryCodes.length > 0 && <div className="sec"><div className="sec-h">Chủ đề bị chặn</div><div className="chips">{flow.context.blockedCategoryCodes.map((i) => <span key={i} className="chip block">{i}</span>)}</div></div>}
            </>
          ) : <p className="sub">Đang tải…</p>}
        </div>
      </div>
    </section>
  );
}
