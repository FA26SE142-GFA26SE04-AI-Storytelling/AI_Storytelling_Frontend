"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { childAccessService } from "@/app/services/childAccessService";
import AppShell from "@/app/components/shell/AppShell";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { visibleWorkspaces, WORKSPACES, type WorkspaceId, type WorkspaceProps } from "@/app/components/shell/nav";
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
import EventsWorkspace from "@/app/features/events/EventsWorkspace";
import EventResultPopupHost from "@/app/features/events/EventResultPopup";
import { eventResultHref } from "@/app/features/events/eventNavigation";
import { transitionWorkspace } from "@/app/lib/motion";
import { useAccessLookup, useAccessReady } from "@/app/features/staff/staffAccess";
import "@/app/styles/mobile.css";

const VIEWS: Record<WorkspaceId, ComponentType<WorkspaceProps>> = {
  children: ChildrenWorkspace,
  studio: StudioWorkspace,
  authoring: AuthoringWorkspace,
  library: LibraryWorkspace,
  created: CreatedStories,
  roadmap: LearningWorkspace,
  events: (props) => <EventsWorkspace onKid={props.onKid} />,
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
  const [kid, setKid] = useState<{ id: number; storyId: number | null; resume?: boolean; onReturn?: () => void } | null>(null);
  const openKid = useCallback((id: number, targetStoryId: number | null = null, onReturn?: () => void) =>
    setKid({ id, storyId: targetStoryId, onReturn }), []);

  useLayoutEffect(() => {
    const s = childAccessService.readSession();
    if (s?.via === "profile_switcher") setKid({ id: s.childProfileId, storyId: null, resume: true });
  }, []);

  const closeKid = () => {
    setKid(null);
    kid?.onReturn?.();
  };
  const View = VIEWS[workspace];
  const access = useAccessLookup();
  const accessReady = useAccessReady();
  const allowed = visibleWorkspaces((code) => access(code).state !== "Hidden").some((w) => w.id === workspace);

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
          {childrenLoading || !accessReady
            ? <div className="splash">Đang tải hồ sơ bé…</div>
            : !allowed ? (
              <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
                <div className="pane"><div className="empty">
                  <b className="display">Bạn không có quyền dùng trang này</b>
                  <span>Quản trị viên đã tắt quyền cần cho trang này. Hãy chọn mục khác trên menu.</span>
                </div></div>
              </section>
            ) : <View key={takesStoryId(workspace) ? `${workspace}:${storyId ?? "new"}` : workspace} go={go} resumeStoryId={storyId} onKid={openKid} />}
        </AppShell>
      </div>
      {kidPending && <div className="kid" role="dialog" aria-modal="true" aria-label="Chế độ của bé"><div className="splash">Đang mở…</div></div>}
      {kidChild && <KidMode child={kidChild} storyId={kid?.storyId} resume={kid?.resume} onExit={closeKid} />}
      {!kidOpen && (
        <EventResultPopupHost
          onNavigateToEvent={(eventId, claimAwardId) => {
            router.push(eventResultHref("/app/events", { eventId, claimAwardId }), { scroll: false });
          }}
        />
      )}
    </>
  );
}
