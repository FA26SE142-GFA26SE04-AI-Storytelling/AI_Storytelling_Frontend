'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

/** Lightbox phóng to tranh minh hoạ dùng chung cho các màn kiểm duyệt và rà soát. */
export function ZoomLightbox({ zoom, onClose }: { zoom: { url: string; alt: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom, onClose]);

  if (!zoom || typeof document === 'undefined') return null;
  return createPortal(
    <div className="dlg-backdrop st-zoom" role="dialog" aria-modal="true" aria-label="Tranh phóng to" onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={zoom.url} alt={zoom.alt} onClick={e => e.stopPropagation()} />
      <button type="button" className="btn btn-s st-zoom-close" onClick={onClose}>Đóng</button>
    </div>,
    document.body,
  );
}
