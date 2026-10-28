"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Landing from "@/app/features/landing/Landing";
import { useClickRipple } from "@/app/lib/motion";

// Trang giới thiệu công khai. Người đã đăng nhập vào thẳng khu làm việc ở "/".
export default function IntroPage() {
  useClickRipple();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [isLoading, user, router]);

  if (user) return <div className="splash">Đang mở không gian làm việc…</div>;
  return <Landing onStart={mode => router.push(mode === "register" ? "/?auth=signup" : "/?auth=login")} />;
}
