'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';

/**
 * Trình phát audio của một đoạn; không có đường dẫn hoặc file rỗng/hỏng thì ghi rõ "Không có audio" thay vì hiện trình phát 0:00.
 * Âm thanh chưa tải xong thì hiện vòng xoay.
 *
 * Đường dẫn là URL có chữ ký, mỗi lần tải lại gói duyệt lại ra một URL khác. Nếu đổi `src` theo từng lần tải thì trình phát bị nạp lại
 * (nhảy về 0:00, mất trạng thái) đúng lúc bấm "đã nghe" làm gói tải lại, nên giữ URL đầu tiên cho tới khi nó lỗi rồi mới đổi sang URL mới nhất.
 */
export default function SegmentAudio({ url, heard, onHeard }: { url: string | null; heard: boolean; onHeard: () => void }) {
  const [src, setSrc] = useState(url);
  const [empty, setEmpty] = useState(false);
  /** Chưa đủ dữ liệu để phát (mới mở, hoặc đang chờ tải thêm khi phát). */
  const [loading, setLoading] = useState(true);
  if (!src || empty) return <small className="st-no-audio">Không có audio</small>;
  // URL đang dùng bị lỗi (hết hạn chữ ký): thử một lần với URL mới nhất từ gói duyệt, vẫn lỗi thì mới báo không có audio.
  const failed = () => { if (url && url !== src) { setSrc(url); setLoading(true); } else setEmpty(true); };
  return <>
    <div className="st-audio-row">
      <audio controls preload="auto" src={src}
        onLoadStart={() => setLoading(true)} onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)} onPlaying={() => setLoading(false)}
        onEnded={() => { if (!heard) onHeard(); }} onError={failed}
        onLoadedMetadata={e => { const d = e.currentTarget.duration; if (!d || !Number.isFinite(d)) failed(); }} />
      {loading && <span className="st-audio-spin" role="status" aria-label="Đang tải âm thanh" />}
    </div>
    {heard && <small className="st-audio-heard"><Check className="ic" aria-hidden="true" />Đã nghe</small>}
  </>;
}
