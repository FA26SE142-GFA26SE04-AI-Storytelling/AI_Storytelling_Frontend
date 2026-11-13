"use client";

import type { WorkspaceProps } from "@/app/components/shell/nav";
import ParentAuthoringWorkspace from "./ParentAuthoringWorkspace";

/**
 * Trang Tự viết: phụ huynh tự soạn truyện gia đình, tự kiểm tra và giao cho các bé.
 * Không cần chọn trước bé; bé được chọn ở bước giao gói (Gói cho từng bé).
 */
export default function AuthoringWorkspace({ go, resumeStoryId }: Pick<WorkspaceProps, "go" | "resumeStoryId">) {
  return (
    <ParentAuthoringWorkspace
      key={resumeStoryId ?? "new"}
      initialStoryId={resumeStoryId ?? null}
      onDone={() => go("created")}
    />
  );
}
