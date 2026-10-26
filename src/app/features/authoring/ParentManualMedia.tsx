'use client';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { useStoryProgressPolling } from '@/app/features/story-workflow/useStoryProgressPolling';
import { mediaNeedsPolling } from '@/app/features/story-workflow/mediaPackage';
import MediaAssets from '@/app/features/studio/MediaAssets';

export default function ParentManualMedia({ storyId, versionId, active, disabled, onGenerate, onChanged }: {
  storyId:number; versionId:number; active:boolean; disabled:boolean; onGenerate:()=>void; onChanged:()=>void;
}) {
  const progress = useStoryProgressPolling(active ? storyId : null, api.getMediaProgress, mediaNeedsPolling, 600_000);
  const current = progress.data?.approvedStoryVersionId === versionId ? progress.data : null;
  const changed = () => { progress.refresh(); onChanged(); };
  return <section className="st-card"><h3>Tranh và giọng đọc cho truyện gia đình</h3>
    <p className="sub">Đây là bước tùy chọn sau xác nhận nội dung. Nếu tạo media, bạn cần xem và xác nhận gói trước khi chuẩn bị bản đọc giao cho bé.</p>
    {!active && <button className="btn btn-p" disabled={disabled} onClick={onGenerate}>Tạo tranh và giọng đọc cho bản đã xác nhận</button>}
    {active && <><p role="status">{current?.isReady ? 'Gói đã xác nhận và sẵn sàng' : current?.isAwaitingConfirmation ? 'Media đã tạo xong, chờ bạn xác nhận' : current?.jobStatus ?? 'Đang lấy tiến trình…'}</p>
      {(progress.error || current?.errorCode) && <p className="notice err">{progress.error || current?.errorCode}</p>}
      {progress.timedOut && <p className="notice warn">Đã dừng theo dõi tự động; kiểm tra trạng thái để tiếp tục.</p>}
      <button className="btn btn-s" onClick={progress.refresh}>Kiểm tra tiến trình media</button>
      {current?.errorCode && <button className="btn btn-s" disabled={disabled} onClick={() => void api.retryMedia(storyId).then(changed)}>Thử lại tác vụ media</button>}
      <MediaAssets storyId={storyId} versionId={versionId} disabled={disabled} onChanged={changed}/>
    </>}
  </section>;
}
