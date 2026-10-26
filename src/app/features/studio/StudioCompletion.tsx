'use client';
import {useState} from 'react';
import {useStudioCompletion} from '@/app/features/story-workflow/useStudioCompletion';
import {useWorkspaceData} from '@/app/context/WorkspaceDataContext';
import {useMyRole} from '@/app/features/children/useMyRole';
import AddToRoadmapDialog from '@/app/features/roadmap/AddToRoadmapDialog';
import type {StoryMediaPackage,MediaProgressDto} from '@/app/types/aiStory';
import type {RoadmapStoryInput} from '@/app/types/progress';

export default function StudioCompletion({pack,progress,story,onChanged}:{pack:StoryMediaPackage|null;progress:MediaProgressDto|null;story:RoadmapStoryInput;onChanged:()=>void}) {
  const c=useStudioCompletion(pack,progress,onChanged);
  const {child,reload}=useWorkspaceData();const role=useMyRole(child);
  const [dialog,setDialog]=useState(false);
  return <div className="studio-completion">
    {c.note&&<p className="notice" role="status">{c.note}</p>}
    {c.canConfirm&&<>
      <label className="row"><input type="checkbox" checked={c.reviewed} disabled={c.busy||c.blocked} onChange={e=>c.setReviewed(e.target.checked)}/>Tôi đã xem tranh và nghe giọng đọc của gói media này</label>
      <button className="btn btn-p" disabled={!c.reviewed||c.busy||c.blocked} onClick={()=>void c.confirm()}>{c.busy?'Đang xác nhận…':'Xác nhận media và hoàn tất truyện'}</button>
    </>}
    {c.blocked&&<button className="btn btn-s" onClick={onChanged}>Tải lại trạng thái hoàn tất</button>}
    {c.ready&&<>
      <p role="status">Truyện đã hoàn tất. Thêm vào lộ trình để bé sử dụng.</p>
      {role?.can('AssignActivity')?<button className="btn btn-p" onClick={()=>setDialog(true)}>Giao truyện cho {child?.nickname??'bé'}</button>:<p className="sub">{role?'Bạn chưa có quyền giao hoạt động cho bé này.':'Đang kiểm tra quyền giao truyện…'}</p>}
    </>}
    {dialog&&c.ready&&role?.can('AssignActivity')&&<AddToRoadmapDialog story={story} onClose={()=>setDialog(false)} onDone={()=>{void reload();}}/>}
  </div>;
}
