"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import AppShell from "./components/shell/AppShell";
import LoginScreen from "./components/shell/LoginScreen";
import { WorkspaceDataProvider, useWorkspaceData } from "./components/shell/WorkspaceData";
import { WORKSPACES, type WorkspaceId } from "./components/shell/nav";
import HomeWorkspace from "./components/workspaces/HomeWorkspace";
import StudioWorkspace from "./components/workspaces/studio/StudioWorkspace";
import LibraryWorkspace from "./components/workspaces/LibraryWorkspace";
import ReviewWorkspace from "./components/workspaces/ReviewWorkspace";
import ReportWorkspace from "./components/workspaces/ReportWorkspace";
import SafetyWorkspace from "./components/workspaces/SafetyWorkspace";
import KidMode from "./components/workspaces/KidMode";

function Workspaces() {
  const { child, childrenLoading } = useWorkspaceData();
  const [ws, setWs] = useState<WorkspaceId>("home");
  const [kid, setKid] = useState(false);

  // Cho phép mở thẳng một không gian bằng #home, #lib, #review...
  useEffect(() => {
    const id = window.location.hash.slice(1) as WorkspaceId;
    if (WORKSPACES.some((w) => w.id === id)) setWs(id);
  }, []);

  return (
    <>
      <AppShell ws={ws} onWs={setWs} onKid={() => setKid(true)}>
        {childrenLoading ? <div className="splash">Đang tải hồ sơ bé…</div> : (
          <>
            {ws === "home" && <HomeWorkspace go={setWs} onKid={() => setKid(true)} />}
            {ws === "create" && <StudioWorkspace go={setWs} />}
            {ws === "lib" && <LibraryWorkspace go={setWs} />}
            {ws === "review" && <ReviewWorkspace go={setWs} />}
            {ws === "report" && <ReportWorkspace />}
            {ws === "safe" && <SafetyWorkspace />}
          </>
        )}
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
