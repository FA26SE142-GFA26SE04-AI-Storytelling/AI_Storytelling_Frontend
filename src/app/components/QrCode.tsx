"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

/** Vẽ mã QR bằng SVG (nền trắng, chấm đen) để máy quét đọc được ở cả giao diện tối. */
export default function QrCode({ value, size = 200, label }: { value: string; size?: number; label: string }) {
  const { n, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
    return { n: count + 4, path: d };
  }, [value]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label} shapeRendering="crispEdges" style={{ background: "#fff", borderRadius: 12 }}>
      <path d={path} fill="#000" />
    </svg>
  );
}
