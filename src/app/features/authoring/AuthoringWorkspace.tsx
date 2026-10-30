"use client";

import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import ParentAuthoringWorkspace from "./ParentAuthoringWorkspace";

/** Trang Thủ công: phụ huynh tự soạn truyện gia đình, tự kiểm tra và giao cho bé. Có `resumeStoryId` thì mở thẳng bản nháp đó. */
export default function AuthoringWorkspace({ resumeStoryId }: Pick<WorkspaceProps, "resumeStoryId">) {
  const { child } = useWorkspaceData();
  if (!child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><b className="display">Chưa có hồ sơ bé</b><span>Cần có hồ sơ bé để soạn truyện.</span></div></div>
      </section>
    );
  }
  return <ParentAuthoringWorkspace key={child.id} childId={child.id} initialStoryId={resumeStoryId ?? null} />;
}
