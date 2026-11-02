'use client';
import { useState } from 'react';

/** Trình phát audio của một đoạn; không có đường dẫn hoặc file rỗng/hỏng thì ghi rõ "Không có audio" thay vì hiện trình phát 0:00. */
export default function SegmentAudio({ url, heard, onHeard }: { url: string | null; heard: boolean; onHeard: () => void }) {
  const [empty, setEmpty] = useState(false);
  if (!url || empty) return <small className="st-no-audio">Không có audio</small>;
  return <>
    <audio controls src={url} onEnded={() => { if (!heard) onHeard(); }} onError={() => setEmpty(true)} onLoadedMetadata={e => { const d = e.currentTarget.duration; if (!d || !Number.isFinite(d)) setEmpty(true); }} />
    {heard && <small>Đã nghe</small>}
  </>;
}
