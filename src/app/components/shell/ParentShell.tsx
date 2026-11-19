"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { childAccessService } from "@/app/services/childAccessService";
import AppShell from "@/app/components/shell/AppShell";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { WORKSPACES, type WorkspaceId, type WorkspaceProps } from "@/app/components/shell/nav";
import { appWorkspaceRoute, DEFAULT_WORKSPACE, takesStoryId } from "@/app/lib/workspaceLocation";
import StudioWorkspace from "@/app/features/studio/StudioWorkspace";
import AuthoringWorkspace from "@/app/features/authoring/AuthoringWorkspace";
import LibraryWorkspace from "@/app/features/library/LibraryWorkspace";
import CreatedStories from "@/app/features/created/CreatedStories";
import ReportWorkspace from "@/app/features/report/ReportWorkspace";
import KidMode from "@/app/features/kid/KidMode";
import ChildrenWorkspace from "@/app/features/children/ChildrenWorkspace";
import AccountWorkspace from "@/app/features/account/AccountWorkspace";
import LearningWorkspace from "@/app/features/learning/LearningWorkspace";
import { transitionWorkspace } from "@/app/lib/motion";
import "@/app/styles/mobile.css";

const VIEWS: Record<WorkspaceId, ComponentType<WorkspaceProps>> = {
  children: ChildrenWorkspace,
  studio: StudioWorkspace,
  authoring: AuthoringWorkspace,
  library: LibraryWorkspace,
  created: CreatedStories,
  roadmap: LearningWorkspace,
  report: ReportWorkspace,
  account: () => <AccountWorkspace page="profile" />,
  "account-payment": () => <AccountWorkspace page="payment" />,
  "account-activity": () => <AccountWorkspace page="activity" />,
};

export function resolveWorkspaceId(raw: string | undefined): WorkspaceId {
  return WORKSPACES.find((w) => w.id === raw)?.id ?? DEFAULT_WORKSPACE;
}

export default function ParentShell({
  workspace,
  storyId = null,
}: {
  workspace: WorkspaceId;
  storyId?: number | null;
}) {
  const router = useRouter();
  const { children: kids, childrenLoading } = useWorkspaceData();
  const [kid, setKid] = useState<{ id: number; storyId: number | null; resume?: boolean } | null>(null);
  const openKid = useCallback((id: number, targetStoryId: number | null = null) => setKid({ id, storyId: targetStoryId }), []);

  useLayoutEffect(() => {
    const s = childAccessService.readSession();
    if (s?.via === "profile_switcher") setKid({ id: s.childProfileId, storyId: null, resume: true });
  }, []);

  const closeKid = useCallback(() => setKid(null), []);
  const View = VIEWS[workspace];

  const go = useCallback<WorkspaceProps["go"]>((id, target) => transitionWorkspace(() => {
    router.push(appWorkspaceRoute(id, takesStoryId(id) ? target?.storyId ?? null : null));
  }), [router]);

  const kidChild = kids.find((k) => k.id === kid?.id) ?? null;
  const kidPending = !!kid && !kidChild && childrenLoading;
  const kidOpen = !!kidChild || kidPending;

  useEffect(() => {
    if (kid && !kidChild && !childrenLoading) {
      childAccessService.clearSession();
      setKid(null);
    }
  }, [kid, kidChild, childrenLoading]);

  return (
    <>
      <div inert={kidOpen} style={{ display: "contents" }}>
        <AppShell ws={workspace} onWs={go} onKid={(id) => openKid(id)}>
          {childrenLoading
            ? <div className="splash">Đang tải hồ sơ bé…</div>
            : <View key={takesStoryId(workspace) ? `${workspace}:${storyId ?? "new"}` : workspace} go={go} resumeStoryId={storyId} onKid={openKid} />}
        </AppShell>
      </div>
      {kidPending && <div className="kid" role="dialog" aria-modal="true" aria-label="Chế độ của bé"><div className="splash">Đang mở…</div></div>}
      {kidChild && <KidMode child={kidChild} storyId={kid?.storyId} resume={kid?.resume} onExit={closeKid} />}
    </>
  );
}
