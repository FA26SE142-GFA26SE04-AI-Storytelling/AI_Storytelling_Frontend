'use client';
import { useEffect, useRef } from 'react';
import { Check, Download, RefreshCw } from 'lucide-react';
import { useMediaPackage } from '@/app/features/story-workflow/useMediaPackage';
import SafeImage from "@/app/components/SafeImage";
import './media-assets.css';

/** Trạng thái từng tranh / đoạn âm thanh của backend: [tông pill, chữ]. */
const ASSET: Record<string, [string, string]> = {
  Queued: ['wait', 'Đang chờ'], Processing: ['wait', 'Đang tạo'], Ready: ['ok', 'Sẵn sàng'], Failed: ['flag', 'Bị lỗi'], Generated: ['ok', 'Đã tạo'], ManualReview: ['wait', 'Cần xem lại'],
};
const AssetPill = ({ status }: { status: string }) => { const [tone, label] = ASSET[status] ?? ['draft', status]; return <span className={`pill ${tone}`}>{label}</span>; };

/**
 * Xem, tạo lại từng tranh / đoạn giọng đọc và xác nhận gói media.
 * `autoOpen`: mở sẵn và tự tải gói (khi đang chờ người dùng xác nhận); không cần bấm tải.
 * `showConfirmation`: tắt khi màn cha đã có nút xác nhận gói riêng.
 */
export default function MediaAssets({ storyId, versionId, onChanged, disabled = false, autoOpen = false, showConfirmation = true }: {
  storyId: number; versionId?: number | null; onChanged: () => void; disabled?: boolean; autoOpen?: boolean; showConfirmation?: boolean;
}) {
  const { pack, busy, note, reviewed, setReviewed, uncertain, load, regenerate, confirm, keepCurrent } = useMediaPackage({storyId,versionId,onChanged,disabled});
  const loaded = useRef(false);
  useEffect(() => { if (autoOpen && !loaded.current) { loaded.current = true; void load(); } }, [autoOpen, load]);
  const images = pack?.scenes.reduce((n, s) => n + s.illustrations.length, 0) ?? 0;
  const audios = pack?.scenes.reduce((n, s) => n + (s.audio?.length ?? 0), 0) ?? 0;
  return <details className="ma" {...(autoOpen ? { open: true } : {})}><summary>Ảnh và âm thanh thực tế</summary>
    <div className="ma-bar">
      {pack
        ? <span className="sub grow">{pack.scenes.length} cảnh · {images} tranh · {audios} đoạn âm thanh</span>
        : <span className="sub grow">{busy ? 'Đang tải gói media…' : 'Chưa tải gói media.'}</span>}
      {pack
        ? <button className="btn btn-g icon-only" aria-label="Tải lại gói media" title="Tải lại gói media" disabled={busy} onClick={() => void load()}><RefreshCw className="ic" /></button>
        : !busy && <button className="btn btn-s" onClick={() => void load()}><Download className="ic" />Tải gói media</button>}
    </div>
    {note && <p className="notice" role="status">{note}</p>}
    {uncertain && <p className="notice warn" role="status">Chưa rõ kết quả thao tác. Tải lại gói và đồng bộ trạng thái trước khi gửi lệnh mới.</p>}
    {pack?.scenes.map(s => <article className="ma-scene" key={s.sceneId}>
      <b className="ma-title">Cảnh {s.sceneIndex + 1}</b>
      <p className="ma-text">{s.text}</p>
      <div className="ma-grid">
        {s.illustrations.map((i, n) => <figure className="ma-item" key={i.beatId}>
          {/* Signed storage URLs are returned by the API. */}
          {i.url && i.status === 'Ready' ? <SafeImage src={i.url} alt={i.visualFocus} title={i.visualFocus} /> : <div className="ma-empty">Tranh chưa sẵn sàng</div>}
          <figcaption><span>Tranh {n + 1}</span><AssetPill status={i.status} />
            <button className="btn btn-g icon-only" aria-label={`Tạo lại tranh ${n + 1}`} title="Tạo lại tranh" disabled={busy || disabled || uncertain} onClick={() => void regenerate('illustration', i.beatId)}><RefreshCw className="ic" /></button></figcaption>
        </figure>)}
      </div>
      {s.audio?.map(a => <div className="ma-audio" key={a.segmentId}>
        <span>Giọng đọc đoạn {a.segmentOrder + 1}</span><AssetPill status={a.status} />
        {a.url && a.status === 'Ready' && <audio controls preload="none" src={a.url} aria-label={`Nghe đoạn ${a.segmentOrder + 1}`} />}
        <button className="btn btn-g icon-only" aria-label={`Tạo lại giọng đoạn ${a.segmentOrder + 1}`} title="Tạo lại giọng đọc" disabled={busy || disabled || uncertain} onClick={() => void regenerate('audio', a.segmentId)}><RefreshCw className="ic" /></button>
      </div>)}
    </article>)}
    {pack?.replacements?.filter(r=>['Failed','ManualReview'].includes(r.status)).map(r=><div className="notice" role="status" key={r.candidateAssetId}><p>Bản tạo lại {r.type === 'Illustration' ? 'tranh' : 'âm thanh'} chưa đạt yêu cầu.</p><button className="btn btn-s" disabled={busy||disabled||uncertain} onClick={()=>void keepCurrent(r.candidateAssetId)}>Giữ bản cũ</button></div>)}
    {showConfirmation && pack?.isAwaitingConfirmation && <div className="ma-confirm"><label className="row"><input type="checkbox" checked={reviewed} disabled={busy || disabled || uncertain} onChange={e => setReviewed(e.target.checked)} />Tôi đã xem tranh và nghe các đoạn âm thanh của gói này</label>
      <button className="btn btn-ok" disabled={busy || disabled || uncertain || !reviewed} onClick={() => void confirm()}><Check className="ic" />Xác nhận media</button>
    </div>}
    {pack?.isConfirmed && <p className="ma-done"><Check className="ic" aria-hidden />Đã xác nhận gói media</p>}
  </details>;
}
