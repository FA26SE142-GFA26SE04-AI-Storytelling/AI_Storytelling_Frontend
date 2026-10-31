"use client";

import "./studio.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AsideContext } from "@/app/components/shell/AsidePane";
import { ApproveSlot, type ApproveAction } from "@/app/features/story-workflow/approveSlot";
import { useAuth } from "@/app/context/AuthContext";
import { removeStorySession } from "@/app/features/story-workflow/storyStudioSession";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import type { WorkspaceId, WorkspaceProps } from "@/app/components/shell/nav";
import { workspaceLocation } from '@/app/lib/workspaceLocation';
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
import { useMyRole } from "@/app/features/children/useMyRole";
import Frog from "@/app/components/brand/Frog";
import { chooseChild } from "@/app/lib/chooseChild";

type Prefill = AIStoryInputFormValues | null;

/** Mỗi section là một bố cục khác nhau của phần thân Studio; thanh tiến trình ở trên không đổi. */
type Section = "plan" | "review" | "media";
const sectionOf = (stage: Stage, storyId: number | null): Section =>
  storyId === null ? "plan" : stage === "review" ? "review" : stage === "media" ? "media" : "plan";

type PipelineProps = {
  resumeStoryId: number | null;
  userId: number;
  childId: number;
  prefill: Prefill;
  asideCollapsed: boolean;
  onToggleAside: () => void;
  onNew: (prefill?: Prefill) => void;
  /** Chọn lại bé khi chưa gửi ý tưởng (truyện chưa được tạo). */
  onChangeKid: () => void;
  go: (id: WorkspaceId) => void;
};

function Pipeline({ userId, childId, prefill, asideCollapsed, onToggleAside, onNew, onChangeKid, go, resumeStoryId }: PipelineProps) {
  const { children: kids, reload } = useWorkspaceData();
  const child = kids.find((k) => k.id === childId) ?? null;
  const [approved, setApproved] = useState(false);
  // Nút duyệt nằm trên thanh tiến trình; màn duyệt truyện đăng ký hành động duyệt của nó vào đây.
  const [approve, setApprove] = useState<ApproveAction | null>(null);
  const p = useStoryPipeline(userId, childId, approved, prefill, resumeStoryId);
  useEffect(() => {
    if (p.storyId) window.history.replaceState(null,'',workspaceLocation(window.location.href,'studio',p.storyId));
  }, [p.storyId]);
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
  if (p.resumed && !p.snapshot) return <section className="ws dock"><div className="pane"><div className="pb">
    <h2 className="display">{p.statusError ? 'Chưa mở được truyện đang tạo' : 'Đang mở lại truyện đang tạo…'}</h2>
    {p.statusError && <p className="notice err" role="alert">{p.statusError}</p>}
    <div className="row"><button className="btn btn-s" onClick={p.refresh}>Tải lại trạng thái truyện</button><button className="btn btn-s" onClick={() => go('library')}>Về thư viện</button></div>
  </div></div></section>;
  return (
    <section ref={bodyRef} className="ws with-steps" data-aside={asideCollapsed ? "collapsed" : undefined}>
      <StudioSteps progress={progress} context={p.resumed ? <><span role="status">Đang tiếp tục: {p.snapshot?.story?.title ?? `truyện #${p.storyId}`}</span><button className="btn btn-g" onClick={() => go('library')}>Về thư viện</button>{p.statusError && <button className="btn btn-s" onClick={p.refresh}>Tải lại trạng thái truyện</button>}</> : p.storyId === null && child ? <><span>Tạo truyện cho <b>{child.nickname}</b></span>{kids.length > 1 && <button className="btn btn-g" onClick={onChangeKid}>Đổi bé</button>}</> : undefined}>
        <StudioControls key={p.stage} stage={p.stage} valuesKnown={p.flow.valuesKnown} onEditIdea={p.flow.editInput} onRestart={restart} onStartNew={() => onNew()} approve={approve} />
      </StudioSteps>
      <AsideContext.Provider value={aside}>
      <ApproveSlot.Provider value={setApprove}>
      {section === "review" && p.storyId !== null ? (
        <ReviewGate
          key={p.storyId}
          storyId={p.storyId}
          ageBand={p.snapshot?.story?.ageBand ?? child?.ageBand ?? ""}
          onApproved={() => { p.refresh(); void reload(); }}
          onArchived={() => { void reload(); onNew(); }}
        />
      ) : section === "media" && p.storyId !== null ? (
        <StudioMedia key={p.storyId} storyId={p.storyId} childId={childId} ageBand={p.snapshot?.story?.ageBand??''} media={media} onFinish={() => { void reload(); onNew(); go("library"); }} />
      ) : (
        <StudioPlan
          flow={p.flow}
          stage={p.stage}
          storyId={p.storyId}
          snapshot={p.snapshot}
          errorCode={p.errorCode}
          timedOut={p.timedOut}
          statusError={p.statusError}
          retryFailed={p.retryFailed}
          refresh={p.refresh}
          onOutlineApproved={() => { setApproved(true); p.refresh(); }}
        />
      )}
      </ApproveSlot.Provider>
      </AsideContext.Provider>
    </section>
  );
}

export default function StudioWorkspace({ go, resumeStoryId }: Pick<WorkspaceProps,'go' | 'resumeStoryId'>) {
  const { user } = useAuth();
  const { children: kids } = useWorkspaceData();
  // Bé được chọn riêng cho trang Tạo truyện: chỉ có một bé đang hoạt động thì chọn luôn, nhiều bé thì hỏi bằng hộp chọn bé.
  const activeKids = kids.filter((k) => k.status === "Active");
  const [kidId, setKidId] = useState<number | null>(null);
  const child = kids.find((k) => k.id === kidId) ?? (activeKids.length === 1 ? activeKids[0] : null);
  const role = useMyRole(child);
  const [run, setRun] = useState(0);
  const [resumeTarget, setResumeTarget] = useState(resumeStoryId ?? null);
  // Ý tưởng điền lại khi "Quay lại ý tưởng"; chỉ giữ trong bộ nhớ, không lưu vào trình duyệt.
  const [prefill, setPrefill] = useState<Prefill>(null);
  // Giữ qua các truyện trong phiên làm việc: thu gọn một lần là đủ.
  const [asideCollapsed, setAsideCollapsed] = useState(false);
  const toggleAside = useCallback(() => setAsideCollapsed((v) => !v), []);

  const pickKid = async () => {
    const kid = await chooseChild({ title: "Tạo truyện cho bé nào?", filter: (k) => k.status === "Active" });
    if (kid) { setKidId(kid.id); setRun((n) => n + 1); }
  };
  // Vào trang mà chưa biết tạo cho bé nào thì mở hộp chọn bé ngay, chỉ một lần.
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current || resumeTarget || child || activeKids.length < 2) return;
    asked.current = true;
    void pickKid();
  });
  // Đang mở lại một truyện dở thì không cần chọn bé; bé chỉ dùng làm khoá lưu phiên tạm.
  const sessionKid = child ?? kids[0] ?? null;
  if (user && resumeTarget && sessionKid) {
    const back = () => { removeStorySession(user.id, sessionKid.id); setResumeTarget(null); window.history.replaceState(null,'',workspaceLocation(window.location.href,'studio')); setRun((n) => n + 1); };
    return <Pipeline resumeStoryId={resumeTarget} key={`${sessionKid.id}:${run}:${resumeTarget}`} userId={user.id} childId={sessionKid.id} prefill={null} asideCollapsed={asideCollapsed} onToggleAside={toggleAside} onNew={(next = null) => { setPrefill(next); back(); }} onChangeKid={() => void pickKid()} go={go} />;
  }
  if (user && !child && activeKids.length > 0) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty">
          <Frog size={100} mood="think" />
          <b className="display">Tạo truyện cho bé nào?</b>
          <span>Truyện AI được viết theo mức đọc và chính sách an toàn của từng bé.</span>
          <button className="btn btn-p" style={{ marginTop: 6 }} onClick={() => void pickKid()}>Chọn bé</button>
        </div></div>
      </section>
    );
  }
  if (!user || !child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><b className="display">Chưa có hồ sơ bé</b><span>Cần có hồ sơ bé để tạo truyện.</span></div></div>
      </section>
    );
  }
  if (!role) return <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}><div className="pane"><div className="empty"><span>Đang kiểm tra quyền…</span></div></div></section>;
  if (!role.can('GenerateStory')) return (
    <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
      <div className="pane">
        <div className="empty">
          <Frog size={100} mood="think" />
          <b className="display">Bạn chưa có quyền tạo truyện AI cho {child.nickname}</b>
          <span>Hãy xin quyền “Tạo truyện AI” từ người quản lý chính ở mục Hồ sơ bé.</span>
          <div className="row" style={{ justifyContent: "center", marginTop: 6 }}>
            {activeKids.length > 1 && <button className="btn btn-p" onClick={() => void pickKid()}>Chọn bé khác</button>}
            <button className="btn btn-s" onClick={() => go("children")}>Mở Hồ sơ bé</button>
            {role.can('AssignActivity') && <button className="btn btn-s" onClick={() => go("authoring")}>Làm thủ công</button>}
          </div>
        </div>
      </div>
    </section>
  );
  const reset = (next: Prefill = null) => { removeStorySession(user.id, child.id); setResumeTarget(null); window.history.replaceState(null,'',workspaceLocation(window.location.href,'studio')); setPrefill(next); setRun((n) => n + 1); };
  return <Pipeline resumeStoryId={resumeTarget} key={`${child.id}:${run}:${resumeTarget ?? 'new'}`} userId={user.id} childId={child.id} prefill={prefill} asideCollapsed={asideCollapsed} onToggleAside={toggleAside} onNew={reset} onChangeKid={() => void pickKid()} go={go} />;
}
