'use client';
import {useStudioCompletion} from '@/app/features/story-workflow/useStudioCompletion';
import type {StoryMediaPackage,MediaProgressDto} from '@/app/types/aiStory';

export default function StudioCompletion({pack,progress,onChanged}:{pack:StoryMediaPackage|null;progress:MediaProgressDto|null;onChanged:()=>void}) {
  const c=useStudioCompletion(pack,progress,onChanged);
  return <div className="studio-completion">
    {c.note&&<p className="notice" role="status">{c.note}</p>}
    {c.canConfirm&&<>
      <label className="row"><input type="checkbox" checked={c.reviewed} disabled={c.busy||c.blocked} onChange={e=>c.setReviewed(e.target.checked)}/>Tôi đã xem tranh và nghe giọng đọc của gói media này</label>
      <button className="btn btn-p" disabled={!c.reviewed||c.busy||c.blocked} onClick={()=>void c.confirm()}>{c.busy?'Đang xác nhận…':'Xác nhận media và hoàn tất truyện'}</button>
    </>}
    {c.blocked&&<button className="btn btn-s" onClick={onChanged}>Tải lại trạng thái hoàn tất</button>}
  </div>;
}
