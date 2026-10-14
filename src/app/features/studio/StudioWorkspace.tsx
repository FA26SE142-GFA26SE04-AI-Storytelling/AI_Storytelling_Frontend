"use client";

import "./studio.css";
import { useCallback, useMemo, useState } from "react";
import { AsideContext } from "@/app/components/shell/AsidePane";
import { ApproveSlot, type ApproveAction } from "@/app/features/story-workflow/approveSlot";
import { useAuth } from "@/app/context/AuthContext";
import { removeStorySession } from "@/app/features/story-workflow/storyStudioSession";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import type { WorkspaceId } from "@/app/components/shell/nav";
import StudioPlan from "./StudioPlan";
import StudioMedia from "./StudioMedia";
import ReviewGate from "@/app/features/review/ReviewGate";
import StudioSteps from "./StudioSteps";
import StudioControls from "./StudioControls";
import type { AIStoryInputFormValues } from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import { studioProgress } from "./studioProgress";
import { useSteppedProgress } from "./useSteppedProgress";
import { useMediaProgress, useStoryPipeline, type Stage } from "./useStoryPipeline";
import { useRiseIn } from "@/app/lib/motion";

type Prefill = AIStoryInputFormValues | null;

/** Mỗi section là một bố cục khác nhau của phần thân Studio; thanh tiến trình ở trên không đổi. */
type Section = "plan" | "review" | "media";
const sectionOf = (stage: Stage, storyId: number | null): Section =>
  storyId === null ? "plan" : stage === "review" ? "review" : stage === "media" ? "media" : "plan";

type PipelineProps = {
  userId: number;
  childId: number;
  prefill: Prefill;
  asideCollapsed: boolean;
  onToggleAside: () => void;
  onNew: (prefill?: Prefill) => void;
  go: (id: WorkspaceId) => void;
};

function Pipeline({ userId, childId, prefill, asideCollapsed, onToggleAside, onNew, go }: PipelineProps) {
  const { reload } = useWorkspaceData();
  const [approved, setApproved] = useState(false);
  // Nút duyệt nằm trên thanh tiến trình; màn duyệt truyện đăng ký hành động duyệt của nó vào đây.
  const [approve, setApprove] = useState<ApproveAction | null>(null);
  const p = useStoryPipeline(userId, childId, approved, prefill);
  const media = useMediaProgress(p.stage === "media" ? p.storyId : null);
  const section = sectionOf(p.stage, p.storyId);
  // Chỉ phần thân (các khung mới vào) hiện dần khi đổi bố cục; thanh tiến trình đứng yên nên không nháy.
  const bodyRef = useRiseIn<HTMLElement>(":scope > :not(.studio-steps)", [section], { delay: 60, distance: 10 });

  const restart = async (keepIdea: boolean) => {
    // Lấy ý tưởng trước khi huỷ; chỉ điền lại khi chắc đó là ý tưởng đã gửi.
    const idea = keepIdea && p.flow.valuesKnown ? p.flow.values : null;
    const result = await p.cancel();
    if (!result.success) return result.message || "Chưa huỷ được truyện. Bạn thử lại nhé.";
    void reload();
    onNew(idea);
    return null;
  };
  // Lỗi cũ của bước viết truyện không áp cho bước media.
  const progress = useSteppedProgress(studioProgress(p.stage, p.snapshot, media.data, p.stage === "media" ? null : p.errorCode));

  // Cột phải thu gọn ở mọi state; cột lưới co giãn mượt bằng CSS (studio.css) và khung bên trong là AsidePane.
  const aside = useMemo(() => ({ collapsed: asideCollapsed, toggle: onToggleAside }), [asideCollapsed, onToggleAside]);
  return (
    <section ref={bodyRef} className="ws with-steps" data-aside={asideCollapsed ? "collapsed" : undefined}>
      <StudioSteps progress={progress}>
        <StudioControls key={p.stage} stage={p.stage} valuesKnown={p.flow.valuesKnown} onEditIdea={p.flow.editInput} onRestart={restart} onStartNew={() => onNew()} approve={approve} />
      </StudioSteps>
      <AsideContext.Provider value={aside}>
      <ApproveSlot.Provider value={setApprove}>
      {section === "review" && p.storyId !== null ? (
        <ReviewGate
          key={p.storyId}
          storyId={p.storyId}
          onApproved={() => { p.refresh(); void reload(); }}
          onArchived={() => { void reload(); onNew(); }}
        />
      ) : section === "media" && p.storyId !== null ? (
        <StudioMedia key={p.storyId} storyId={p.storyId} media={media} onFinish={() => { void reload(); onNew(); go("library"); }} />
      ) : (
        <StudioPlan
          flow={p.flow}
          stage={p.stage}
          storyId={p.storyId}
          snapshot={p.snapshot}
          errorCode={p.errorCode}
          timedOut={p.timedOut}
          statusError={p.statusError}
          refresh={p.refresh}
          onOutlineApproved={() => { setApproved(true); p.refresh(); }}
        />
      )}
      </ApproveSlot.Provider>
      </AsideContext.Provider>
    </section>
  );
}

export default function StudioWorkspace({ go }: { go: (id: WorkspaceId) => void }) {
  const { user } = useAuth();
  const { child } = useWorkspaceData();
  const [run, setRun] = useState(0);
  // Ý tưởng điền lại khi "Quay lại ý tưởng"; chỉ giữ trong bộ nhớ, không lưu vào trình duyệt.
  const [prefill, setPrefill] = useState<Prefill>(null);
  // Giữ qua các truyện trong phiên làm việc: thu gọn một lần là đủ.
  const [asideCollapsed, setAsideCollapsed] = useState(false);
  const toggleAside = useCallback(() => setAsideCollapsed((v) => !v), []);

  if (!user || !child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><b className="display">Chưa có hồ sơ bé</b><span>Cần có hồ sơ bé để tạo truyện.</span></div></div>
      </section>
    );
  }
  const reset = (next: Prefill = null) => { removeStorySession(user.id, child.id); setPrefill(next); setRun((n) => n + 1); };
  return <Pipeline key={`${child.id}:${run}`} userId={user.id} childId={child.id} prefill={prefill} asideCollapsed={asideCollapsed} onToggleAside={toggleAside} onNew={reset} go={go} />;
}
