"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useAuth } from "@/app/context/AuthContext";
import AppShell from "@/app/components/shell/AppShell";
import LoginScreen from "@/app/components/shell/LoginScreen";
import { WorkspaceDataProvider, useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { WORKSPACES, type WorkspaceId, type WorkspaceProps } from "@/app/components/shell/nav";
import HomeWorkspace from "@/app/features/home/HomeWorkspace";
import StudioWorkspace from "@/app/features/studio/StudioWorkspace";
import LibraryWorkspace from "@/app/features/library/LibraryWorkspace";
import ReviewWorkspace from "@/app/features/review/ReviewWorkspace";
import ReportWorkspace from "@/app/features/report/ReportWorkspace";
import SafetyWorkspace from "@/app/features/safety/SafetyWorkspace";
import KidMode from "@/app/features/kid/KidMode";

// Mỗi không gian một component. Thêm không gian mới: khai báo trong nav.ts rồi thêm vào đây.
const VIEWS: Record<WorkspaceId, ComponentType<WorkspaceProps>> = {
  home: HomeWorkspace,
  studio: StudioWorkspace,
  library: LibraryWorkspace,
  review: ReviewWorkspace,
  report: ReportWorkspace,
  safety: SafetyWorkspace,
};

function Workspaces() {
  const { child, childrenLoading } = useWorkspaceData();
  const [ws, setWs] = useState<WorkspaceId>("home");
  const [kid, setKid] = useState(false);
  const View = VIEWS[ws];

  // Cho phép mở thẳng một không gian bằng #home, #lib, #review...
  useEffect(() => {
    const id = window.location.hash.slice(1) as WorkspaceId;
    if (WORKSPACES.some((w) => w.id === id)) setWs(id);
  }, []);

  return (
    <>
      <AppShell ws={ws} onWs={setWs} onKid={() => setKid(true)}>
        {childrenLoading
          ? <div className="splash">Đang tải hồ sơ bé…</div>
          : <View go={setWs} onKid={() => setKid(true)} />}
      </AppShell>
      {kid && child && <KidMode onExit={() => setKid(false)} />}
    </>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (!isLoading) setBooted(true);
  }, [isLoading]);

  if (!booted && !user) return <div className="splash">Đang kiểm tra phiên đăng nhập…</div>;
  if (!user) return <LoginScreen />;
  return (
    <WorkspaceDataProvider key={user.id}>
      <Workspaces />
    </WorkspaceDataProvider>
  );
}
