'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Download, RefreshCw, Sparkles, Upload } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import { useMediaPackage } from '@/app/features/story-workflow/useMediaPackage';
import { showToast } from '@/app/lib/toast';
import SafeImage from "@/app/components/SafeImage";
import './media-assets.css';

/** Trạng thái từng tranh / đoạn âm thanh của backend: [tông pill, chữ]. */
const ASSET: Record<string, [string, string]> = {
  Queued: ['wait', 'Đang chờ'], Processing: ['wait', 'Đang tạo'], Ready: ['ok', 'Sẵn sàng'], Failed: ['flag', 'Bị lỗi'], Generated: ['ok', 'Đã tạo'], ManualReview: ['wait', 'Cần xem lại'],
  AwaitingSelection: ['wait', 'Chờ bạn chọn'],
};
const AssetPill = ({ status }: { status: string }) => { const [tone, label] = ASSET[status] ?? ['draft', status]; return <span className={`pill ${tone}`}>{label}</span>; };

/** Giới hạn tệp Creator tải lên theo Backend: ảnh JPEG/PNG/WebP ≤ 10 MiB, âm thanh MP3/WAV ≤ 25 MiB. */
const UPLOAD = {
  image: { accept: '.jpg,.jpeg,.png,.webp', max: 10 * 1024 * 1024, label: 'ảnh JPEG, PNG hoặc WebP, tối đa 10 MB' },
  audio: { accept: '.mp3,.wav', max: 25 * 1024 * 1024, label: 'âm thanh MP3 hoặc WAV, tối đa 25 MB' },
} as const;
type Kind = keyof typeof UPLOAD;
type Target = { kind: Kind; id: number; name: string };

/**
 * Xem, tạo lại từng tranh / đoạn giọng đọc và xác nhận gói media.
 * `autoOpen`: mở sẵn và tự tải gói (khi đang chờ người dùng xác nhận); không cần bấm tải.
 * `showConfirmation`: tắt khi màn cha đã có nút xác nhận gói riêng.
 * `selectable`: Creator chọn chế độ tự chọn media; tranh / đoạn đang chờ chọn có nút Tải lên và AI tạo.
 */
export default function MediaAssets({ storyId, versionId, onChanged, disabled = false, autoOpen = false, showConfirmation = true, selectable = false }: {
  storyId: number; versionId?: number | null; onChanged: () => void; disabled?: boolean; autoOpen?: boolean; showConfirmation?: boolean; selectable?: boolean;
}) {
  const { pack, busy, note, reviewed, setReviewed, uncertain, load, regenerate, confirm, keepCurrent, choose } = useMediaPackage({storyId,versionId,onChanged,disabled});
  // Mở sẵn thì tự tải gói khi chưa có (kể cả sau mỗi lần chọn / tạo lại); có lỗi thì dừng, chờ người dùng bấm tải lại.
  useEffect(() => { if (autoOpen && !pack && !busy && !note) void load(); }, [autoOpen, pack, busy, note, load]);
  // Tệp đang chờ khai báo nguồn / quyền trước khi tải lên; khai báo giữ lại cho các lần tải sau.
  const [upload, setUpload] = useState<(Target & { file: File }) | null>(null);
  const [decl, setDecl] = useState({ sourceDeclaration: 'Tự sáng tác', rightsDeclaration: 'Tôi có quyền sử dụng tệp này' });
  const fileRef = useRef<HTMLInputElement>(null);
  const pickFor = useRef<Target | null>(null);
  const pick = (t: Target) => { pickFor.current = t; if (fileRef.current) { fileRef.current.accept = UPLOAD[t.kind].accept; fileRef.current.click(); } };
  const onFile = (file: File | undefined) => {
    const t = pickFor.current;
    if (!file || !t) return;
    if (file.size > UPLOAD[t.kind].max) { showToast(`Tệp quá lớn. Chỉ nhận ${UPLOAD[t.kind].label}.`, 'err'); return; }
    setUpload({ ...t, file });
  };
  const runChoose = async (t: Target, file: File | null) => {
    if (await choose(t.kind, t.id, file, file ? decl : undefined)) { setUpload(null); void load(); }
  };
  const waiting = (status: string) => selectable && status === 'AwaitingSelection';
  /** Hai nút chọn nguồn cho một tranh / đoạn đang chờ chọn. */
  const choice = (t: Target) => <span className="ma-choose">
    <button className="btn btn-s" disabled={busy || disabled || uncertain} onClick={() => pick(t)}><Upload className="ic" />Tải lên</button>
    <button className="btn btn-g" disabled={busy || disabled || uncertain} onClick={() => void runChoose(t, null)}><Sparkles className="ic" />AI tạo</button>
  </span>;

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
    {selectable && pack?.isAwaitingSelection && <p className="notice warn ma-select-hint">Còn tranh hoặc đoạn giọng đọc chưa chọn nguồn. Với mỗi phần, bấm <b>Tải lên</b> để dùng tệp của bạn hoặc <b>AI tạo</b>.</p>}
    {pack?.scenes.map(s => <article className="ma-scene" key={s.sceneId}>
      <b className="ma-title">Cảnh {s.sceneIndex + 1}</b>
      <p className="ma-text">{s.text}</p>
      <div className="ma-grid">
        {s.illustrations.map((i, n) => <figure className="ma-item" key={i.beatId}>
          {/* Signed storage URLs are returned by the API. */}
          {i.url && i.status === 'Ready' ? <SafeImage src={i.url} alt={i.visualFocus} title={i.visualFocus} /> : <div className="ma-empty">{waiting(i.status) ? i.visualFocus || 'Chưa chọn tranh' : 'Tranh chưa sẵn sàng'}</div>}
          <figcaption><span>Tranh {n + 1}</span><AssetPill status={i.status} />{i.source === 'UserUpload' && <span className="pill">Tự tải lên</span>}
            {waiting(i.status) ? choice({ kind: 'image', id: i.beatId, name: `Tranh ${n + 1} · cảnh ${s.sceneIndex + 1}` })
              : <button className="btn btn-g icon-only" aria-label={`Tạo lại tranh ${n + 1}`} title="Tạo lại tranh" disabled={busy || disabled || uncertain} onClick={() => void regenerate('illustration', i.beatId)}><RefreshCw className="ic" /></button>}</figcaption>
        </figure>)}
      </div>
      {s.audio?.map(a => <div className="ma-audio" key={a.segmentId}>
        <span>Giọng đọc đoạn {a.segmentOrder + 1}</span><AssetPill status={a.status} />{a.source === 'UserUpload' && <span className="pill">Tự tải lên</span>}
        {a.url && a.status === 'Ready' && <audio controls preload="none" src={a.url} aria-label={`Nghe đoạn ${a.segmentOrder + 1}`} />}
        {waiting(a.status) ? choice({ kind: 'audio', id: a.segmentId, name: `Giọng đọc đoạn ${a.segmentOrder + 1} · cảnh ${s.sceneIndex + 1}` })
          : <button className="btn btn-g icon-only" aria-label={`Tạo lại giọng đoạn ${a.segmentOrder + 1}`} title="Tạo lại giọng đọc" disabled={busy || disabled || uncertain} onClick={() => void regenerate('audio', a.segmentId)}><RefreshCw className="ic" /></button>}
      </div>)}
    </article>)}
    {pack?.replacements?.filter(r=>['Failed','ManualReview'].includes(r.status)).map(r=><div className="notice" role="status" key={r.candidateAssetId}><p>Bản tạo lại {r.type === 'Illustration' ? 'tranh' : 'âm thanh'} chưa đạt yêu cầu.</p><button className="btn btn-s" disabled={busy||disabled||uncertain} onClick={()=>void keepCurrent(r.candidateAssetId)}>Giữ bản cũ</button></div>)}
    {showConfirmation && pack?.isAwaitingConfirmation && <div className="ma-confirm"><label className="row"><input type="checkbox" checked={reviewed} disabled={busy || disabled || uncertain} onChange={e => setReviewed(e.target.checked)} />Tôi đã xem tranh và nghe các đoạn âm thanh của gói này</label>
      <button className="btn btn-ok" disabled={busy || disabled || uncertain || !reviewed} onClick={() => void confirm()}><Check className="ic" />Xác nhận media</button>
    </div>}
    {pack?.isConfirmed && <p className="ma-done"><Check className="ic" aria-hidden />Đã xác nhận gói media</p>}
    <input ref={fileRef} type="file" hidden aria-label="Chọn tệp media" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
    {upload && <Dialog title={`Tải lên: ${upload.name}`} onClose={() => setUpload(null)}>
      <div className="st-form">
        <p className="notice">Tệp <b>{upload.file.name}</b> được kiểm tra an toàn{upload.kind === 'image' ? ' và độ khớp với nội dung cảnh' : ''} trước khi dùng. Moderator sẽ nghe lại mọi giọng đọc bạn tải lên.</p>
        <label className="field"><span className="lbl">Nguồn của tệp</span><input className="inp" maxLength={2000} value={decl.sourceDeclaration} onChange={(e) => setDecl({ ...decl, sourceDeclaration: e.target.value })} /></label>
        <label className="field"><span className="lbl">Cam kết quyền sử dụng</span><input className="inp" maxLength={2000} value={decl.rightsDeclaration} onChange={(e) => setDecl({ ...decl, rightsDeclaration: e.target.value })} /></label>
        <div className="row"><button className="btn btn-g" onClick={() => setUpload(null)}>Huỷ</button><span className="grow" />
          <button className="btn btn-p" disabled={busy || !decl.sourceDeclaration.trim() || !decl.rightsDeclaration.trim()} onClick={() => void runChoose(upload, upload.file)}><Upload className="ic" />Tải lên</button></div>
      </div>
    </Dialog>}
  </details>;
}
