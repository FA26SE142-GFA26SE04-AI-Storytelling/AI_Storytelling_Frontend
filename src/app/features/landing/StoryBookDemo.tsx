"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Volume2 } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import { prefersReducedMotion } from "@/app/lib/motion";

const WORDS = ["Trời", "đổ", "mưa", "rào.", "Ếch", "Xanh", "vội", "hái", "một", "chiếc", "lá", "sen", "thật", "to", "làm", "ô,", "rồi", "nhảy", "lom khom", "sang", "gọi", "bạn", "Chuồn", "Chuồn."];
const VOCAB = 18;
const STEP_MS = 420;

/**
 * Cuốn sách mở ở đầu trang giới thiệu: trang trái là tranh, trang phải là chữ sáng dần theo giọng đọc
 * (giống góc đọc của bé), góc trang có dấu "Mẹ đã duyệt". Chạy một lần khi mở trang, sau đó bấm để nghe lại.
 */
export default function StoryBookDemo() {
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; setPlaying(false); };
  const play = (from: number) => {
    if (timer.current) clearInterval(timer.current);
    setIdx(from);
    setPlaying(true);
    timer.current = setInterval(() => {
      setIdx((i) => {
        if (i + 1 >= WORDS.length) { stop(); return -1; }
        return i + 1;
      });
    }, STEP_MS);
  };

  useEffect(() => {
    const t = prefersReducedMotion() ? null : setTimeout(() => play(0), 900);
    return () => { if (t) clearTimeout(t); if (timer.current) clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure className="ld-book-wrap">
      <div className="ld-book">
        <div className="ld-book-art" role="img" aria-label="Tranh minh hoạ: Ếch Xanh che lá sen làm ô dưới cơn mưa rào trên đầm sen">
          <svg className="ld-rain" viewBox="0 0 300 160" preserveAspectRatio="none" aria-hidden>
            {[[30, 20], [90, 50], [150, 10], [220, 40], [270, 14], [60, 100], [190, 96], [250, 120], [120, 130]].map(([x, y]) => (
              <path key={`${x}-${y}`} d={`M${x} ${y} l-7 20`} />
            ))}
          </svg>
          <span className="ld-pad" aria-hidden />
          <span className="ld-frog"><Frog size={118} mood="happy" /></span>
          <svg className="ld-leaf" viewBox="0 0 170 80" aria-hidden>
            <path d="M6 64 Q85 -6 164 58 Q85 40 6 64 Z" />
            <path className="vein" d="M85 22 L85 52 M85 30 L58 48 M85 30 L112 48" />
          </svg>
          <div className="ld-stamp" aria-label="Mẹ đã duyệt lúc 21:04 ngày 24/10"><b>Mẹ đã duyệt</b><small>21:04, 24/10</small></div>
        </div>

        <div className="ld-book-page">
          <div className="ld-book-meta"><span>Chú ếch và chiếc ô lá sen</span><span>Trang 3 / 6</span></div>
          <p className="ld-book-text" lang="vi">
            {WORDS.map((w, i) => (
              <span key={i} className={i === idx ? "hl" : i === VOCAB ? "vocab" : undefined}>{w} </span>
            ))}
          </p>
          <div className="ld-book-foot">
            <button type="button" className="ld-listen" onClick={() => (playing ? stop() : play(idx < 0 ? 0 : idx))}>
              {playing ? <><Pause aria-hidden />Tạm dừng</> : <><Volume2 aria-hidden />Nghe trang này</>}
            </button>
            <span className="ld-dots" aria-hidden><i className="done" /><i className="done" /><i className="cur" /><i /><i /><i /></span>
          </div>
        </div>
      </div>
      <figcaption>Truyện mẫu trong góc đọc của bé. Chữ sáng theo giọng đọc; chữ gạch chân chấm là từ mới bé chạm vào để xem nghĩa.</figcaption>
    </figure>
  );
}
