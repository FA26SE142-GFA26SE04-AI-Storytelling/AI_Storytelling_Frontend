"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CreatorApplicantScreen from "@/app/components/shell/CreatorApplicantScreen";
import Landing from "@/app/features/landing/Landing";
import { appWorkspaceRoute, readWorkspaceLocation } from "@/app/lib/workspaceLocation";
import { isStaffRole } from "@/app/types/auth";
import { useClickRipple } from "@/app/lib/motion";

export default function HomePage() {
  useClickRipple();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [checkedQuery, setCheckedQuery] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kid = params.get("kid");
    if (kid) {
      router.replace(`/kid?code=${encodeURIComponent(kid)}`);
      return;
    }
    const auth = params.get("auth");
    if (auth || params.get("token") || params.get("resetToken")) {
      const target = auth === "signup" ? "/register" : "/login";
      router.replace(`${target}${window.location.search}`);
      return;
    }
    setCheckedQuery(true);
  }, [router]);

  useEffect(() => {
    if (!checkedQuery || isLoading || !user) return;
    if (user.role === "ContentCreator" && user.status === "AwaitingApproval") return;
    if (isStaffRole(user.role)) {
      router.replace("/staff");
      return;
    }
    const target = readWorkspaceLocation(window.location.href);
    router.replace(appWorkspaceRoute(target.workspace, target.storyId));
  }, [checkedQuery, isLoading, user, router]);

  if (!checkedQuery) return <div className="splash">Đang tải…</div>;
  if (user) {
    if (user.role === "ContentCreator" && user.status === "AwaitingApproval") return <CreatorApplicantScreen />;
    return <div className="splash">Đang mở không gian làm việc…</div>;
  }

  return (
    <Landing
      onStart={(mode) => router.push(mode === "register" ? "/register" : "/login")}
      onKidCode={(code) => router.push(`/kid?code=${encodeURIComponent(code)}`)}
    />
  );
}
