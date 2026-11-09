'use client';
import { confirmDialog } from "@/app/lib/confirm";
import './authoring.css';
import '@/app/features/studio/workflow.css';
import '@/app/features/review/review-tools.css';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, FilePlus2, FileText, Lock, RefreshCw, Send, ShieldCheck, Undo2, Upload, UserRoundPen, Download } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import StepDone from '@/app/features/studio/StepDone';
import type * as B from '@/app/types/backendContracts';
import { parentAuthoringService as service } from '@/app/services/parentAuthoringService';
import { useParentAuthoring } from './useParentAuthoring';
import AssistancePanel from "./AssistancePanel";
import AuthoringGuides from './AuthoringGuides';
import ParentSetupPanel from './ParentSetupPanel';
import { parseStoryFile, downloadStoryTemplate } from './parseStoryFile';
import ParentManualMedia from './ParentManualMedia';
import FamilyMediaPreview from './FamilyMediaPreview';
import StoryFields from './StoryFields';
import ReadabilityHints from './ReadabilityHints';
import { useWorkspaceData } from '@/app/context/WorkspaceDataContext';
import { useRiseIn } from '@/app/lib/motion';
import { useMyRole } from '@/app/features/children/useMyRole';
import type {AssistanceSelection} from '@/app/features/story-workflow/assistanceSelection';
type StepId = 'write' | 'confirm' | 'media' | 'deliver';
const CHECK_LABEL: Record<keyof B.ParentChecklist, string> = { intendedMeaning: 'Đúng ý định của tôi', suitableForChild: 'Phù hợp với bé', privacyChecked: 'Đã kiểm tra thông tin riêng tư', endingChecked: 'Đã đọc phần kết' };
/** Backend trả câu mô tả phạm vi kiểm tra bằng tiếng Anh; câu đã biết thì dịch, câu lạ giữ nguyên. */
const COVERAGE_VI: Record<string, string> = {
  'Technical limits, configured keywords in title/body and body readability only; no semantic safety assessment or AI.':
    'Chỉ kiểm tra giới hạn kỹ thuật, từ khóa cấm đã cấu hình ở tiêu đề và nội dung, và độ dễ đọc của nội dung. Không đánh giá an toàn theo ngữ nghĩa và không dùng AI, nên bạn vẫn cần tự đọc lại.',
};
/** Mã lỗi/cảnh báo của bước kiểm tra tự động đổi sang câu tiếng Việt nói rõ lỗi gì và cần làm gì. Mã lạ giữ nguyên. */
const ISSUE_VI: Record<string, string> = {
  SAFETY_MODERATION_REQUIRED: 'Truyện đang chờ kiểm duyệt an toàn. Đợi kiểm duyệt viên xử lý xong rồi kiểm tra lại.',
  CHILD_CONTEXT_SETUP_REQUIRED: 'Ngôn ngữ hoặc độ tuổi của truyện không khớp hồ sơ bé. Hãy cập nhật hồ sơ bé hoặc thiết lập lại truyện.',
  TITLE_REQUIRED: 'Truyện chưa có tiêu đề. Hãy nhập tiêu đề rồi lưu.',
  CONTENT_REQUIRED: 'Truyện chưa có nội dung. Hãy viết nội dung rồi lưu.',
  SAFETY_POLICY_REQUIRED: 'Bé chưa có chính sách an toàn. Hãy thiết lập chính sách cho bé trước.',
  STORY_LENGTH_POLICY_INVALID: 'Giới hạn độ dài truyện trong chính sách của bé chưa hợp lệ. Hãy kiểm tra lại chính sách.',
  STORY_TOO_LONG: 'Truyện dài hơn giới hạn cho phép của bé. Hãy rút gọn nội dung.',
  SEMANTIC_SAFETY_REVIEW_REQUIRED: 'Chính sách của bé yêu cầu điểm an toàn theo ý nghĩa, nhưng bước kiểm tra tự động chưa chấm được. Hãy tự đọc kỹ truyện hoặc bỏ yêu cầu điểm an toàn trong chính sách.',
  READABILITY_POLICY_INVALID: 'Ngưỡng độ dễ đọc trong chính sách của bé chưa hợp lệ. Hãy kiểm tra lại chính sách.',
  READABILITY_POLICY_NOT_MET: 'Truyện chưa đủ dễ đọc theo mức đọc của bé. Hãy dùng câu ngắn và từ đơn giản hơn.',
  UNFILLED_PLACEHOLDER: 'Còn chỗ trống chưa điền (dấu ___ hoặc {{ }}). Hãy điền hoặc xoá.',
};
function issueText(code: string) {
  const [key, detail] = code.split(':');
  if (key === 'BLOCKED_CATEGORY') return `Nội dung chứa chủ đề bị chặn${detail ? ` (${detail})` : ''}. Hãy sửa hoặc bỏ phần đó.`;
  if (key === 'POLICY_REVIEW_REQUIRED') return `Nội dung có chủ đề cần bạn xem xét${detail ? ` (${detail})` : ''}. Hãy đọc lại kỹ trước khi tiếp tục.`;
  return ISSUE_VI[key] ?? code;
}
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
  // Huỷ hộp đặt tên: đang có bản nháp thì chỉ đóng hộp; chưa có thì không còn gì để soạn nên về "Truyện của tôi".
  const cancelNaming = () => { if (story) setNaming(false); else onDone?.(); };
  const downloadTemplate = () => downloadStoryTemplate();
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [checklist, setChecklist] = useState<B.ParentChecklist>({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false });
  const [preview, setPreview] = useState<B.ParentPreparationDto | null>(null);
  const [viewVersion, setViewVersion] = useState<B.CreatorVersionDto | null>(null);
  const [stepId, setStepId] = useState<StepId>('write');
  // Đổi bước thì các khung của bước mới hiện lần lượt.
  const stageRef = useRiseIn<HTMLDivElement>('.pa-card, .pa-fold', [stepId, h.draft?.story.storyId ?? 0], { delay: 50, distance: 10 });
  // Chỉ nạp lại biểu mẫu khi đổi phiên bản; đổi tiêu đề truyện không được xoá nội dung đang soạn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setReferences([]); setForm(h.version ? { title:h.version.title,content:h.version.content,sourceDeclaration:h.version.sourceDeclaration,rightsDeclaration:h.version.rightsDeclaration } : { ...empty, title: h.draft?.story.title ?? '' }); setPreview(null); setChecklist({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false }); }, [h.version]);
  const story = h.draft?.story;
  const storyKey = story?.storyId ?? null;
  useEffect(() => { setStepId('write'); }, [storyKey]);
  // Tải tệp .txt/.docx: máy chủ đọc chữ trong tệp, rồi tách các dòng "Tên truyện:", "Nguồn nội dung:", "Cam kết quyền sử dụng:", "Nội dung:" vào từng ô để xem và sửa; chỉ lưu khi bấm "Lưu và tiếp tục".
  const loadFile = async (file: File) => {
    if (!story || reading) return;
    if (form.content.trim() && !await confirmDialog('Nội dung tệp sẽ thay phần đang soạn. Tiếp tục?')) return;
    setReading(true); h.setNote('');
    const body = new FormData();
    body.append('File', file); body.append('RevisionToken', story.revisionToken); body.append('OperationId', crypto.randomUUID());
    const r = await service.previewFile(story.storyId, body);
    setReading(false);
    if (!r.success || !r.data) { h.setNote(r.message || 'Chưa đọc được tệp này.'); return; }
    const f = parseStoryFile(r.data.content);
    setForm(prev => ({
      title: f.title || (prev.title.trim() ? prev.title : file.name.replace(/\.[^.]+$/, '')),
      content: f.content ?? prev.content,
      sourceDeclaration: f.sourceDeclaration || prev.sourceDeclaration,
      rightsDeclaration: f.rightsDeclaration || prev.rightsDeclaration,
    }));
    h.setNote('Đã điền thông tin từ tệp vào các ô. Đọc lại, sửa nếu cần rồi bấm "Lưu và tiếp tục".');
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
    {prev && <button className="btn btn-g" onClick={() => setStepId(prev)}><ArrowLeft className="ic" />Quay lại</button>}
    {next && <button className="btn btn-p push" disabled={!nextOk} onClick={() => void (onNext ? onNext() : setStepId(next))}>{label}<ArrowRight className="ic" /></button>}
  </div>;
  // Bước 1: chưa lưu thì nút tiếp theo tự lưu phiên bản rồi mới sang bước Kiểm tra.
  const loadPreview = () => { if (!story || !preparation) return; setPreview(null); void h.execute(() => service.preview(story.storyId, preparation.preparationId)).then(r => { if (r?.success) setPreview(r.data); }); };
  const previewBlock = story && preparation && preview && preview.storyVersionId === story.selectedVersionId && <div className="pa-confirmed">
    <b>{preview.title}</b>
    {preview.segments.map(s => <p key={s.order}>{s.text}</p>)}
    <FamilyMediaPreview preparation={preview}/>
    {preview.missingRequirements.length > 0 && <ul className="pa-issues">{preview.missingRequirements.map(r => <li className="warn" key={r}>{r}</li>)}</ul>}
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
        {story && <button className="btn btn-s" disabled={h.busy || h.uncertain || !canAssign} onClick={async () => { if (!dirty || await confirmDialog('Bỏ thay đổi chưa lưu để tạo bản nháp mới?')) setNaming(true); }}><FilePlus2 className="ic" />Bản nháp mới</button>}
      </div>

      {naming && <Dialog title={`Tạo bản nháp cho ${kidName}`} onClose={cancelNaming}>
        <form className="ce-create" onSubmit={async e => { e.preventDefault(); if (await h.create(title.trim() || 'Truyện của gia đình')) setNaming(false); }}>
          <label className="field"><span className="lbl">Tên bản nháp</span><input className="inp" autoFocus maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>
          {h.note && <p className="notice" role="status">{h.note}</p>}
          <div className="ce-create-actions">
            <button type="button" className="btn btn-g" disabled={!story && !onDone} onClick={cancelNaming}>Huỷ</button>
            <button type="submit" className="btn btn-p" disabled={h.busy || h.uncertain || !canAssign || !title.trim()}><FilePlus2 className="ic" />Tạo bản nháp</button>
          </div>
        </form>
      </Dialog>}

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

        <div className="pa-stage" ref={stageRef}>
          {active.id === 'write' && <>
            <section className="pa-card" aria-label="Soạn nội dung">
              <div className="pa-head">
                <h3>{step(1)}Soạn nội dung</h3>
                {h.draft && <span className="pa-for" title="Bản nháp này được tạo cho bé này và sẽ giao cho bé này">Dành cho: <b>{kids.find(k => k.id === h.draft!.childProfileId)?.nickname ?? `bé #${h.draft.childProfileId}`}</b></span>}
                {h.version && <span className="pill draft">V{h.version.versionNo}</span>}
                {(dirty || !h.version) && <span className="pill wait">Chưa lưu</span>}
                {h.draft?.isReadOnly && <span className="pill draft" title="Bản này đã giao cho bé; thu hồi quyền đọc ở bước 4 trước khi sửa."><Lock className="ic" aria-hidden />Chỉ xem</span>}
                <button className="btn btn-g icon-only" disabled={h.busy || h.uncertain} onClick={() => void h.load(story.storyId)} aria-label="Đồng bộ" title="Đồng bộ quyền và trạng thái, giữ bản đang sửa"><RefreshCw className="ic" /></button>
              </div>
              {h.draft?.isReadOnly && <p className="notice warn" role="status">Bản này đã giao cho bé nên chỉ xem được. Muốn sửa, hãy thu hồi quyền đọc ở bước Chuẩn bị và giao.</p>}
              <fieldset className="pa-fieldset" disabled={!canWrite}>
                <StoryFields form={form} onChange={p => setForm(f => ({ ...f, ...p }))} onSelect={setSelection} rightsLabel="Cam kết quyền sử dụng" rightsPlaceholder="VD: Tôi là tác giả hoặc có quyền dùng nội dung này" />
                <div className="pa-actions bar">
                  <button className="btn btn-s" disabled={reading} title={'Tệp .txt hoặc .docx, mỗi dòng đầu một mục:\nTên truyện: …\nNguồn nội dung: …\nCam kết quyền sử dụng: …\nNội dung: … (phần truyện viết tiếp bên dưới)'} onClick={() => fileRef.current?.click()}><Upload className="ic" />{reading ? 'Đang đọc tệp…' : 'Nhập từ tệp'}</button>
                  <button className="btn btn-s" onClick={downloadTemplate} title="Tải tệp mẫu .txt để điền sẵn Tên truyện, Nguồn nội dung, Cam kết quyền sử dụng và Nội dung"><Download className="ic" />Tải tệp mẫu</button>
                  <input ref={fileRef} type="file" accept=".txt,.docx" hidden aria-label="Chọn tệp truyện (.txt, .docx)" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void loadFile(f); }} />
                </div>
              </fieldset>
              {h.draft && <ParentSetupPanel key={`${story.storyId}:${story.revisionToken}`} draft={h.draft} disabled={!canWrite||dirty} onSave={value=>void h.write((id,cmd)=>service.setup(id,{...cmd,...value}))}/>}
            </section>
            {h.draft?.canUseAiAssistance && <details className="pa-fold"><summary>AI gợi ý theo bản nháp</summary><AssistancePanel key={`${story.storyId}:${story.selectedVersionId}`} actor="parent" story={story} selection={selection} snapshot={{title:form.title,content:form.content}} disabled={!canWrite} onApply={(next,ref) => { setForm(f => ({...f,...next})); setSelection(null);setReferences(v => v.some(r=>r.taskId===ref.taskId&&r.stepId===ref.stepId)?v:[...v,ref]); }} /></details>}
            {h.draft && !h.draft.canUseAiAssistance && <p className="notice" role="status">Hỗ trợ AI chưa khả dụng: {h.draft.aiUnavailableReason}</p>}
            <section className="pa-card"><fieldset className="pa-fieldset" disabled={!canWrite}><AuthoringGuides onInsert={text => setForm(f => ({ ...f,content:f.content ? `${f.content}\n\n${text}` : text }))} /></fieldset></section>
            <section className="pa-card" aria-label="Lịch sử phiên bản">
              <details><summary>Lịch sử phiên bản</summary>
                {h.versions.length === 0 && <p className="sub">Chưa có phiên bản nào. Bấm "Lưu và tiếp tục" ở bước 1 để tạo phiên bản đầu tiên.</p>}
                {h.versions.map(v => <div className="pa-ver" key={v.versionId}><span>V{v.versionNo} · {v.title}</span><button className="btn btn-g icon-only" aria-label={`Xem V${v.versionNo}`} title="Xem" onClick={() => void h.execute(() => service.version(story.storyId,v.versionId)).then(r => { if (r?.success) setViewVersion(r.data); })}><Eye className="ic" /></button><button className="btn btn-s" disabled={!canWrite || dirty} onClick={async () => { if (!(await confirmDialog(`Khôi phục V${v.versionNo} thành bản mới?`))) return; void h.write((id,cmd) => service.restore(id,{ ...cmd,sourceVersionId:v.versionId })).then(r => { if (r?.success) void h.load(story.storyId,true); }); }}><Undo2 className="ic" />Khôi phục</button></div>)}
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
                <StepDone />
                {(Object.keys(CHECK_LABEL) as (keyof B.ParentChecklist)[]).map(k => <label className="pa-check" key={k}><input type="checkbox" checked={!!confirmation.checklist?.[k]} disabled readOnly />{CHECK_LABEL[k]}</label>)}
              </>
              : <>
                {!check && <p className="sub" role="status">{h.busy ? 'Đang kiểm tra nội dung…' : 'Chưa kiểm tra nội dung của bản đã lưu.'}</p>}
                {check && <>
                  {(check.errors.length > 0 || check.warnings.length > 0) && <ul className="pa-issues">
                    {check.errors.map(e => <li className="err" key={e}>{issueText(e)}</li>)}
                    {check.warnings.map(e => <li className="warn" key={e}>{issueText(e)}</li>)}
                  </ul>}
                  {check.errors.includes('READABILITY_POLICY_NOT_MET') && h.version && <ReadabilityHints content={h.version.content} />}
                  {check.canPrepare && check.errors.length === 0 && <span className="pill ok" style={{ width: 'fit-content' }}><Check className="ic" aria-hidden />Kiểm tra tự động: không có lỗi</span>}
                  <small className="sub">{COVERAGE_VI[check.coverage] ?? check.coverage}</small>
                </>}
                {check?.canPrepare && <>
                  {(Object.keys(checklist) as (keyof B.ParentChecklist)[]).map(k => <label className="pa-check" key={k}><input type="checkbox" checked={checklist[k]} disabled={!canWrite} onChange={e => setChecklist(c => ({ ...c,[k]:e.target.checked }))} />{CHECK_LABEL[k]}</label>)}
                </>}
                {check && !check.canPrepare && <p className="sub">Quay lại bước 1 để sửa nội dung rồi lưu lại, hệ thống sẽ kiểm tra lại.</p>}
                {(!check || !check.canPrepare) && <div className="pa-actions"><button className="btn btn-s" disabled={!canWrite} onClick={() => void h.write((id,cmd) => service.check(id,cmd))}><ShieldCheck className="ic" />Kiểm tra lại</button></div>}
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
                {canWrite && <button className="btn btn-s" onClick={() => { setPreview(null); void h.write((id,cmd) => service.prepare(id,{ ...cmd,contentConfirmationId:confirmation.confirmationId,segmentEnds:null })); }}><FileText className="ic" />{preparation ? 'Chuẩn bị lại' : 'Chuẩn bị bản đọc'}</button>}
                {preparation && <button className="btn btn-s" disabled={h.busy} onClick={loadPreview}><Eye className="ic" />Xem trước</button>}
              </div>
              {previewBlock}
              {preparation && preview && preview.storyVersionId === story.selectedVersionId && <div className="pa-actions"><button className="btn btn-ok" disabled={!canWrite || !canApprove || !canAssign || !preview.isReady} onClick={async () => { if (!(await confirmDialog(`Giao truyện này cho ${kidName} đọc? Sau khi giao, nội dung chỉ xem được cho tới khi bạn thu hồi.`))) return; void h.write((id,cmd) => service.confirmFamily(id,{ ...cmd,preparationId:preview.preparationId })); }}><Send className="ic" />Giao cho bé</button></div>}
            </div>}
            {grant && <div className="pa-step">
              <StepDone label={`Đã giao cho ${kidName}`} />
              <p className="sub">Muốn sửa nội dung hoặc ngừng cho bé đọc, hãy thu hồi quyền đọc.</p>
              {preparation && <div className="pa-actions"><button className="btn btn-s" disabled={h.busy} onClick={loadPreview}><Eye className="ic" />Xem lại bản đã giao</button></div>}
              {previewBlock}
              <div className="pa-actions"><button className="btn btn-no" disabled={h.busy || h.uncertain || !canApprove || !canAssign} onClick={async () => { if (!(await confirmDialog(`Thu hồi quyền đọc của ${kidName}? Truyện sẽ biến mất khỏi thư viện của bé cho tới khi bạn giao lại.`))) return; void h.write((id,cmd) => service.revokeFamily(id,{ ...cmd,confirmationId:grant.confirmationId })); }}><Undo2 className="ic" />Thu hồi quyền đọc</button></div>
            </div>}
            <div className="pa-actions bar">
              <button className="btn btn-g" onClick={() => setStepId('media')}><ArrowLeft className="ic" />Quay lại</button>
              {grant && onDone && <button className="btn btn-p push" onClick={onDone}>Về Truyện của tôi<ArrowRight className="ic" /></button>}
            </div>
          </section>}
        </div>
      </div>}
    </div>
  </div></section>;
}
