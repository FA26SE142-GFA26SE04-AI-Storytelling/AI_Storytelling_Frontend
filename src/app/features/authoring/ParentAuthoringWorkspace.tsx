'use client';
import { confirmDialog } from "@/app/lib/confirm";
import './authoring.css';
import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import { parentAuthoringService as service } from '@/app/services/parentAuthoringService';
import { useParentAuthoring } from './useParentAuthoring';
import AssistancePanel from "./AssistancePanel";
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
export default function ParentAuthoringWorkspace({ childId, initialStoryId = null }: { childId: number; initialStoryId?: number | null }) {
  const h = useParentAuthoring(childId);
  // Mở thẳng bản nháp được chọn từ Thư viện. Đợi danh sách tải xong, vì lần tải danh sách đầu tiên huỷ mọi lần mở bản nháp trước đó.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || initialStoryId === null || !h.list) return;
    opened.current = true;
    void h.load(initialStoryId, true);
  }, [h, initialStoryId]);
  const { child, children: kids } = useWorkspaceData(); const role = useMyRole(child);
  const [references, setReferences] = useState<B.AssistanceReference[]>([]);
  const [selection,setSelection]=useState<AssistanceSelection|null>(null);
  const [form, setForm] = useState(empty);
  const [title, setTitle] = useState('Truyện của gia đình');
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [checklist, setChecklist] = useState<B.ParentChecklist>({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false });
  const [preview, setPreview] = useState<B.ParentPreparationDto | null>(null);
  const [viewVersion, setViewVersion] = useState<B.CreatorVersionDto | null>(null);
  useEffect(() => { setReferences([]); setForm(h.version ? { title:h.version.title,content:h.version.content,sourceDeclaration:h.version.sourceDeclaration,rightsDeclaration:h.version.rightsDeclaration } : empty); setPreview(null); setChecklist({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false }); }, [h.version]);
  const story = h.draft?.story;
  // Tải tệp .txt/.docx: máy chủ đọc nội dung tệp rồi đưa thẳng vào khung soạn để xem và sửa; chỉ lưu khi bấm "Lưu phiên bản".
  const loadFile = async (file: File) => {
    if (!story || reading) return;
    if (form.content.trim() && !await confirmDialog('Nội dung tệp sẽ thay phần đang soạn. Tiếp tục?')) return;
    setReading(true); h.setNote('');
    const body = new FormData();
    body.append('File', file); body.append('RevisionToken', story.revisionToken); body.append('OperationId', crypto.randomUUID());
    const r = await service.previewFile(story.storyId, body);
    setReading(false);
    if (!r.success || !r.data) { h.setNote(r.message || 'Chưa đọc được tệp này.'); return; }
    const content = r.data.content;
    setForm(prev => ({ ...prev, content, title: prev.title.trim() ? prev.title : file.name.replace(/.[^.]+$/, '') }));
    h.setNote('Đã đưa nội dung tệp vào khung soạn. Đọc lại, sửa nếu cần rồi bấm "Lưu phiên bản".');
  };
  const dirty = !!story && (form.title !== (h.version?.title ?? '') || form.content !== (h.version?.content ?? '') || form.sourceDeclaration !== (h.version?.sourceDeclaration ?? '') || form.rightsDeclaration !== (h.version?.rightsDeclaration ?? ''));
  const check = resultOf<B.ParentCheckDto>(h.workflow,'Check',story?.selectedVersionId ?? null);
  const confirmation = resultOf<B.ParentContentConfirmationDto>(h.workflow,'ContentConfirmation',story?.selectedVersionId ?? null);
  const preparation = resultOf<B.ParentPreparationDto>(h.workflow,'Preparation',story?.selectedVersionId ?? null);
  const mediaActive = !!resultOf(h.workflow,'MediaGeneration',story?.selectedVersionId ?? null);
  const grant = (h.workflow.find(o => o.kind === 'FamilyConfirmation' && !o.revokedAt)?.result ?? null) as B.ParentFamilyConfirmationDto | null;
  const canWrite = !h.draft?.isReadOnly && !h.busy && !h.uncertain;
  const saved = !dirty && !!story?.selectedVersionId && h.version?.versionId === story.selectedVersionId;
  const canApprove = role?.can('ApproveStory'); const canAssign = role?.can('AssignActivity');
  const step = (n: number) => <span className="pa-num">{n}</span>;
  return <section className="ws dock" style={{ gridTemplateColumns:'1fr' }}><div className="pane st-page">
    <div className="ph"><span>Thủ công</span></div>
    <div className="st-body pa-body">
      {h.note && <p className="notice" role="status">{h.note}</p>}
      {h.uncertain && <p className="notice warn">Chưa rõ máy chủ đã nhận lệnh. Không tạo thao tác mới. <button className="btn btn-s" disabled={h.busy} onClick={() => void h.retry()}>Thử lại đúng lệnh</button></p>}

      {/* Nhóm 1: tạo mới hoặc mở bản nháp */}
      <section className="pa-card" aria-label="Bản nháp">
        <div className="pa-head"><h3>Bản nháp</h3><button className="btn btn-s" disabled={h.busy || h.uncertain} onClick={h.refreshList}>Tải danh sách</button></div>
        <div className="pa-new">
          <input className="inp" aria-label="Tên bản nháp mới" value={title} maxLength={200} onChange={e => setTitle(e.target.value)} />
          <button className="btn btn-p" disabled={h.busy || h.uncertain || !canAssign} onClick={() => void h.create(title)}>Tạo bản nháp cho bé</button>
        </div>
        <details open={!story}>
          <summary>Bản nháp gia đình của bạn</summary>
          <div className="pa-wrap">
            {h.list?.items.map(d => <button className={`btn ${d.storyId === story?.storyId ? 'btn-ok' : 'btn-s'}`} key={d.storyId} disabled={h.busy || h.uncertain} onClick={async () => { if (!dirty || await confirmDialog('Bỏ thay đổi chưa lưu để mở bản khác?')) void h.load(d.storyId,true); }}>{d.title} #{d.storyId}</button>)}
            {h.list && h.list.items.length === 0 && <p className="sub">Chưa có bản nháp nào.</p>}
          </div>
          <div className="pa-actions" style={{ marginTop:10 }}>
            <button className="btn btn-g" disabled={h.page === 1 || h.busy} onClick={() => h.setPage(h.page - 1)}>Trước</button>
            <button className="btn btn-g" disabled={!h.list?.hasNextPage || h.busy} onClick={() => h.setPage(h.page + 1)}>Tiếp</button>
          </div>
        </details>
      </section>

      {story && <div className="pa-grid">
        <div className="pa-col">
          {/* Nhóm 2: soạn và lưu nội dung */}
          <section className="pa-card" aria-label="Soạn nội dung">
            <div className="pa-head">
              <h3>{step(1)}Soạn nội dung</h3>
              {h.draft && <span className="pa-for" title="Bản nháp này được tạo cho bé này và sẽ giao cho bé này">Dành cho: <b>{kids.find(k => k.id === h.draft!.childProfileId)?.nickname ?? `bé #${h.draft.childProfileId}`}</b></span>}
              <span className="sub">Truyện #{story.storyId} · bản {story.selectedVersionId ?? 'chưa lưu'}{dirty ? ' · Có thay đổi chưa lưu' : ''}</span>
              <button className="btn btn-g" disabled={h.busy || h.uncertain} onClick={() => void h.load(story.storyId)}>Đồng bộ quyền và trạng thái (giữ bản đang sửa)</button>
            </div>
            {h.draft?.isReadOnly && <p className="notice warn">Bản này đã được giao cho bé; thu hồi quyền đọc trước khi sửa.</p>}
            {h.draft && <ParentSetupPanel key={`${story.storyId}:${story.revisionToken}`} draft={h.draft} disabled={!canWrite||dirty} onSave={value=>void h.write((id,cmd)=>service.setup(id,{...cmd,...value}))}/>}
            <fieldset className="pa-fieldset" disabled={!canWrite}>
              <label className="field">Tên truyện<input className="inp" maxLength={200} value={form.title} onChange={e => setForm({ ...form,title:e.target.value })} /></label>
              <label className="field">Nội dung<textarea className="inp" rows={14} maxLength={200000} value={form.content} onSelect={e=>setSelection({snapshot:{title:form.title,content:e.currentTarget.value},start:e.currentTarget.selectionStart,length:e.currentTarget.selectionEnd-e.currentTarget.selectionStart})} onChange={e => setForm({ ...form,content:e.target.value })} /></label>
              <div className="pa-fields">
                <label className="field">Nguồn nội dung<input className="inp" maxLength={2000} value={form.sourceDeclaration} onChange={e => setForm({ ...form,sourceDeclaration:e.target.value })} /></label>
                <label className="field">Cam kết quyền sử dụng<input className="inp" maxLength={2000} value={form.rightsDeclaration} onChange={e => setForm({ ...form,rightsDeclaration:e.target.value })} /></label>
              </div>
              <div className="pa-actions bar">
                <button className="btn btn-s" disabled={reading} onClick={() => fileRef.current?.click()}><Upload className="ic" />{reading ? 'Đang đọc tệp…' : 'Tải tệp'}</button>
                <input ref={fileRef} type="file" accept=".txt,.docx" hidden aria-label="Chọn tệp truyện (.txt, .docx)" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void loadFile(f); }} />
                <button className="btn btn-p push" disabled={!form.content.trim() || !dirty} onClick={() => void h.save({ ...form,assistanceReferences:references })}>Lưu phiên bản</button>
              </div>
            </fieldset>
          </section>

          {/* Nhóm 3: kiểm tra, xác nhận và giao cho bé */}
          <section className="pa-card" aria-label="Kiểm tra và giao cho bé">
            <div className="pa-head"><h3>{step(2)}Kiểm tra &amp; giao cho bé</h3></div>
            <div className="pa-step">
              <h4>{step(1)}Kiểm tra bản đã lưu</h4>
              {!saved && <p className="sub">Lưu phiên bản trước khi kiểm tra.</p>}
              <div className="pa-actions"><button className="btn btn-s" disabled={!saved} onClick={() => void h.write((id,cmd) => service.check(id,cmd))}>Kiểm tra bản đã lưu</button></div>
              {check && <><p style={{ margin:0 }}>{check.coverage}</p>{check.errors.map(e => <p className="notice err" key={e}>{e}</p>)}{check.warnings.map(e => <p className="notice warn" key={e}>{e}</p>)}</>}
            </div>
            {saved && check?.canPrepare && canWrite && <div className="pa-step">
              <h4>{step(2)}Xác nhận nội dung cho bé</h4>
              {(Object.keys(checklist) as (keyof B.ParentChecklist)[]).map(k => <label className="pa-check" key={k}><input type="checkbox" checked={checklist[k]} onChange={e => setChecklist(c => ({ ...c,[k]:e.target.checked }))} />{({ intendedMeaning:'Đúng ý định của tôi',suitableForChild:'Phù hợp với bé',privacyChecked:'Đã kiểm tra thông tin riêng tư',endingChecked:'Đã đọc phần kết' })[k]}</label>)}
              <div className="pa-actions"><button className="btn btn-p" disabled={!Object.values(checklist).every(Boolean) || !canApprove} onClick={() => void h.write((id,cmd) => service.confirmContent(id,{ ...cmd,checkId:check.checkId,checklist }))}>Xác nhận nội dung</button></div>
            </div>}
            {saved && confirmation && story.selectedVersionId && <ParentManualMedia key={`media:${story.storyId}:${story.selectedVersionId}`} storyId={story.storyId} versionId={story.selectedVersionId} active={mediaActive} disabled={!canWrite || !canApprove || !h.draft?.canUseAiAssistance} onGenerate={() => void h.write((id,cmd) => service.generateMedia(id,{...cmd,contentConfirmationId:confirmation.confirmationId}))} onChanged={() => { setPreview(null); void h.load(story.storyId); }}/>}
            {saved && confirmation && <div className="pa-step">
              <h4>{step(3)}Chuẩn bị và giao gói đọc</h4>
              <div className="pa-actions">
                {canWrite && <button className="btn btn-s" onClick={() => { setPreview(null); void h.write((id,cmd) => service.prepare(id,{ ...cmd,contentConfirmationId:confirmation.confirmationId,segmentEnds:null })); }}>Chuẩn bị gói đọc cho bản đã xác nhận</button>}
                {preparation && <button className="btn btn-s" disabled={h.busy} onClick={() => { setPreview(null); void h.execute(() => service.preview(story.storyId,preparation.preparationId)).then(r => { if (r?.success) setPreview(r.data); }); }}>Tải bản xem trước</button>}
              </div>
              {preparation && preview && preview.storyVersionId === story.selectedVersionId && <>
                <h3 style={{ margin:0 }}>{preview.title}</h3>
                {preview.segments.map(s => <p key={s.order} style={{ whiteSpace:'pre-wrap', margin:0 }}>{s.text}</p>)}
                <FamilyMediaPreview preparation={preview}/>
                {preview.missingRequirements.map(r => <p className="notice warn" key={r}>{r}</p>)}
                <div className="pa-actions"><button className="btn btn-ok" disabled={!canWrite || !canApprove || !canAssign || !preview.isReady} onClick={() => void h.write((id,cmd) => service.confirmFamily(id,{ ...cmd,preparationId:preview.preparationId }))}>Giao đúng bản này cho bé đọc</button></div>
              </>}
            </div>}
            {grant && <div className="pa-danger">
              <span className="sub">Bé đang được đọc một bản của truyện này.</span>
              <button className="btn btn-no" disabled={h.busy || h.uncertain || !canApprove || !canAssign} onClick={() => void h.write((id,cmd) => service.revokeFamily(id,{ ...cmd,confirmationId:grant.confirmationId }))}>Thu hồi quyền đọc bản đã giao</button>
            </div>}
          </section>

          <section className="pa-card" aria-label="Lịch sử phiên bản">
            <details><summary>Lịch sử phiên bản</summary>
              {h.versions.map(v => <div className="pa-ver" key={v.versionId}><span>V{v.versionNo} · {v.title}</span><button className="btn btn-g" onClick={() => void h.execute(() => service.version(story.storyId,v.versionId)).then(r => { if (r?.success) setViewVersion(r.data); })}>Xem</button><button className="btn btn-s" disabled={!canWrite || dirty} onClick={() => void h.write((id,cmd) => service.restore(id,{ ...cmd,sourceVersionId:v.versionId })).then(r => { if (r?.success) void h.load(story.storyId,true); })}>Khôi phục thành bản mới</button></div>)}
              {viewVersion && <pre className="st-content">{viewVersion.content}</pre>}
            </details>
          </section>
        </div>

        {/* Cột phụ: công cụ hỗ trợ viết */}
        <aside className="pa-col" aria-label="Công cụ hỗ trợ viết">
          {h.draft?.canUseAiAssistance && <AssistancePanel key={`${story.storyId}:${story.selectedVersionId}`} actor="parent" story={story} selection={selection} snapshot={{title:form.title,content:form.content}} disabled={!canWrite} onApply={(next,ref) => { setForm(f => ({...f,...next})); setSelection(null);setReferences(v => v.some(r=>r.taskId===ref.taskId&&r.stepId===ref.stepId)?v:[...v,ref]); }} />}
          {h.draft && !h.draft.canUseAiAssistance && <p className="notice">Hỗ trợ AI chưa khả dụng: {h.draft.aiUnavailableReason}</p>}
          <section className="pa-card"><fieldset className="pa-fieldset" disabled={!canWrite}><AuthoringGuides onInsert={text => setForm(f => ({ ...f,content:f.content ? `${f.content}\n\n${text}` : text }))} /></fieldset></section>
        </aside>
      </div>}
    </div>
  </div></section>;
}
