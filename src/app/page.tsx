"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
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
import KidEntry from "@/app/features/kid/KidEntry";
import ChildrenWorkspace from "@/app/features/children/ChildrenWorkspace";
import AccountWorkspace from "@/app/features/account/AccountWorkspace";
import RoadmapWorkspace from "@/app/features/roadmap/RoadmapWorkspace";
import StaffApp from "@/app/features/staff/StaffApp";
import Landing from "@/app/features/landing/Landing";
import { isStaffRole } from "@/app/types/auth";
import { transitionWorkspace, useClickRipple } from "@/app/lib/motion";
// Nạp sau cùng để ghi đè CSS của các màn trên điện thoại.
import "@/app/styles/mobile.css";

// Mỗi không gian một component. Thêm không gian mới: khai báo trong nav.ts rồi thêm vào đây.
const VIEWS: Record<WorkspaceId, ComponentType<WorkspaceProps>> = {
  home: HomeWorkspace,
  children: ChildrenWorkspace,
  studio: StudioWorkspace,
  library: LibraryWorkspace,
  roadmap: RoadmapWorkspace,
  review: ReviewWorkspace,
  report: ReportWorkspace,
  safety: SafetyWorkspace,
  account: AccountWorkspace,
};

function Workspaces() {
  const { child, childrenLoading } = useWorkspaceData();
  const [ws, setWs] = useState<WorkspaceId>("home");
  const [kid, setKid] = useState(false);
  const View = VIEWS[ws];
  const go = useCallback((id: WorkspaceId) => transitionWorkspace(() => setWs(id)), []);

  // Cho phép mở thẳng một không gian bằng #home, #lib, #review...
  useEffect(() => {
    const id = window.location.hash.slice(1) as WorkspaceId;
    if (WORKSPACES.some((w) => w.id === id)) setWs(id);
  }, []);

  const kidOpen = kid && !!child;

  return (
    <>
      {/* Khi bé đang dùng, khoá hẳn khu người lớn phía sau (kể cả phím Tab), chỉ ra được qua cổng phụ huynh. */}
      <div inert={kidOpen} style={{ display: "contents" }}>
        <AppShell ws={ws} onWs={go} onKid={() => setKid(true)}>
          {childrenLoading
            ? <div className="splash">Đang tải hồ sơ bé…</div>
            : <View go={go} onKid={() => setKid(true)} />}
        </AppShell>
      </div>
      {kidOpen && <KidMode onExit={() => setKid(false)} />}
    </>
  );
}

export default function HomePage() {
  useClickRipple(); // gợn nước tại mọi điểm bấm, kể cả màn đăng nhập và Chế độ bé
  const { user, isLoading } = useAuth();
  const [booted, setBooted] = useState(false);
  // Bé quét mã QR Easy Login: link có dạng /?kid=<mã>, không cần tài khoản người lớn.
  const [kidCode, setKidCode] = useState<string | null>(null);
  const [entry, setEntry] = useState<"login" | "register" | null>(null);

  useEffect(() => {
    if (!isLoading) setBooted(true);
  }, [isLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setKidCode(params.get("kid"));
    if (params.get("auth") || params.get("token") || params.get("resetToken")) setEntry(params.get("auth") === "signup" ? "register" : "login");
  }, []);

  const leaveKid = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setKidCode(null);
  };

  if (kidCode) return <KidEntry code={kidCode} onDone={leaveKid} />;
  if (!booted && !user) return <div className="splash">Đang kiểm tra phiên đăng nhập…</div>;
  // Chưa đăng nhập: trang giới thiệu. Link trong email (?auth=…, token) mở thẳng biểu mẫu tương ứng.
  if (!user) return entry ? <LoginScreen key={entry} initialMode={entry} onHome={() => setEntry(null)} /> : <Landing onStart={setEntry} />;
  // Luồng 5 — Administrator, Moderator, Content Creator dùng khu riêng, tách khỏi Parent.
  if (isStaffRole(user.role)) return <StaffApp role={user.role} />;
  return (
    <WorkspaceDataProvider key={user.id}>
      <Workspaces />
    </WorkspaceDataProvider>
  );
}
