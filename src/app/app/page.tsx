"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CreatorApplicantScreen from "@/app/components/shell/CreatorApplicantScreen";
import { isStaffRole } from "@/app/types/auth";
import { appWorkspaceRoute, DEFAULT_WORKSPACE } from "@/app/lib/workspaceLocation";

export default function AppIndexPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

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
    router.replace(appWorkspaceRoute(DEFAULT_WORKSPACE));
  }, [isLoading, user, router]);

  if (!isLoading && user?.role === "ContentCreator" && user.status === "AwaitingApproval") {
    return <CreatorApplicantScreen />;
  }
  return <div className="splash">Đang mở không gian làm việc…</div>;
}
