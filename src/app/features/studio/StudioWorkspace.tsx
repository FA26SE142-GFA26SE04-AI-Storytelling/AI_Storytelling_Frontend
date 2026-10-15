"use client";

import "./studio.css";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { removeStorySession } from "@/app/features/story-workflow/storyStudioSession";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import type { WorkspaceId } from "@/app/components/shell/nav";
import StudioPlan from "./StudioPlan";
import StudioReview from "./StudioReview";
import { useStoryPipeline } from "./useStoryPipeline";
import ImportStoryPanel from "./ImportStoryPanel";

function Pipeline({ userId, childId, onNew, go, onImport }: { userId: number; childId: number; onNew: () => void; go: (id: WorkspaceId) => void; onImport: () => void }) {
  const { reload } = useWorkspaceData();
  const [approved, setApproved] = useState(false);
  const p = useStoryPipeline(userId, childId, approved);

  if ((p.stage === "review" || p.stage === "media") && p.storyId !== null) {
    return (
      <StudioReview
        key={p.storyId}
        storyId={p.storyId}
        mediaStage={p.stage === "media"}
        onApproved={() => { p.refresh(); void reload(); }}
        onFinish={() => { void reload(); onNew(); go("library"); }}
      />
    );
  }
  return (
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
      onNew={onNew}
      onImport={onImport}
    />
  );
}

export default function StudioWorkspace({ go }: { go: (id: WorkspaceId) => void }) {
  const { user } = useAuth();
  const { child, reload } = useWorkspaceData();
  const [run, setRun] = useState(0);
  const [importing, setImporting] = useState(false);

  if (!user || !child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><b className="display">Chưa có hồ sơ bé</b><span>Cần có hồ sơ bé để tạo truyện.</span></div></div>
      </section>
    );
  }
  if (importing) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="tabs">
            <button onClick={() => setImporting(false)}>Tạo bằng AI</button>
            <button className="on">Nhập truyện có sẵn</button>
          </div>
          <ImportStoryPanel key={`${child.id}:${run}`} child={child} go={go} onDone={() => { void reload(); setRun((n) => n + 1); }} />
        </div>
      </section>
    );
  }
  const reset = () => { removeStorySession(user.id, child.id); setRun((n) => n + 1); };
  return <Pipeline key={`${child.id}:${run}`} userId={user.id} childId={child.id} onNew={reset} go={go} onImport={() => setImporting(true)} />;
}
