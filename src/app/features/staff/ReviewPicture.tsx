'use client';
import { useState } from 'react';
import { ImageOff, RefreshCw, ZoomIn } from 'lucide-react';

/**
 * Một tranh minh hoạ trong gói kiểm duyệt. Khác SafeImage: tranh không tải được thì báo lỗi rõ và cho tải lại,
 * không âm thầm thay bằng ảnh mặc định, vì người duyệt cần biết mình chưa thật sự xem được tranh đó.
 */
export default function ReviewPicture({ url, alt, onZoom }: { url: string; alt: string; onZoom: (url: string, alt: string) => void }) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  if (state === 'failed') {
    return <div className="st-pic st-pic-failed" role="alert">
      <ImageOff className="ic" aria-hidden="true" />
      <b>Không tải được tranh</b>
      <button type="button" className="btn btn-s" onClick={() => { setState('loading'); setAttempt(a => a + 1); }}><RefreshCw className="ic" aria-hidden="true" />Tải lại</button>
    </div>;
  }
  return <button type="button" className="st-pic" onClick={() => onZoom(url, alt)} title={alt || 'Phóng to tranh'} aria-label={`Phóng to tranh: ${alt}`}>
    {/* URL của backend có thể trỏ tới bất kỳ kho lưu trữ nào, nên dùng thẻ img thường. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img key={attempt} src={url} alt={alt} loading="lazy" className={state === 'ready' ? '' : 'loading'} onLoad={() => setState('ready')} onError={() => setState('failed')} />
    {state === 'loading' && <span className="st-pic-spin" role="status" aria-label="Đang tải tranh" />}
    {state === 'ready' && <ZoomIn className="ic st-pic-zoom" aria-hidden="true" />}
  </button>;
}
