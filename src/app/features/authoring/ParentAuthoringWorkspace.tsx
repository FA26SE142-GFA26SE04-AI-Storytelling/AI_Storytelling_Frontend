'use client';
import { useEffect, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { parentAuthoringService as service } from '@/app/services/parentAuthoringService';
import { useParentAuthoring } from './useParentAuthoring';
import AssistancePanel from "./AssistancePanel";
import ParentImport from './ParentImport';
import AuthoringGuides from './AuthoringGuides';
import ParentSetupPanel from './ParentSetupPanel';
import ParentManualMedia from './ParentManualMedia';
import FamilyMediaPreview from './FamilyMediaPreview';
import { useWorkspaceData } from '@/app/context/WorkspaceDataContext';
import { useMyRole } from '@/app/features/children/useMyRole';
import type {AssistanceSelection} from '@/app/features/story-workflow/assistanceSelection';
const empty = { title: '', content: '', sourceDeclaration: '', rightsDeclaration: '' };
function resultOf<T>(ops: B.ParentOperationDto[], kind: string, versionId: number | null): T | null {
  const value = ops.filter(o => o.kind === kind && o.sourceIsCurrent && o.storyVersionId === versionId && !o.revokedAt).sort((a,b) => b.id - a.id)[0]?.result;
  return value && typeof value === 'object' ? value as T : null;
}
export default function ParentAuthoringWorkspace({ childId, onBack }: { childId: number; onBack: () => void }) {
  const h = useParentAuthoring(childId);
  const { child } = useWorkspaceData(); const role = useMyRole(child);
  const [references, setReferences] = useState<B.AssistanceReference[]>([]);
  const [selection,setSelection]=useState<AssistanceSelection|null>(null);
  const [form, setForm] = useState(empty);
  const [title, setTitle] = useState('Truyện của gia đình');
  const [importing, setImporting] = useState(false);
  const [checklist, setChecklist] = useState<B.ParentChecklist>({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false });
  const [preview, setPreview] = useState<B.ParentPreparationDto | null>(null);
  const [viewVersion, setViewVersion] = useState<B.CreatorVersionDto | null>(null);
  useEffect(() => { setReferences([]); setForm(h.version ? { title:h.version.title,content:h.version.content,sourceDeclaration:h.version.sourceDeclaration,rightsDeclaration:h.version.rightsDeclaration } : empty); setPreview(null); setChecklist({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false }); }, [h.version]);
  const story = h.draft?.story;
  const dirty = !!story && (form.title !== (h.version?.title ?? '') || form.content !== (h.version?.content ?? '') || form.sourceDeclaration !== (h.version?.sourceDeclaration ?? '') || form.rightsDeclaration !== (h.version?.rightsDeclaration ?? ''));
  const check = resultOf<B.ParentCheckDto>(h.workflow,'Check',story?.selectedVersionId ?? null);
  const confirmation = resultOf<B.ParentContentConfirmationDto>(h.workflow,'ContentConfirmation',story?.selectedVersionId ?? null);
  const preparation = resultOf<B.ParentPreparationDto>(h.workflow,'Preparation',story?.selectedVersionId ?? null);
  const mediaActive = !!resultOf(h.workflow,'MediaGeneration',story?.selectedVersionId ?? null);
  const grant = (h.workflow.find(o => o.kind === 'FamilyConfirmation' && !o.revokedAt)?.result ?? null) as B.ParentFamilyConfirmationDto | null;
  const canWrite = !h.draft?.isReadOnly && !h.busy && !h.uncertain;
  const saved = !dirty && !!story?.selectedVersionId && h.version?.versionId === story.selectedVersionId;
  const canApprove = role?.can('ApproveStory'); const canAssign = role?.can('AssignActivity');
  return <section className="ws dock" style={{ gridTemplateColumns:'1fr' }}><div className="pane st-page"><div className="ph"><span>Tự soạn truyện gia đình</span><button className="btn btn-s" onClick={onBack}>Về Studio AI</button></div><div className="st-body">
    {h.note && <p className="notice" role="status">{h.note}</p>}{h.uncertain && <p className="notice warn">Chưa rõ máy chủ đã nhận lệnh. Không tạo thao tác mới.<button className="btn btn-s" disabled={h.busy} onClick={() => void h.retry()}>Thử lại đúng lệnh</button></p>}
    <div className="row"><input className="inp" aria-label="Tên bản nháp mới" value={title} maxLength={200} onChange={e => setTitle(e.target.value)} /><button className="btn btn-p" disabled={h.busy || h.uncertain || !canAssign} onClick={() => void h.create(title)}>Tạo bản nháp cho bé</button><button className="btn btn-s" disabled={h.busy || h.uncertain} onClick={h.refreshList}>Tải danh sách</button></div>
    <details open={!story}><summary>Bản nháp gia đình của bạn</summary>{h.list?.items.map(d => <button className="btn btn-s" key={d.storyId} disabled={h.busy || h.uncertain} onClick={() => { if (!dirty || window.confirm('Bỏ thay đổi chưa lưu để mở bản khác?')) void h.load(d.storyId,true); }}>{d.title} #{d.storyId}</button>)}<div className="row"><button className="btn btn-s" disabled={h.page === 1 || h.busy} onClick={() => h.setPage(h.page - 1)}>Trước</button><button className="btn btn-s" disabled={!h.list?.hasNextPage || h.busy} onClick={() => h.setPage(h.page + 1)}>Tiếp</button></div></details>
    {story && <><p className="sub">Truyện #{story.storyId} · bản {story.selectedVersionId ?? 'chưa lưu'}{dirty ? ' · Có thay đổi chưa lưu' : ''}</p>{h.draft?.isReadOnly && <p className="notice warn">Bản này đã được giao cho bé; thu hồi quyền đọc trước khi sửa.</p>}
      {h.draft&&<ParentSetupPanel key={`${story.storyId}:${story.revisionToken}`} draft={h.draft} disabled={!canWrite||dirty} onSave={value=>void h.write((id,cmd)=>service.setup(id,{...cmd,...value}))}/>}
      <fieldset disabled={!canWrite} style={{ border:0,padding:0 }}><label className="field">Tên truyện<input className="inp" maxLength={200} value={form.title} onChange={e => setForm({ ...form,title:e.target.value })} /></label><label className="field">Nội dung<textarea className="inp" rows={12} maxLength={200000} value={form.content} onSelect={e=>setSelection({snapshot:{title:form.title,content:e.currentTarget.value},start:e.currentTarget.selectionStart,length:e.currentTarget.selectionEnd-e.currentTarget.selectionStart})} onChange={e => setForm({ ...form,content:e.target.value })} /></label><label className="field">Nguồn nội dung<input className="inp" maxLength={2000} value={form.sourceDeclaration} onChange={e => setForm({ ...form,sourceDeclaration:e.target.value })} /></label><label className="field">Cam kết quyền sử dụng<input className="inp" maxLength={2000} value={form.rightsDeclaration} onChange={e => setForm({ ...form,rightsDeclaration:e.target.value })} /></label>
      <div className="row"><button className="btn btn-p" disabled={!form.content.trim() || !dirty} onClick={() => void h.save({ ...form,assistanceReferences:references })}>Lưu phiên bản</button><button className="btn btn-s" disabled={dirty} onClick={() => setImporting(true)}>Nhập văn bản / tệp</button><button className="btn btn-s" disabled={!saved} onClick={() => void h.write((id,cmd) => service.check(id,cmd))}>Kiểm tra bản đã lưu</button></div><AuthoringGuides onInsert={text => setForm(f => ({ ...f,content:f.content ? `${f.content}\n\n${text}` : text }))} /></fieldset>
      <button className="btn btn-s" disabled={h.busy || h.uncertain} onClick={() => void h.load(story.storyId)}>Đồng bộ quyền và trạng thái (giữ bản đang sửa)</button>
      {h.draft?.canUseAiAssistance && <AssistancePanel key={`${story.storyId}:${story.selectedVersionId}`} actor="parent" story={story} selection={selection} snapshot={{title:form.title,content:form.content}} disabled={!canWrite} onApply={(next,ref) => { setForm(f => ({...f,...next})); setSelection(null);setReferences(v => v.some(r=>r.taskId===ref.taskId&&r.stepId===ref.stepId)?v:[...v,ref]); }} />}
      {h.draft && !h.draft.canUseAiAssistance && <p className="sub">Hỗ trợ AI chưa khả dụng: {h.draft.aiUnavailableReason}</p>}
      {check && <div className="sec"><p>{check.coverage}</p>{check.errors.map(e => <p className="notice err" key={e}>{e}</p>)}{check.warnings.map(e => <p className="notice warn" key={e}>{e}</p>)}</div>}
      {saved && check?.canPrepare && canWrite && <section className="sec"><h3>Xác nhận nội dung cho bé</h3>{(Object.keys(checklist) as (keyof B.ParentChecklist)[]).map(k => <label className="row" key={k}><input type="checkbox" checked={checklist[k]} onChange={e => setChecklist(c => ({ ...c,[k]:e.target.checked }))} />{({ intendedMeaning:'Đúng ý định của tôi',suitableForChild:'Phù hợp với bé',privacyChecked:'Đã kiểm tra thông tin riêng tư',endingChecked:'Đã đọc phần kết' })[k]}</label>)}<button className="btn btn-p" disabled={!Object.values(checklist).every(Boolean) || !canApprove} onClick={() => void h.write((id,cmd) => service.confirmContent(id,{ ...cmd,checkId:check.checkId,checklist }))}>Xác nhận nội dung</button></section>}
      {saved && confirmation && story.selectedVersionId && <ParentManualMedia key={`media:${story.storyId}:${story.selectedVersionId}`} storyId={story.storyId} versionId={story.selectedVersionId} active={mediaActive} disabled={!canWrite || !canApprove || !h.draft?.canUseAiAssistance} onGenerate={() => void h.write((id,cmd) => service.generateMedia(id,{...cmd,contentConfirmationId:confirmation.confirmationId}))} onChanged={() => { setPreview(null); void h.load(story.storyId); }}/>}
      {saved && confirmation && canWrite && <button className="btn btn-s" onClick={() => { setPreview(null); void h.write((id,cmd) => service.prepare(id,{ ...cmd,contentConfirmationId:confirmation.confirmationId,segmentEnds:null })); }}>Chuẩn bị gói đọc cho bản đã xác nhận</button>}
      {saved && preparation && <section className="sec"><button className="btn btn-s" disabled={h.busy} onClick={() => { setPreview(null); void h.execute(() => service.preview(story.storyId,preparation.preparationId)).then(r => { if (r?.success) setPreview(r.data); }); }}>Tải bản xem trước</button>{preview && preview.storyVersionId === story.selectedVersionId && <><h3>{preview.title}</h3>{preview.segments.map(s => <p key={s.order} style={{ whiteSpace:'pre-wrap' }}>{s.text}</p>)}<FamilyMediaPreview preparation={preview}/>{preview.missingRequirements.map(r => <p className="notice warn" key={r}>{r}</p>)}<button className="btn btn-ok" disabled={!canWrite || !canApprove || !canAssign || !preview.isReady} onClick={() => void h.write((id,cmd) => service.confirmFamily(id,{ ...cmd,preparationId:preview.preparationId }))}>Giao đúng bản này cho bé đọc</button></>}</section>}
      {grant && <button className="btn btn-no" disabled={h.busy || h.uncertain || !canApprove || !canAssign} onClick={() => void h.write((id,cmd) => service.revokeFamily(id,{ ...cmd,confirmationId:grant.confirmationId }))}>Thu hồi quyền đọc bản đã giao</button>}
      <details><summary>Lịch sử phiên bản</summary>{h.versions.map(v => <div className="row" key={v.versionId}><span>V{v.versionNo} · {v.title}</span><button className="btn btn-g" onClick={() => void h.execute(() => service.version(story.storyId,v.versionId)).then(r => { if (r?.success) setViewVersion(r.data); })}>Xem</button><button className="btn btn-s" disabled={!canWrite || dirty} onClick={() => void h.write((id,cmd) => service.restore(id,{ ...cmd,sourceVersionId:v.versionId })).then(r => { if (r?.success) void h.load(story.storyId,true); })}>Khôi phục thành bản mới</button></div>)}{viewVersion && <pre style={{ whiteSpace:'pre-wrap' }}>{viewVersion.content}</pre>}</details>
      {importing && h.draft && <ParentImport draft={h.draft} onClose={() => setImporting(false)} onSaved={() => { setImporting(false); void h.load(story.storyId,true); }} />}
    </>}
  </div></div></section>;
}
