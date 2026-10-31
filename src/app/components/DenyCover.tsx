"use client";

import { useState } from "react";

/** Phủ lên vùng chỉ xem: bấm vào thì báo không đủ quyền (cha cần position: relative). */
export default function DenyCover({ active, text }: { active: boolean; text: string }) {
  const [n, setN] = useState(0);
  if (!active) return null;
  const deny = () => { setN((v) => v + 1); setTimeout(() => setN(0), 3500); };
  return (
    <>
      <div className="deny-cover" onClick={deny} aria-hidden />
      {n > 0 && <div key={n} className="notice err" role="status">{text}</div>}
    </>
  );
}
