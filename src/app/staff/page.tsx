"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CreatorApplicantScreen from "@/app/components/shell/CreatorApplicantScreen";
import { defaultStaffSection } from "@/app/features/staff/StaffApp";
import { isStaffRole, type StaffRole } from "@/app/types/auth";
import { readStaffWorkspace } from "@/app/features/story-workflow/storyStudioSession";

export default function StaffIndexPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "ContentCreator" && user.status === "AwaitingApproval") return;
    if (!isStaffRole(user.role)) {
      router.replace("/app/library");
      return;
    }
    const role = user.role as StaffRole;
    const saved = readStaffWorkspace(user.id);
    const section = saved?.pageId || defaultStaffSection(role);
    const q = saved?.target ? `?storyId=${saved.target}` : "";
    router.replace(`/staff/${section}${q}`);
  }, [isLoading, user, router]);

  if (!isLoading && user?.role === "ContentCreator" && user.status === "AwaitingApproval") {
    return <CreatorApplicantScreen />;
  }
  return <div className="splash">Đang mở khu vực vận hành…</div>;
}
