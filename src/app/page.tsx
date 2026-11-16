"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type ComponentType } from "react";
import { childAccessService } from "@/app/services/childAccessService";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AppShell from "@/app/components/shell/AppShell";
import LoginScreen from "@/app/components/shell/LoginScreen";
import { WorkspaceDataProvider, useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { type WorkspaceId, type WorkspaceProps } from "@/app/components/shell/nav";
import { DEFAULT_WORKSPACE, readWorkspaceLocation, takesStoryId, workspaceLocation } from '@/app/lib/workspaceLocation';
import StudioWorkspace from "@/app/features/studio/StudioWorkspace";
import AuthoringWorkspace from "@/app/features/authoring/AuthoringWorkspace";
import LibraryWorkspace from "@/app/features/library/LibraryWorkspace";
import CreatedStories from "@/app/features/created/CreatedStories";
import ReportWorkspace from "@/app/features/report/ReportWorkspace";
import KidMode from "@/app/features/kid/KidMode";
import KidEntry from "@/app/features/kid/KidEntry";
import ChildrenWorkspace from "@/app/features/children/ChildrenWorkspace";
import AccountWorkspace from "@/app/features/account/AccountWorkspace";
import LearningWorkspace from "@/app/features/learning/LearningWorkspace";
import StaffApp from "@/app/features/staff/StaffApp";
import { isStaffRole } from "@/app/types/auth";
import ChildPickerHost from "@/app/components/ChildPickerHost";
import { transitionWorkspace, useClickRipple } from "@/app/lib/motion";
// Nạp sau cùng để ghi đè CSS của các màn trên điện thoại.
import "@/app/styles/mobile.css";

// Mỗi không gian một component. Thêm không gian mới: khai báo trong nav.ts rồi thêm vào đây.
const VIEWS: Record<WorkspaceId, ComponentType<WorkspaceProps>> = {
  children: ChildrenWorkspace,
  studio: StudioWorkspace,
  authoring: AuthoringWorkspace,
  library: LibraryWorkspace,
  created: CreatedStories,
  roadmap: LearningWorkspace, // trang "Học tập của bé"; giữ mã "roadmap" để link và thông báo cũ vẫn mở đúng
  report: ReportWorkspace,
  account: () => <AccountWorkspace page="profile" />,
  "account-payment": () => <AccountWorkspace page="payment" />,
  "account-activity": () => <AccountWorkspace page="activity" />,
};

function Workspaces() {
  const { children: kids, childrenLoading } = useWorkspaceData();
  const [ws, setWs] = useState<WorkspaceId>(DEFAULT_WORKSPACE);
  const [resumeStoryId, setResumeStoryId] = useState<number | null>(null);
  // Bé đang dùng chế độ "Cho bé đọc"; chỉ đặt khi bấm nút đó, các trang phụ huynh không dùng.
  const [kid, setKid] = useState<{ id: number; storyId: number | null; resume?: boolean } | null>(null);
  const openKid = useCallback((id: number, storyId: number | null = null) => setKid({ id, storyId }), []);
  // Tải lại trang khi bé đang dùng: phiên của bé còn trong sessionStorage thì vào lại ngay chế độ của bé,
  // không rơi ra khu người lớn (muốn ra vẫn phải qua cổng phụ huynh). Chạy trước khi vẽ để không lộ khu người lớn.
  useLayoutEffect(() => {
    const s = childAccessService.readSession();
    if (s?.via === 'profile_switcher') setKid({ id: s.childProfileId, storyId: null, resume: true });
  }, []);
  const closeKid = useCallback(() => setKid(null), []);
  const View = VIEWS[ws];
  const go = useCallback<WorkspaceProps['go']>((id, target) => transitionWorkspace(() => {
    const storyId = takesStoryId(id) ? target?.storyId ?? null : null;
    window.history.replaceState(null,'',workspaceLocation(window.location.href,id,storyId));
    setResumeStoryId(storyId); setWs(id);
  }), []);

  // Cho phép mở thẳng một không gian bằng #library, #studio, #review...
  useEffect(() => {
    const restore = () => { const target = readWorkspaceLocation(window.location.href); setWs(target.workspace); setResumeStoryId(target.storyId); };
    restore(); window.addEventListener('popstate',restore); window.addEventListener('hashchange',restore);
    return () => { window.removeEventListener('popstate',restore); window.removeEventListener('hashchange',restore); };
  }, []);

  const kidChild = kids.find((k) => k.id === kid?.id) ?? null;
  // Đang chờ danh sách bé để vào lại chế độ của bé sau khi tải trang: che khu người lớn bằng màn chờ.
  const kidPending = !!kid && !kidChild && childrenLoading;
  const kidOpen = !!kidChild || kidPending;
  // Bé của phiên cũ không còn trong danh sách (bị lưu trữ, đổi tài khoản…): bỏ phiên, về khu người lớn.
  useEffect(() => {
    if (kid && !kidChild && !childrenLoading) { childAccessService.clearSession(); setKid(null); }
  }, [kid, kidChild, childrenLoading]);

  return (
    <>
      {/* Khi bé đang dùng, khoá hẳn khu người lớn phía sau (kể cả phím Tab), chỉ ra được qua cổng phụ huynh. */}
      <div inert={kidOpen} style={{ display: "contents" }}>
        <AppShell ws={ws} onWs={go} onKid={(id) => openKid(id)}>
          {childrenLoading
            ? <div className="splash">Đang tải hồ sơ bé…</div>
            : <View key={takesStoryId(ws) ? `${ws}:${resumeStoryId ?? 'new'}` : ws} go={go} resumeStoryId={resumeStoryId} onKid={openKid} />}
        </AppShell>
      </div>
      {kidPending && <div className="kid" role="dialog" aria-modal="true" aria-label="Chế độ của bé"><div className="splash">Đang mở…</div></div>}
      {kidChild && <KidMode child={kidChild} storyId={kid?.storyId} resume={kid?.resume} onExit={closeKid} />}
    </>
  );
}

export default function HomePage() {
  useClickRipple(); // gợn nước tại mọi điểm bấm, kể cả màn đăng nhập và Chế độ bé
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [booted, setBooted] = useState(false);
  // Bé quét mã QR Easy Login: link có dạng /?kid=<mã>, không cần tài khoản người lớn.
  const [kidCode, setKidCode] = useState<string | null>(null);
  const [entry, setEntry] = useState<"login" | "register" | null>(null);
  const [paramsRead, setParamsRead] = useState(false);

  useEffect(() => {
    if (!isLoading) setBooted(true);
  }, [isLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setKidCode(params.get("kid"));
    if (params.get("auth") || params.get("token") || params.get("resetToken")) setEntry(params.get("auth") === "signup" ? "register" : "login");
    setParamsRead(true);
  }, []);

  // Chưa đăng nhập và không có link đặc biệt: trang giới thiệu nằm ở /home.
  const toIntro = paramsRead && booted && !user && !kidCode && !entry;
  useEffect(() => { if (toIntro) router.replace("/home"); }, [toIntro, router]);

  const leaveKid = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setKidCode(null);
  };

  if (kidCode) return <KidEntry code={kidCode} onDone={leaveKid} />;
  if (!booted && !user) return <div className="splash">Đang kiểm tra phiên đăng nhập…</div>;
  // Chưa đăng nhập: link trong email (?auth=…, token) mở thẳng biểu mẫu; còn lại về trang giới thiệu /home.
  if (!user) return entry ? <LoginScreen key={entry} initialMode={entry} onHome={() => router.push("/home")} onKidCode={setKidCode} /> : <div className="splash">Đang mở trang giới thiệu…</div>;
  // Luồng 5 — Administrator, Moderator, Content Creator dùng khu riêng, tách khỏi Parent.
  if (isStaffRole(user.role)) return <StaffApp role={user.role} />;
  return (
    <WorkspaceDataProvider key={user.id}>
      <Workspaces />
      <ChildPickerHost />
    </WorkspaceDataProvider>
  );
}
