"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ZoomIn } from "lucide-react";
import { COVER_RATIO, type CoverCrop } from "@/app/lib/storyView";

const MAX_ZOOM = 4;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/**
 * Chọn vùng ảnh làm bìa như khi chọn ảnh đại diện: hiện cả tấm ảnh, kéo khung chữ nhật (tỉ lệ cố định 3:4) tới chỗ muốn giữ,
 * kéo thanh phóng to để thu nhỏ khung. Chỉ báo `onChange` khi người dùng thật sự chỉnh, nên mở ra rồi đóng không làm thay đổi gì.
 */
export default function CoverCropper({ src, value, onChange, onBroken }: {
  src: string;
  value: CoverCrop | null;
  onChange: (crop: CoverCrop) => void;
  onBroken: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  /** Tỉ lệ rộng/cao của ảnh gốc; chưa biết thì chưa vẽ khung. */
  const [aspect, setAspect] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const maxW = aspect ? Math.min(1, COVER_RATIO / aspect) : 1;
  const w = maxW / zoom;
  const h = aspect ? (w * aspect) / COVER_RATIO : 1;

  const emit = (x: number, y: number, z: number) => {
    if (!aspect) return;
    const nw = maxW / z, nh = (nw * aspect) / COVER_RATIO;
    const cx = clamp(x, 0, 1 - nw), cy = clamp(y, 0, 1 - nh);
    setZoom(z); setPos({ x: cx, y: cy });
    onChange({ x: cx, y: cy, w: nw, h: nh });
  };

  const onLoad = (img: HTMLImageElement) => {
    const a = img.naturalWidth / img.naturalHeight;
    if (!Number.isFinite(a) || a <= 0) return;
    setAspect(a);
    const mw = Math.min(1, COVER_RATIO / a);
    if (value) { setZoom(clamp(mw / value.w, 1, MAX_ZOOM)); setPos({ x: value.x, y: value.y }); }
    else { const nh = (mw * a) / COVER_RATIO; setZoom(1); setPos({ x: (1 - mw) / 2, y: (1 - nh) / 2 }); }
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current, r = box.current?.getBoundingClientRect();
    if (!d || !r) return;
    emit(d.x + (e.clientX - d.px) / r.width, d.y + (e.clientY - d.py) / r.height, zoom);
  };
  const up = () => { drag.current = null; };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 0.02;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!d[e.key]) return;
    e.preventDefault();
    emit(pos.x + d[e.key][0], pos.y + d[e.key][1], zoom);
  };

  return (
    <div className="cover-cropper">
      <div className="cover-cropper-stage" ref={box}>
        {/* Ảnh bìa là đường dẫn ngoài do người dùng dán, không đi qua trình tối ưu ảnh của Next. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Ảnh bìa gốc" draggable={false} onLoad={(e) => onLoad(e.currentTarget)} onError={onBroken} />
        {aspect && (
          <div className="cover-cropper-frame" role="slider" tabIndex={0} aria-label="Vùng ảnh làm bìa. Kéo hoặc dùng phím mũi tên để di chuyển"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos.x * 100)}
            style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key} />
        )}
      </div>
      {aspect && (
        <label className="cover-cropper-zoom"><ZoomIn className="ic" aria-hidden />
          <input type="range" min={1} max={MAX_ZOOM} step={0.05} value={zoom} aria-label="Phóng to vùng chọn"
            onChange={(e) => { const z = Number(e.target.value), cx = pos.x + w / 2, cy = pos.y + h / 2, nw = maxW / z, nh = (nw * aspect) / COVER_RATIO; emit(cx - nw / 2, cy - nh / 2, z); }} />
        </label>
      )}
    </div>
  );
}
