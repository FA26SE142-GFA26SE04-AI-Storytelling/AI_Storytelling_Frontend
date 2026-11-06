'use client';
import { confirmDialog } from "@/app/lib/confirm";
import './authoring.css';
import '@/app/features/review/review-tools.css';
import { useEffect, useRef, useState } from 'react';
import { Check, ShieldCheck, Upload, UserRoundPen } from 'lucide-react';
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
type StepId = 'write' | 'confirm' | 'media' | 'deliver';
const CHECK_LABEL: Record<keyof B.ParentChecklist, string> = { intendedMeaning: 'Đúng ý định của tôi', suitableForChild: 'Phù hợp với bé', privacyChecked: 'Đã kiểm tra thông tin riêng tư', endingChecked: 'Đã đọc phần kết' };
/** Backend trả câu mô tả phạm vi kiểm tra bằng tiếng Anh; câu đã biết thì dịch, câu lạ giữ nguyên. */
const COVERAGE_VI: Record<string, string> = {
  'Technical limits, configured keywords in title/body and body readability only; no semantic safety assessment or AI.':
    'Chỉ kiểm tra giới hạn kỹ thuật, từ khóa cấm đã cấu hình ở tiêu đề và nội dung, và độ dễ đọc của nội dung. Không đánh giá an toàn theo ngữ nghĩa và không dùng AI, nên bạn vẫn cần tự đọc lại.',
};
const empty = { title: '', content: '', sourceDeclaration: '', rightsDeclaration: '' };
function resultOf<T>(ops: B.ParentOperationDto[], kind: string, versionId: number | null): T | null {
  const value = ops.filter(o => o.kind === kind && o.sourceIsCurrent && o.storyVersionId === versionId && !o.revokedAt).sort((a,b) => b.id - a.id)[0]?.result;
  return value && typeof value === 'object' ? value as T : null;
}
export default function ParentAuthoringWorkspace({ childId, initialStoryId = null, onChangeKid, onDone }: { childId: number; initialStoryId?: number | null; onChangeKid?: () => void; onDone?: () => void }) {
  const h = useParentAuthoring(childId);
  // Mở thẳng bản nháp được chọn từ Thư viện. Đợi danh sách tải xong, vì lần tải danh sách đầu tiên huỷ mọi lần mở bản nháp trước đó.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || initialStoryId === null || !h.list) return;
    opened.current = true;
    void h.load(initialStoryId, true);
  }, [h, initialStoryId]);
  const { children: kids } = useWorkspaceData(); const child = kids.find(k => k.id === childId) ?? null; const kidName = child?.nickname ?? `bé #${childId}`; const role = useMyRole(child);
  const [references, setReferences] = useState<B.AssistanceReference[]>([]);
  const [selection,setSelection]=useState<AssistanceSelection|null>(null);
  const [form, setForm] = useState(empty);
  const [title, setTitle] = useState('Truyện của gia đình');
  // Hộp đặt tên bản nháp: hiện ngay khi vào trang mà chưa mở bản nháp nào có sẵn.
  const [naming, setNaming] = useState(initialStoryId === null);
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [checklist, setChecklist] = useState<B.ParentChecklist>({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false });
  const [preview, setPreview] = useState<B.ParentPreparationDto | null>(null);
  const [viewVersion, setViewVersion] = useState<B.CreatorVersionDto | null>(null);
  const [stepId, setStepId] = useState<StepId>('write');
  useEffect(() => { setReferences([]); setForm(h.version ? { title:h.version.title,content:h.version.content,sourceDeclaration:h.version.sourceDeclaration,rightsDeclaration:h.version.rightsDeclaration } : { ...empty, title: h.draft?.story.title ?? '' }); setPreview(null); setChecklist({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false }); }, [h.version]);
  const story = h.draft?.story;
  const storyKey = story?.storyId ?? null;
  useEffect(() => { setStepId('write'); }, [storyKey]);
  // Tải tệp .txt/.docx: máy chủ đọc nội dung tệp rồi đưa thẳng vào khung soạn để xem và sửa; chỉ lưu khi bấm "Lưu và tiếp tục".
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
    h.setNote('Đã đưa nội dung tệp vào khung soạn. Đọc lại, sửa nếu cần rồi bấm "Lưu và tiếp tục".');
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
  // Các bước của luồng soạn truyện; bước sau chỉ mở khi bước trước đã xong.
  const steps: { id: StepId; label: string; note: string; done: boolean; locked: boolean }[] = [
    { id: 'write', label: 'Soạn nội dung', note: dirty ? 'Có thay đổi chưa lưu' : saved ? 'Đã lưu' : 'Chưa lưu', done: saved, locked: false },
    { id: 'confirm', label: 'Xác nhận cho bé', note: confirmation ? 'Đã xác nhận' : !saved ? 'Lưu nội dung trước' : check && !check.canPrepare ? 'Cần sửa nội dung' : 'Chưa xác nhận', done: !!confirmation, locked: !saved },
    { id: 'media', label: 'Tranh và giọng đọc', note: mediaActive ? 'Đang tạo hoặc đã tạo' : 'Tùy chọn', done: mediaActive, locked: !saved || !confirmation },
    { id: 'deliver', label: 'Chuẩn bị và giao', note: grant ? 'Đã giao cho bé' : preparation ? 'Đã chuẩn bị' : 'Chưa giao', done: !!grant, locked: !saved || !confirmation },
  ];
  const active = steps.find(s => s.id === stepId && !s.locked) ?? steps[0];
  // Vào bước Xác nhận mà bản đã lưu chưa được kiểm tra thì tự kiểm tra (mỗi phiên bản một lần; lỗi thì có nút "Kiểm tra lại").
  const autoChecked = useRef<number | null>(null);
  const versionId = story?.selectedVersionId ?? null;
  useEffect(() => {
    if (active.id !== 'confirm' || !saved || check || confirmation || !canWrite || versionId === null || autoChecked.current === versionId) return;
    autoChecked.current = versionId;
    void h.write((id, cmd) => service.check(id, cmd));
  });
  const stepNav = (prev: StepId | null, next: StepId | null, nextOk: boolean, label = 'Bước tiếp theo', onNext?: () => void | Promise<void>) => <div className="pa-actions bar">
    {prev && <button className="btn btn-g" onClick={() => setStepId(prev)}>Quay lại</button>}
    {next && <button className="btn btn-p push" disabled={!nextOk} onClick={() => void (onNext ? onNext() : setStepId(next))}>{label}</button>}
  </div>;
  // Bước 1: chưa lưu thì nút tiếp theo tự lưu phiên bản rồi mới sang bước Kiểm tra.
  const loadPreview = () => { if (!story || !preparation) return; setPreview(null); void h.execute(() => service.preview(story.storyId, preparation.preparationId)).then(r => { if (r?.success) setPreview(r.data); }); };
  const previewBlock = story && preparation && preview && preview.storyVersionId === story.selectedVersionId && <div className="pa-confirmed">
    <b>{preview.title}</b>
    {preview.segments.map(s => <p key={s.order}>{s.text}</p>)}
    <FamilyMediaPreview preparation={preview}/>
    {preview.missingRequirements.map(r => <p className="notice warn" key={r}>{r}</p>)}
  </div>;
  // Bước Xác nhận: nút tiếp theo xác nhận nội dung (bốn ô tích đã đủ) rồi mới sang bước sau.
  const confirmAndNext = async () => {
    if (!check) return;
    const r = await h.write((id, cmd) => service.confirmContent(id, { ...cmd, checkId: check.checkId, checklist }));
    if (r?.success) setStepId('media');
  };
  const saveThenNext = async () => { if (await h.save({ ...form, assistanceReferences: references })) setStepId('confirm'); };
  return <section className="ws dock" style={{ gridTemplateColumns:'1fr' }}><div className="pane st-page">
    <div className="st-body pa-body">
      {h.note && <p className="notice" role="status">{h.note}</p>}
      {h.uncertain && <p className="notice warn">Chưa rõ máy chủ đã nhận lệnh. Không tạo thao tác mới. <button className="btn btn-s" disabled={h.busy} onClick={() => void h.retry()}>Thử lại</button></p>}

      {/* Bé đang soạn cho, và nút tạo bản nháp khác; bản nháp đã có mở từ trang "Truyện của tôi". */}
      <div className="pa-top">
        <span className="pa-kid"><ShieldCheck className="ic" aria-hidden />Soạn cho {kidName}{onChangeKid && <button className="btn btn-g pa-kid-change" onClick={onChangeKid} title="Đổi bé" aria-label={`Đổi bé, đang soạn cho ${kidName}`}><UserRoundPen className="ic" /></button>}</span>
        {story && <button className="btn btn-s" disabled={h.busy || h.uncertain || !canAssign} onClick={async () => { if (!dirty || await confirmDialog('Bỏ thay đổi chưa lưu để tạo bản nháp mới?')) setNaming(true); }}>Tạo bản nháp mới</button>}
      </div>

      {naming && <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label="Tạo bản nháp" onClick={e => { if (e.target === e.currentTarget && story) setNaming(false); }}>
        <form className="dlg pa-namedlg" onSubmit={async e => { e.preventDefault(); if (await h.create(title.trim() || 'Truyện của gia đình')) setNaming(false); }}>
          <b className="display" style={{ fontSize: "var(--fs-lg)" }}>Tạo bản nháp cho {kidName}</b>
          <label className="field">Tên bản nháp<input className="inp" autoFocus maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>
          {h.note && <p className="notice" role="status">{h.note}</p>}
          <div className="pa-actions">
            {story && <button type="button" className="btn btn-g" onClick={() => setNaming(false)}>Hủy</button>}
            <button type="submit" className="btn btn-p push" disabled={h.busy || h.uncertain || !canAssign}>Tạo bản nháp</button>
          </div>
        </form>
      </div>}

      {story && <div className="pa-flow">
        {/* Khung trái: thứ tự các bước; bước chưa mở khoá thì mờ đi và ghi rõ cần làm gì trước. */}
        <nav className="pa-steps" aria-label="Các bước soạn truyện">
          <b className="pa-steps-title">Các bước</b>
          <ol>
            {steps.map((s, i) => <li key={s.id}>
              <button className={`pa-stepbtn${active.id === s.id ? ' on' : ''}${s.done ? ' done' : ''}`} disabled={s.locked} aria-current={active.id === s.id ? 'step' : undefined} onClick={() => setStepId(s.id)}>
                <span className="pa-num">{s.done ? <Check className="ic" aria-hidden /> : i + 1}</span>
                <span className="pa-steptxt"><b>{s.label}</b><small>{s.note}</small></span>
              </button>
            </li>)}
          </ol>
        </nav>

        <div className="pa-stage">
          {active.id === 'write' && <>
            <section className="pa-card" aria-label="Soạn nội dung">
              <div className="pa-head">
                <h3>{step(1)}Soạn nội dung</h3>
                {h.draft && <span className="pa-for" title="Bản nháp này được tạo cho bé này và sẽ giao cho bé này">Dành cho: <b>{kids.find(k => k.id === h.draft!.childProfileId)?.nickname ?? `bé #${h.draft.childProfileId}`}</b></span>}
                <span className="sub">Truyện #{story.storyId} · bản {story.selectedVersionId ?? 'chưa lưu'}{dirty ? ' · Có thay đổi chưa lưu' : ''}</span>
                <button className="btn btn-g" disabled={h.busy || h.uncertain} onClick={() => void h.load(story.storyId)}title="Đồng bộ quyền và trạng thái, giữ bản đang sửa">Đồng bộ</button>
              </div>
              {h.draft?.isReadOnly && <p className="notice warn">Bản này đã được giao cho bé; thu hồi quyền đọc trước khi sửa.</p>}
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
                </div>
              </fieldset>
              {h.draft && <ParentSetupPanel key={`${story.storyId}:${story.revisionToken}`} draft={h.draft} disabled={!canWrite||dirty} onSave={value=>void h.write((id,cmd)=>service.setup(id,{...cmd,...value}))}/>}
              {dirty && <p className="sub">Bấm "Lưu và tiếp tục" trước khi đổi mục đích hoặc cách đọc.</p>}
            </section>
            {h.draft?.canUseAiAssistance && <details className="pa-fold"><summary>AI gợi ý theo bản nháp</summary><AssistancePanel key={`${story.storyId}:${story.selectedVersionId}`} actor="parent" story={story} selection={selection} snapshot={{title:form.title,content:form.content}} disabled={!canWrite} onApply={(next,ref) => { setForm(f => ({...f,...next})); setSelection(null);setReferences(v => v.some(r=>r.taskId===ref.taskId&&r.stepId===ref.stepId)?v:[...v,ref]); }} /></details>}
            {h.draft && !h.draft.canUseAiAssistance && <p className="notice">Hỗ trợ AI chưa khả dụng: {h.draft.aiUnavailableReason}</p>}
            <section className="pa-card"><fieldset className="pa-fieldset" disabled={!canWrite}><AuthoringGuides onInsert={text => setForm(f => ({ ...f,content:f.content ? `${f.content}\n\n${text}` : text }))} /></fieldset></section>
            <section className="pa-card" aria-label="Lịch sử phiên bản">
              <details><summary>Lịch sử phiên bản</summary>
                {h.versions.length === 0 && <p className="sub">Chưa có phiên bản nào. Bấm "Lưu và tiếp tục" ở bước 1 để tạo phiên bản đầu tiên.</p>}
                {h.versions.map(v => <div className="pa-ver" key={v.versionId}><span>V{v.versionNo} · {v.title}</span><button className="btn btn-g" onClick={() => void h.execute(() => service.version(story.storyId,v.versionId)).then(r => { if (r?.success) setViewVersion(r.data); })}>Xem</button><button className="btn btn-s" disabled={!canWrite || dirty} onClick={() => void h.write((id,cmd) => service.restore(id,{ ...cmd,sourceVersionId:v.versionId })).then(r => { if (r?.success) void h.load(story.storyId,true); })}>Khôi phục thành bản mới</button></div>)}
                {viewVersion && <pre className="st-content">{viewVersion.content}</pre>}
              </details>
            </section>
            {stepNav(null, 'confirm', saved || (dirty && !!form.content.trim() && canWrite && !h.busy), dirty ? 'Lưu và tiếp tục' : 'Bước tiếp theo', dirty ? saveThenNext : undefined)}
          </>}

          {active.id === 'confirm' && <section className="pa-card" aria-label="Xác nhận nội dung cho bé">
            <div className="pa-head"><h3>{step(2)}Xác nhận nội dung cho bé</h3></div>
            {h.version && <div className="pa-confirmed">
              <b>{h.version.title || 'Truyện chưa đặt tên'}</b>
              <p>{h.version.content}</p>
            </div>}
            {confirmation
              ? <>
                <p className="sub">Đã xác nhận nội dung của bản này, với các mục bạn đã tích:</p>
                {(Object.keys(CHECK_LABEL) as (keyof B.ParentChecklist)[]).map(k => <label className="pa-check" key={k}><input type="checkbox" checked={!!confirmation.checklist?.[k]} disabled readOnly />{CHECK_LABEL[k]}</label>)}
              </>
              : <>
                {!check && <p className="sub" role="status">{h.busy ? 'Đang kiểm tra nội dung…' : 'Chưa kiểm tra nội dung của bản đã lưu.'}</p>}
                {check && <>
                  {check.errors.map(e => <p className="notice err" key={e}>{e}</p>)}
                  {check.warnings.map(e => <p className="notice warn" key={e}>{e}</p>)}
                  {check.canPrepare && check.errors.length === 0 && <p className="sub">Đã kiểm tra tự động, không có lỗi.</p>}
                  <small className="sub">{COVERAGE_VI[check.coverage] ?? check.coverage}</small>
                </>}
                {check?.canPrepare && <>
                  {(Object.keys(checklist) as (keyof B.ParentChecklist)[]).map(k => <label className="pa-check" key={k}><input type="checkbox" checked={checklist[k]} disabled={!canWrite} onChange={e => setChecklist(c => ({ ...c,[k]:e.target.checked }))} />{CHECK_LABEL[k]}</label>)}
                </>}
                {check && !check.canPrepare && <p className="sub">Quay lại bước 1 để sửa nội dung rồi lưu lại, hệ thống sẽ kiểm tra lại.</p>}
                {(!check || !check.canPrepare) && <div className="pa-actions"><button className="btn btn-s" disabled={!canWrite} onClick={() => void h.write((id,cmd) => service.check(id,cmd))}>Kiểm tra lại</button></div>}
              </>}
            {stepNav('write', 'media', !!confirmation || (!!check?.canPrepare && canWrite && !!canApprove && Object.values(checklist).every(Boolean)), confirmation ? 'Bước tiếp theo' : 'Xác nhận và tiếp tục', confirmation ? undefined : confirmAndNext)}
          </section>}

          {active.id === 'media' && <>
            {confirmation && story.selectedVersionId && <ParentManualMedia key={`media:${story.storyId}:${story.selectedVersionId}`} storyId={story.storyId} versionId={story.selectedVersionId} active={mediaActive} disabled={!canWrite || !canApprove || !h.draft?.canUseAiAssistance} onGenerate={() => void h.write((id,cmd) => service.generateMedia(id,{...cmd,contentConfirmationId:confirmation.confirmationId}))} onChanged={() => { setPreview(null); void h.load(story.storyId); }}/>}
            {stepNav('confirm', 'deliver', true)}
          </>}

          {active.id === 'deliver' && <section className="pa-card" aria-label="Giao truyện cho bé">
            <div className="pa-head"><h3>{step(4)}Giao truyện cho {kidName}</h3></div>
            {confirmation && !grant && <div className="pa-step">
              <p className="sub">Chuẩn bị bản đọc từ nội dung đã xác nhận, xem trước đúng như bé sẽ thấy, rồi mới giao cho bé.</p>
              <div className="pa-actions">
                {canWrite && <button className="btn btn-s" onClick={() => { setPreview(null); void h.write((id,cmd) => service.prepare(id,{ ...cmd,contentConfirmationId:confirmation.confirmationId,segmentEnds:null })); }}>{preparation ? 'Chuẩn bị lại bản đọc' : 'Chuẩn bị bản đọc cho bé'}</button>}
                {preparation && <button className="btn btn-s" disabled={h.busy} onClick={loadPreview}>Xem trước bản của bé</button>}
              </div>
              {previewBlock}
              {preparation && preview && preview.storyVersionId === story.selectedVersionId && <div className="pa-actions"><button className="btn btn-ok" disabled={!canWrite || !canApprove || !canAssign || !preview.isReady} onClick={() => void h.write((id,cmd) => service.confirmFamily(id,{ ...cmd,preparationId:preview.preparationId }))}>Giao truyện cho bé đọc</button></div>}
            </div>}
            {grant && <div className="pa-step">
              <b>Đã giao cho {kidName} đọc.</b>
              <p className="sub">Bé đã thấy truyện này trong thư viện của bé. Muốn sửa nội dung hoặc ngừng cho bé đọc, hãy thu hồi quyền đọc.</p>
              {preparation && <div className="pa-actions"><button className="btn btn-s" disabled={h.busy} onClick={loadPreview}>Xem lại bản đã giao</button></div>}
              {previewBlock}
              <div className="pa-actions"><button className="btn btn-no" disabled={h.busy || h.uncertain || !canApprove || !canAssign} onClick={() => void h.write((id,cmd) => service.revokeFamily(id,{ ...cmd,confirmationId:grant.confirmationId }))}>Thu hồi quyền đọc của bé</button></div>
            </div>}
            <div className="pa-actions bar">
              <button className="btn btn-g" onClick={() => setStepId('media')}>Quay lại</button>
              {grant && onDone && <button className="btn btn-p push" onClick={onDone}>Về Truyện của tôi</button>}
            </div>
          </section>}
        </div>
      </div>}
    </div>
  </div></section>;
}
