"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import KidEntry from "@/app/features/kid/KidEntry";
import { useClickRipple } from "@/app/lib/motion";

function KidRouteInner() {
  useClickRipple();
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") ?? params.get("kid") ?? "";

  if (!code) {
    return (
      <div className="splash">
        <span>Liên kết của bé thiếu mã đăng nhập.</span>
        <button type="button" className="btn btn-s" style={{ marginTop: 12 }} onClick={() => router.push("/")}>
          Về trang chủ
        </button>
      </div>
    );
  }
  return <KidEntry code={code} onDone={() => router.replace("/")} />;
}

export default function KidPage() {
  return (
    <Suspense fallback={<div className="splash">Đang mở góc của bé…</div>}>
      <KidRouteInner />
    </Suspense>
  );
}
