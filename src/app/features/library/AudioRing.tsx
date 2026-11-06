"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const SIZE = 60;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Nút nghe hình tròn: nút play/pause ở giữa, vòng tròn bao quanh là thanh tiến trình.
 * Cảnh có nhiều đoạn giọng đọc thì phát lần lượt, vòng tròn chạy hết cả cảnh.
 */
export default function AudioRing({ urls, label }: { urls: string[]; label: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  /** Đang chờ âm thanh tải về (bấm phát lần đầu, hoặc chuyển sang đoạn kế): hiện vòng xoay thay vì nút phát. */
  const [loading, setLoading] = useState(false);

  // Đổi sang đoạn kế tiếp trong lúc đang phát thì phát tiếp ngay khi nguồn mới nạp xong.
  useEffect(() => {
    const el = audio.current;
    if (el && playing) { setLoading(true); void el.play().catch(() => { setPlaying(false); setLoading(false); }); }
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  // Rời trang / đóng hộp thoại thì dừng tiếng.
  useEffect(() => () => audio.current?.pause(), []);

  const toggle = () => {
    const el = audio.current;
    if (!el || failed) return;
    if (playing) { el.pause(); return; }
    setLoading(true);
    void el.play().catch(() => { setPlaying(false); setLoading(false); setFailed(true); });
  };
  const onTime = () => {
    const el = audio.current;
    if (!el) return;
    const part = el.duration > 0 && Number.isFinite(el.duration) ? el.currentTime / el.duration : 0;
    setProgress(Math.min(1, (index + part) / urls.length));
  };
  const onEnded = () => {
    if (index < urls.length - 1) { setIndex(index + 1); return; }
    setPlaying(false); setIndex(0); setProgress(0);
  };

  return (
    <div className="audio-ring">
      <button type="button" className={`audio-ring-btn${playing ? " on" : ""}${failed ? " bad" : ""}`} onClick={toggle} disabled={failed}
        aria-label={failed ? "Không mở được giọng đọc" : playing ? `Tạm dừng ${label}` : label} aria-pressed={playing} aria-busy={loading}
        title={failed ? "Không mở được giọng đọc. Hãy đóng và mở lại trang xem trước." : label}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
          <circle className="ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} />
          <circle className="ring-bar" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - progress)} transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} />
        </svg>
        <span className="ring-icon">{loading ? <span className="preview-spin audio-spin" aria-hidden="true" /> : playing ? <Pause /> : <Play />}</span>
      </button>
      <audio ref={audio} src={urls[index]} preload="auto"
        onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); setLoading(false); }} onWaiting={() => setLoading(true)} onPlaying={() => setLoading(false)} onCanPlay={() => setLoading(false)} onTimeUpdate={onTime} onEnded={onEnded} onError={() => { setPlaying(false); setLoading(false); setFailed(true); }} />
    </div>
  );
}
