'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'ready' | 'denied' | 'unsupported';

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];

/**
 * Ghi âm giọng bé bằng micro của trình duyệt.
 * Tự dừng khi đủ `maxSeconds` hoặc gần chạm `maxBytes`, để file gửi lên không vượt giới hạn của backend.
 */
export function useRecorder(maxBytes: number, maxSeconds = 120) {
  const [state, setState] = useState<RecorderState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bytes = useRef(0);
  const timer = useRef<number | null>(null);

  const release = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
  }, []);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
  }, []);

  const reset = useCallback(() => {
    setUrl(old => { if (old) URL.revokeObjectURL(old); return null; });
    setBlob(null); setSeconds(0); setState('idle');
  }, []);

  const start = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setState('unsupported'); return; }
    reset();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch { setState('denied'); return; }
    const mime = MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    recorder.current = rec; chunks.current = []; bytes.current = 0;
    rec.ondataavailable = e => {
      if (!e.data.size) return;
      chunks.current.push(e.data); bytes.current += e.data.size;
      if (bytes.current >= maxBytes * 0.9) stop();
    };
    rec.onstop = () => {
      release();
      // Backend chỉ đọc loại file, bỏ phần codecs.
      const type = (rec.mimeType || mime || 'audio/webm').split(';')[0];
      const out = new Blob(chunks.current, { type });
      setBlob(out); setUrl(URL.createObjectURL(out)); setState('ready');
    };
    rec.start(1000);
    setSeconds(0); setState('recording');
    timer.current = window.setInterval(() => {
      setSeconds(s => { if (s + 1 >= maxSeconds) stop(); return s + 1; });
    }, 1000);
  }, [maxBytes, maxSeconds, release, reset, stop]);

  useEffect(() => () => { stop(); release(); }, [stop, release]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  return { state, seconds, blob, url, start, stop, reset };
}
