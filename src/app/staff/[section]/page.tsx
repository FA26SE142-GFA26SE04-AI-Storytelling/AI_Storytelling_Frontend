"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CreatorApplicantScreen from "@/app/components/shell/CreatorApplicantScreen";
import StaffApp from "@/app/features/staff/StaffApp";
import { positiveStoryId } from "@/app/lib/workspaceLocation";
import { isStaffRole, type StaffRole } from "@/app/types/auth";
import { useClickRipple } from "@/app/lib/motion";

function StaffSectionInner() {
  useClickRipple();
  const router = useRouter();
  const params = useParams<{ section?: string }>();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  const section = Array.isArray(params?.section) ? params.section[0] : params?.section;
  const target = positiveStoryId(searchParams.get("storyId"));

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "ContentCreator" && user.status === "AwaitingApproval") return;
    if (!isStaffRole(user.role)) {
      router.replace("/app/library");
    }
  }, [isLoading, user, router]);

  const onNavigate = useCallback((nextSection: string, storyId: number | null) => {
    const q = storyId ? `?storyId=${storyId}` : "";
    router.push(`/staff/${nextSection}${q}`);
  }, [router]);

  if (isLoading || !user) return <div className="splash">Đang kiểm tra phiên đăng nhập…</div>;
  if (user.role === "ContentCreator" && user.status === "AwaitingApproval") return <CreatorApplicantScreen />;
  if (!isStaffRole(user.role)) return <div className="splash">Đang chuyển về không gian phụ huynh…</div>;

  return (
    <StaffApp
      role={user.role as StaffRole}
      initialSection={section}
      initialTarget={target}
      onNavigate={onNavigate}
    />
  );
}

export default function StaffSectionPage() {
  return (
    <Suspense fallback={<div className="splash">Đang mở khu vực vận hành…</div>}>
      <StaffSectionInner />
    </Suspense>
  );
}
