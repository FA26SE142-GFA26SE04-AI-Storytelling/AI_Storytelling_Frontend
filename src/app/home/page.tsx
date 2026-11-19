"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Giữ tương thích cho các đường dẫn cũ trỏ tới `/home`: chuyển về trang chủ `/`. */
export default function LegacyHomeRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return <div className="splash">Đang chuyển về trang chủ…</div>;
}
