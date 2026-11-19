"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import LoginScreen from "@/app/components/shell/LoginScreen";
import { isStaffRole } from "@/app/types/auth";
import { useClickRipple } from "@/app/lib/motion";

export default function RegisterPage() {
  useClickRipple();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === "ContentCreator" && user.status === "AwaitingApproval") {
      router.replace("/app");
      return;
    }
    router.replace(isStaffRole(user.role) ? "/staff" : "/app/library");
  }, [isLoading, user, router]);

  if (user) return <div className="splash">Đang mở không gian làm việc…</div>;
  return (
    <LoginScreen
      initialMode="register"
      onHome={() => router.push("/")}
      onKidCode={(code) => router.push(`/kid?code=${encodeURIComponent(code)}`)}
    />
  );
}
