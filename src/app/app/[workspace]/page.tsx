"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { WorkspaceDataProvider } from "@/app/context/WorkspaceDataContext";
import CreatorApplicantScreen from "@/app/components/shell/CreatorApplicantScreen";
import ChildPickerHost from "@/app/components/ChildPickerHost";
import ParentShell, { resolveWorkspaceId } from "@/app/components/shell/ParentShell";
import { WORKSPACES } from "@/app/components/shell/nav";
import { appWorkspaceRoute, positiveStoryId, takesStoryId } from "@/app/lib/workspaceLocation";
import { isStaffRole } from "@/app/types/auth";
import { useClickRipple } from "@/app/lib/motion";

function WorkspaceRouteInner() {
  useClickRipple();
  const router = useRouter();
  const params = useParams<{ workspace?: string }>();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  const rawWorkspace = Array.isArray(params?.workspace) ? params.workspace[0] : params?.workspace;
  const isValidWorkspace = WORKSPACES.some((w) => w.id === rawWorkspace);
  const workspace = resolveWorkspaceId(rawWorkspace);
  const storyId = takesStoryId(workspace) ? positiveStoryId(searchParams.get("storyId")) : null;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "ContentCreator" && user.status === "AwaitingApproval") return;
    if (isStaffRole(user.role)) {
      router.replace("/staff");
      return;
    }
    if (!isValidWorkspace) {
      router.replace(appWorkspaceRoute(workspace));
    }
  }, [isLoading, user, isValidWorkspace, workspace, router]);

  if (isLoading || !user) return <div className="splash">Đang kiểm tra phiên đăng nhập…</div>;
  if (user.role === "ContentCreator" && user.status === "AwaitingApproval") return <CreatorApplicantScreen />;
  if (isStaffRole(user.role)) return <div className="splash">Đang chuyển khu vực nhân viên…</div>;

  return (
    <WorkspaceDataProvider key={user.id}>
      <ParentShell workspace={workspace} storyId={storyId} />
      <ChildPickerHost />
    </WorkspaceDataProvider>
  );
}

export default function AppWorkspacePage() {
  return (
    <Suspense fallback={<div className="splash">Đang mở không gian làm việc…</div>}>
      <WorkspaceRouteInner />
    </Suspense>
  );
}
