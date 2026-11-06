'use client';
import { useMediaPackage } from '@/app/features/story-workflow/useMediaPackage';
import SafeImage from "@/app/components/SafeImage";

export default function MediaAssets({ storyId, versionId, onChanged, disabled = false, showConfirmation = true }: {
  storyId: number; versionId?: number | null; onChanged: () => void; disabled?: boolean; showConfirmation?: boolean;
}) {
  const { pack, busy, note, reviewed, setReviewed, uncertain, load, regenerate, confirm, keepCurrent } = useMediaPackage({storyId,versionId,onChanged,disabled});
  return <details><summary>Ảnh và âm thanh thực tế</summary>
    <button className="btn btn-s" disabled={busy} onClick={() => void load()}>Tải gói media</button>
    {note && <p className="notice" role="status">{note}</p>}
    {uncertain && <p className="notice warn">Chưa rõ kết quả thao tác. Tải lại gói và đồng bộ trạng thái trước khi gửi lệnh mới.</p>}
    {pack && <p className="sub">Bản nội dung #{pack.storyVersionId} · gói #{pack.packageRevision} · {pack.isConfirmed ? 'Đã xác nhận' : pack.isAwaitingConfirmation ? 'Chờ bạn xác nhận' : 'Đang chuẩn bị'}</p>}
    {pack?.scenes.map(s => <article key={s.sceneId}><h4>Cảnh {s.sceneIndex + 1}</h4><p>{s.text}</p>
      {s.illustrations.map(i => <div key={i.beatId}>
        {/* Signed storage URLs are returned by the API. */}
        {i.url && i.status === 'Ready' && <SafeImage src={i.url} alt={i.visualFocus} style={{ maxWidth:'100%', maxHeight:320 }} />}
        <p>{i.visualFocus} · {i.status}</p><button className="btn btn-s" disabled={busy || disabled || uncertain} onClick={() => void regenerate('illustration', i.beatId)}title="Tạo lại tranh này">Tạo lại tranh</button>
      </div>)}
      {s.audio?.map(a => <div key={a.segmentId}><p>{a.text}</p>{a.url && a.status === 'Ready' && <audio controls preload="none" src={a.url} aria-label={`Nghe đoạn ${a.segmentOrder + 1}`} />}
        <button className="btn btn-s" disabled={busy || disabled || uncertain} onClick={() => void regenerate('audio', a.segmentId)}title="Tạo lại giọng đọc đoạn này">Tạo lại giọng</button>
      </div>)}
    </article>)}
    {pack?.replacements?.filter(r=>['Failed','ManualReview'].includes(r.status)).map(r=><div className="notice" key={r.candidateAssetId}><p>Bản tạo lại {r.type === 'Illustration' ? 'tranh' : 'âm thanh'} chưa đạt yêu cầu.</p><button className="btn btn-s" disabled={busy||disabled||uncertain} onClick={()=>void keepCurrent(r.candidateAssetId)}>Giữ bản cũ</button></div>)}
    {showConfirmation && pack?.isAwaitingConfirmation && <div className="sec"><label className="row"><input type="checkbox" checked={reviewed} disabled={busy || disabled || uncertain} onChange={e => setReviewed(e.target.checked)} />Tôi đã xem tranh và nghe các đoạn âm thanh của gói này</label>
      <button className="btn btn-ok" disabled={busy || disabled || uncertain || !reviewed} onClick={() => void confirm()}>Xác nhận media</button>
    </div>}
  </details>;
}
