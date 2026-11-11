'use client';
import { confirmDialog } from "@/app/lib/confirm";
import './authoring.css';
import '@/app/features/studio/workflow.css';
import '@/app/features/review/review-tools.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ClipboardPaste, Users, Eye, FilePlus2, FileText, Lock, LockOpen, RefreshCw, Send, ShieldCheck, Undo2, Upload, UserRoundPen, Download } from 'lucide-react';
import InfoTip from "@/app/components/InfoTip";
import Dialog from '@/app/components/Dialog';
import StepDone from '@/app/features/studio/StepDone';
import type * as B from '@/app/types/backendContracts';
import type { ApiResponse } from '@/app/types/auth';
import { parentAuthoringService as service } from '@/app/services/parentAuthoringService';
import { useParentAuthoring } from './useParentAuthoring';
import AssistancePanel from "./AssistancePanel";
import AuthoringGuides from './AuthoringGuides';
import ParentSetupPanel from './ParentSetupPanel';
import { downloadStoryTemplate, type StoryFileFields } from './parseStoryFile';
import ParentImportPreview, { type ParentImportPending } from './ParentImportPreview';
import { showToast } from '@/app/lib/toast';
import ParentManualMedia from './ParentManualMedia';
import FamilyPackages, { packageProgress, packagesBusy } from './FamilyPackages';
import { StepRail, StepReview, stepRail } from '@/app/features/story-workflow/StepRail';
import { parentPackageService, type ParentPackage } from '@/app/services/parentPackageService';
import FamilyMediaPreview from './FamilyMediaPreview';
import StoryFields from './StoryFields';
import ReadabilityHints, { SentenceEndHint } from './ReadabilityHints';
import { issueText } from './issueText';
import { useWorkspaceData } from '@/app/context/WorkspaceDataContext';
import { useRiseIn } from '@/app/lib/motion';
import { useMyRole } from '@/app/features/children/useMyRole';
import type {AssistanceSelection} from '@/app/features/story-workflow/assistanceSelection';
type StepId = 'write' | 'confirm' | 'media' | 'deliver' | 'packages' | 'pk-make' | 'pk-send';
/** Các bước của cách nhiều bé cùng dùng khung "Gói cho từng bé". */
const PACKAGE_STEPS: StepId[] = ['packages', 'pk-make', 'pk-send'];
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
  // Huỷ hộp đặt tên: đang có bản nháp thì chỉ đóng hộp; chưa có thì không còn gì để soạn nên về "Truyện của tôi".
  const cancelNaming = () => { if (story) setNaming(false); else onDone?.(); };
  const downloadTemplate = () => downloadStoryTemplate();
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [checklist, setChecklist] = useState<B.ParentChecklist>({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false });
  const [preview, setPreview] = useState<B.ParentPreparationDto | null>(null);
  const [viewVersion, setViewVersion] = useState<B.CreatorVersionDto | null>(null);
  const [stepId, setStepId] = useState<StepId | null>(null);
  const [viewId, setViewId] = useState<StepId | null>(null);
  // Đổi bước thì các khung của bước mới hiện lần lượt.
  const stageRef = useRiseIn<HTMLDivElement>('.pa-card, .pa-fold', [stepId, h.draft?.story.storyId ?? 0], { delay: 50, distance: 10 });
  // Chỉ nạp lại biểu mẫu khi đổi phiên bản; đổi tiêu đề truyện không được xoá nội dung đang soạn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setReferences([]); setForm(h.version ? { title:h.version.title,content:h.version.content,sourceDeclaration:h.version.sourceDeclaration,rightsDeclaration:h.version.rightsDeclaration } : { ...empty, title: h.draft?.story.title ?? '' }); setPreview(null); setChecklist({ intendedMeaning:false,suitableForChild:false,privacyChecked:false,endingChecked:false }); }, [h.version]);
  const story = h.draft?.story;
  const storyKey = story?.storyId ?? null;
  // Mở truyện thì vào bước đang dở (theo tiến độ), không quay về bước 1.
  useEffect(() => { setStepId(null); setViewId(null); }, [storyKey]);
  // Giao cho nhiều bé (gói riêng từng bé). Truyện đã có gói thì luôn ở cách này, không trộn với cách giao một bé.
  const [multi, setMulti] = useState(false);
  const [hasPackages, setHasPackages] = useState(false);
  const [pkList, setPkList] = useState<ParentPackage[]>([]);
  // Tạo gói xong thì truyện ở hẳn cách nhiều bé.
  const onPkList = useCallback((l: ParentPackage[]) => { setPkList(l); if (l.length) setHasPackages(true); }, []);
  useEffect(() => {
    setMulti(false); setHasPackages(false); setPkList([]);
    if (storyKey === null) return;
    let alive = true;
    void parentPackageService.list(storyKey).then(r => { if (alive && r.success && (r.data?.length ?? 0) > 0) { setHasPackages(true); setMulti(true); setPkList(r.data!); } });
    return () => { alive = false; };
  }, [storyKey]);
  // Nhập nội dung (tệp .txt/.docx hoặc văn bản dán): máy chủ xem trước (chưa lưu), rồi popup cho xem nội dung đã tách và
  // "Xác nhận nhập" (tạo phiên bản mới) hoặc "Sửa trước" (điền vào các ô, lưu sau). Token và phiên bản gốc chụp lúc xem trước.
  const [importing, setImporting] = useState<ParentImportPending | null>(null);
  const loadFile = async (file: File) => {
    if (!story || reading) return;
    if (file.size > 5_000_000) { showToast('Tệp tối đa 5 MB.', 'warn'); return; }
    setReading(true);
    const body = new FormData();
    body.append('File', file); body.append('RevisionToken', story.revisionToken); body.append('OperationId', crypto.randomUUID());
    const snap = { revisionToken: story.revisionToken, baseVersionId: story.selectedVersionId };
    const r = await service.previewFile(story.storyId, body);
    setReading(false);
    if (!r.success || !r.data) { showToast(r.message || 'Chưa đọc được tệp này.', 'err'); return; }
    setImporting({ preview: r.data, ...snap, fallbackTitle: file.name.replace(/\.[^.]+$/, '') });
  };
  // Tách các dòng "Tên truyện:", "Nguồn nội dung:", "Cam kết quyền sử dụng:", "Nội dung:" (nếu có) vào từng ô; không có thì cả bài là nội dung.
  const fillFrom = (f: StoryFileFields, fallbackTitle = '') => {
    setForm(prev => ({
      title: f.title || (prev.title.trim() ? prev.title : fallbackTitle),
      content: f.content ?? prev.content,
      sourceDeclaration: f.sourceDeclaration || prev.sourceDeclaration,
      rightsDeclaration: f.rightsDeclaration || prev.rightsDeclaration,
    }));
  };
  // "Sửa trước": điền vào các ô, chưa lưu cho tới khi bấm "Lưu và tiếp tục".
  const fillImport = async (f: StoryFileFields) => {
    if (!importing) return;
    if (form.content.trim() && !await confirmDialog('Nội dung nhập sẽ thay phần đang soạn. Tiếp tục?')) return;
    fillFrom(f, importing.fallbackTitle); setImporting(null);
    showToast('Đã điền vào các ô. Đọc lại rồi bấm "Lưu và tiếp tục".', 'info');
  };
  // "Xác nhận nhập" thành công: máy chủ đã tạo phiên bản mới, tải lại để biểu mẫu hiện đúng bản đó.
  const importSaved = (saved: B.CreatorContentSavedDto) => { setImporting(null); void h.load(saved.story.storyId, true); };
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const loadPaste = async () => {
    if (!story || reading || !pasteText.trim()) return;
    setReading(true);
    const snap = { revisionToken: story.revisionToken, baseVersionId: story.selectedVersionId };
    const r = await service.previewImport(story.storyId, { operationId: crypto.randomUUID(), revisionToken: snap.revisionToken, content: pasteText });
    setReading(false);
    if (!r.success || !r.data) { showToast(r.message || 'Chưa đọc được văn bản này.', 'err'); return; }
    setPasting(false); setPasteText('');
    setImporting({ preview: r.data, ...snap, fallbackTitle: '' });
  };
  const dirty = !!story && (form.title !== (h.version?.title ?? '') || form.content !== (h.version?.content ?? '') || form.sourceDeclaration !== (h.version?.sourceDeclaration ?? '') || form.rightsDeclaration !== (h.version?.rightsDeclaration ?? ''));
  const check = resultOf<B.ParentCheckDto>(h.workflow,'Check',story?.selectedVersionId ?? null);
  const confirmation = resultOf<B.ParentContentConfirmationDto>(h.workflow,'ContentConfirmation',story?.selectedVersionId ?? null);
  const preparation = resultOf<B.ParentPreparationDto>(h.workflow,'Preparation',story?.selectedVersionId ?? null);
  const mediaActive = !!resultOf(h.workflow,'MediaGeneration',story?.selectedVersionId ?? null);
  const grant = (h.workflow.find(o => o.kind === 'FamilyConfirmation' && !o.revokedAt)?.result ?? null) as B.ParentFamilyConfirmationDto | null;
  const canWrite = !h.draft?.isReadOnly && !h.busy && !h.uncertain;
  // Khoá vì đã chốt nội dung để tạo gói (không phải vì đã giao cho bé).
  const finalized = h.draft?.readOnlyReason === 'PARENT_STORY_FINALIZED';
  // Bản giao nhiều bé đang khoá (đã chốt nội dung hoặc đã giao) thì mở lại được ngay tại đây.
  const reopenable = finalized || (!!h.draft?.isReadOnly && hasPackages);
  /** Mở lại nội dung để sửa: thu hồi quyền đọc của các bé (nếu đã giao) rồi mở khoá; các gói cũ không dùng được nữa. */
  const reopenContent = async () => {
    if (!story) return;
    const id = story.storyId;
    const grants = h.workflow.filter(o => o.kind === 'FamilyConfirmation' && !o.revokedAt).map(o => o.result as B.ParentFamilyConfirmationDto).filter(Boolean);
    const names = grants.map(g => kids.find(k => k.id === g.childProfileId)?.nickname ?? `bé #${g.childProfileId}`).join(', ');
    const ask = grants.length
      ? `Truyện đang giao cho ${names}. Mở lại sẽ thu hồi quyền đọc của bé và các gói hiện có không dùng được nữa. Sửa xong, bạn tạo gói và giao lại. Tiếp tục?`
      : 'Mở lại để sửa nội dung? Các gói hiện có sẽ không dùng được nữa. Sửa xong, bạn tạo gói mới cho các bé.';
    if (!(await confirmDialog(ask))) return;
    // Mỗi lệnh dùng token mới nhất của bản nháp (thu hồi và mở lại đều có thể đổi token).
    const r = await h.execute(async (): Promise<ApiResponse<unknown>> => {
      const fresh = async () => { const d = await service.get(id); return d.success && d.data ? { ok: true as const, cmd: { operationId: crypto.randomUUID(), revisionToken: d.data.story.revisionToken, baseVersionId: d.data.story.selectedVersionId } } : { ok: false as const, res: d }; };
      for (const g of grants) {
        const f = await fresh(); if (!f.ok) return f.res;
        const x = await service.revokeFamily(id, { ...f.cmd, confirmationId: g.confirmationId } as B.ParentFamilyRevokeRequest); if (!x.success) return x;
      }
      const f = await fresh(); if (!f.ok) return f.res;
      return parentPackageService.reopen(id, f.cmd);
    });
    if (r?.success) { await h.load(id, true); h.setNote('Đã mở lại. Bạn sửa nội dung rồi lưu, sau đó tạo gói mới cho các bé.'); setStepId('write'); }
  };
  const AI_REASON: Record<string, string> = { PARENT_STORY_FINALIZED: 'nội dung đã chốt để tạo gói cho các bé.', TARGET_CHILD_REQUIRED: 'hãy chọn bé để AI gợi ý theo hồ sơ của bé.', RECIPIENT_SELECTION_REQUIRED: 'hãy chọn bé nhận truyện trước.' };
  const saved = !dirty && !!story?.selectedVersionId && h.version?.versionId === story.selectedVersionId;
  const canApprove = role?.can('ApproveStory'); const canAssign = role?.can('AssignActivity');
  const step = (n: number) => <span className="pa-num">{n}</span>;
  // Các bước của luồng soạn truyện; bước sau chỉ mở khi bước trước đã xong.
  const writeStep = { id: 'write' as StepId, label: 'Soạn nội dung', note: dirty ? 'Có thay đổi chưa lưu' : saved ? 'Đã lưu' : 'Chưa lưu', done: saved, locked: false };
  const pk = packageProgress(pkList, h.workflow);
  // Gói đang kiểm tra / tạo học liệu: khoá chuyển bước, mở lại và bản nháp mới.
  const pkBusy = multi && packagesBusy(pkList);
  // Cách nhiều bé: ba bước sau cùng nằm trong khung "Gói cho từng bé", bấm bước nào thì cuộn tới phần đó.
  const steps: { id: StepId; label: string; note: string; done: boolean; locked: boolean }[] = multi ? [
    writeStep,
    { id: 'packages', label: 'Chọn bé', note: pk.total ? `${pk.total} bé nhận truyện` : !saved ? 'Lưu nội dung trước' : 'Chưa chọn bé', done: pk.total > 0, locked: !saved && !hasPackages },
    { id: 'pk-make', label: 'Tạo học liệu', note: !pk.total ? 'Chọn bé trước' : pk.prepared === pk.total ? 'Đã xong' : `Xong ${pk.prepared}/${pk.total} bé`, done: pk.total > 0 && pk.prepared === pk.total, locked: !pk.total },
    { id: 'pk-send', label: 'Chốt và giao', note: !pk.total ? 'Chọn bé trước' : pk.delivered === pk.total ? 'Đã giao cho các bé' : `Đã giao ${pk.delivered}/${pk.total} bé`, done: pk.total > 0 && pk.delivered === pk.total, locked: !pk.total },
  ] : [
    writeStep,
    { id: 'confirm', label: 'Xác nhận cho bé', note: confirmation ? 'Đã xác nhận' : !saved ? 'Lưu nội dung trước' : check && !check.canPrepare ? 'Cần sửa nội dung' : 'Chưa xác nhận', done: !!confirmation, locked: !saved },
    { id: 'media', label: 'Tranh và giọng đọc', note: mediaActive ? 'Đang tạo hoặc đã tạo' : 'Tùy chọn', done: mediaActive, locked: !saved || !confirmation },
    { id: 'deliver', label: 'Chuẩn bị và giao', note: grant ? 'Đã giao cho bé' : preparation ? 'Đã chuẩn bị' : 'Chưa giao', done: !!grant, locked: !saved || !confirmation },
  ];
  // Cột bước: chỉ mở bước đã qua; bấm bước cũ thì chỉ xem, sửa phải bấm Quay lại.
  const rail = stepRail(steps, stepId, viewId, setViewId);
  const active = rail.active;
  const inPackages = PACKAGE_STEPS.includes(active.id);
  // Bấm bước 3 hoặc 4 của cách nhiều bé: cuộn tới thẻ gói hoặc phần giao.
  useEffect(() => {
    const target = active.id === 'pk-make' ? '.fp-card' : active.id === 'pk-send' ? '.fp-deliver, .fp-foot' : null;
    if (target) stageRef.current?.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active.id, stageRef]);
  // Vào bước Xác nhận mà bản đã lưu chưa được kiểm tra thì tự kiểm tra (mỗi phiên bản một lần; lỗi thì có nút "Kiểm tra lại").
  const autoChecked = useRef<number | null>(null);
  const versionId = story?.selectedVersionId ?? null;
  useEffect(() => {
    if (active.id !== 'confirm' || rail.reviewing || !saved || check || confirmation || !canWrite || versionId === null || autoChecked.current === versionId) return;
    autoChecked.current = versionId;
    void h.write((id, cmd) => service.check(id, cmd));
  });
  const stepNav = (prev: StepId | null, next: StepId | null, nextOk: boolean, label = 'Bước tiếp theo', onNext?: () => void | Promise<void>) => <div className="pa-actions bar">
    {prev && <button className="btn btn-g" disabled={pkBusy} onClick={() => setStepId(prev)}><ArrowLeft className="ic" />Quay lại</button>}
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
  const nextAfterWrite: StepId = multi ? 'packages' : 'confirm';
  const saveThenNext = async () => { if (await h.save({ ...form, assistanceReferences: references })) setStepId(nextAfterWrite); };
  return <section className="ws dock" style={{ gridTemplateColumns:'1fr' }}><div className="pane st-page">
    <div className="st-body pa-body">
      {h.note && <p className="notice" role="status">{h.note}</p>}
      {h.uncertain && <p className="notice warn">Chưa rõ máy chủ đã nhận lệnh. Không tạo thao tác mới. <button className="btn btn-s" disabled={h.busy} onClick={() => void h.retry()}>Thử lại</button></p>}

      {/* Bé đang soạn cho, và nút tạo bản nháp khác; bản nháp đã có mở từ trang "Truyện của tôi". */}
      <div className="pa-top">
        <span className="pa-kid"><ShieldCheck className="ic" aria-hidden />Soạn cho {kidName}{onChangeKid && <button className="btn btn-g pa-kid-change" onClick={onChangeKid} title="Đổi bé" aria-label={`Đổi bé, đang soạn cho ${kidName}`}><UserRoundPen className="ic" /></button>}</span>
        {story && <button className="btn btn-s" disabled={h.busy || h.uncertain || !canAssign || pkBusy} onClick={async () => { if (!dirty || await confirmDialog('Bỏ thay đổi chưa lưu để tạo bản nháp mới?')) setNaming(true); }}><FilePlus2 className="ic" />Bản nháp mới</button>}
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
        <StepRail steps={steps} rail={rail} frozen={pkBusy} />

        <div className="pa-stage" ref={stageRef}>
          <StepReview rail={rail} onEdit={setStepId}>
          {active.id === 'write' && <>
            <section className="pa-card" aria-label="Soạn nội dung">
              <div className="pa-head">
                <h3>{step(1)}Soạn nội dung</h3>
                {h.draft && <span className="pa-for" title={h.draft.childProfileId ? 'Bản nháp này được tạo cho bé này' : 'Bản nháp giao cho nhiều bé, mỗi bé một gói riêng'}>Dành cho: <b>{h.draft.childProfileId ? kids.find(k => k.id === h.draft!.childProfileId)?.nickname ?? `bé #${h.draft.childProfileId}` : 'nhiều bé'}</b></span>}
                {h.version && <span className="pill draft">V{h.version.versionNo}</span>}
                {(dirty || !h.version) && <span className="pill wait">Chưa lưu</span>}
                {h.draft?.isReadOnly && <span className="pill draft" title={reopenable ? 'Nội dung đã chốt để tạo gói; bấm Mở lại để sửa.' : 'Bản này đã giao cho bé; thu hồi quyền đọc ở bước 4 trước khi sửa.'}><Lock className="ic" aria-hidden />Chỉ xem</span>}
                {reopenable && <button className="btn btn-s pa-reopen" disabled={h.busy || h.uncertain || !canApprove || !canAssign || pkBusy} onClick={() => void reopenContent()}><LockOpen className="ic" />Mở lại để sửa</button>}
                <button className="btn btn-g icon-only" disabled={h.busy || h.uncertain} onClick={() => void h.load(story.storyId)} aria-label="Đồng bộ" title="Đồng bộ quyền và trạng thái, giữ bản đang sửa"><RefreshCw className="ic" /></button>
              </div>
              {h.draft?.isReadOnly && <p className="notice warn" role="status">{reopenable ? 'Nội dung đã chốt để tạo gói cho các bé nên chỉ xem được. Muốn sửa, bấm "Mở lại để sửa".' : 'Bản này đã giao cho bé nên chỉ xem được. Muốn sửa, hãy thu hồi quyền đọc ở bước Chuẩn bị và giao.'}</p>}
              <fieldset className="pa-fieldset" disabled={!canWrite}>
                <StoryFields form={form} onChange={p => setForm(f => ({ ...f, ...p }))} onSelect={setSelection} rightsLabel="Cam kết quyền sử dụng" rightsPlaceholder="VD: Tôi là tác giả hoặc có quyền dùng nội dung này" />
                <SentenceEndHint content={form.content} onFix={content => setForm(f => ({ ...f, content }))} />
                <div className="pa-actions bar">
                  <button className="btn btn-s" disabled={reading} title={'Tệp .txt hoặc .docx, mỗi dòng đầu một mục:\nTên truyện: …\nNguồn nội dung: …\nCam kết quyền sử dụng: …\nNội dung: … (phần truyện viết tiếp bên dưới)'} onClick={() => fileRef.current?.click()}><Upload className="ic" />{reading ? 'Đang đọc tệp…' : 'Nhập từ tệp'}</button>
                  <button className="btn btn-s" disabled={reading} onClick={() => setPasting(true)} title="Dán cả bài; nếu bài theo mẫu (Tên truyện:, Nguồn nội dung:, …) thì tự tách vào từng ô"><ClipboardPaste className="ic" />Dán văn bản</button>
                  <button className="btn btn-s" onClick={downloadTemplate} title="Tải tệp mẫu .txt để điền sẵn Tên truyện, Nguồn nội dung, Cam kết quyền sử dụng và Nội dung"><Download className="ic" />Tải tệp mẫu</button>
                  <input ref={fileRef} type="file" accept=".txt,.docx" hidden aria-label="Chọn tệp truyện (.txt, .docx)" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void loadFile(f); }} />
                </div>
              </fieldset>
              {pasting && <Dialog title="Dán văn bản" onClose={() => setPasting(false)} wide>
                <label className="field"><span className="lbl">Nội dung <InfoTip text="Dán cả bài. Nếu bài theo tệp mẫu (Tên truyện:, Nguồn nội dung:, Cam kết quyền sử dụng:, Nội dung:) thì sẽ tự tách vào từng ô." /></span>
                  <textarea className="inp" rows={12} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Dán truyện vào đây" autoFocus /></label>
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-g" onClick={() => setPasting(false)}>Hủy</button>
                  <button className="btn btn-p" disabled={reading || !pasteText.trim()} onClick={() => void loadPaste()}><Eye className="ic" />{reading ? 'Đang đọc…' : 'Xem trước'}</button>
                </div>
              </Dialog>}
              {importing && <ParentImportPreview key={importing.preview.previewToken} storyId={story.storyId} pending={importing}
                defaults={{ title: form.title, sourceDeclaration: form.sourceDeclaration, rightsDeclaration: form.rightsDeclaration }}
                beforeConfirm={async () => !dirty || await confirmDialog('Phần đang soạn chưa lưu sẽ được thay bằng nội dung nhập. Tiếp tục?')}
                onFill={f => void fillImport(f)} onSaved={importSaved}
                onConflict={() => { setImporting(null); void h.load(story.storyId); }} onClose={() => setImporting(null)} />}
              {h.draft && <ParentSetupPanel key={`${story.storyId}:${story.revisionToken}`} draft={h.draft} disabled={!canWrite||dirty} onSave={value=>void h.write((id,cmd)=>service.setup(id,{...cmd,...value}))}/>}
            </section>
            {h.draft?.canUseAiAssistance && <details className="pa-fold"><summary>AI gợi ý theo bản nháp</summary><AssistancePanel key={`${story.storyId}:${story.selectedVersionId}`} actor="parent" story={story} selection={selection} snapshot={{title:form.title,content:form.content}} disabled={!canWrite} onApply={(next,ref) => { setForm(f => ({...f,...next})); setSelection(null);setReferences(v => v.some(r=>r.taskId===ref.taskId&&r.stepId===ref.stepId)?v:[...v,ref]); }} /></details>}
            {h.draft && !h.draft.canUseAiAssistance && !finalized && <p className="notice" role="status">Hỗ trợ AI chưa khả dụng: {AI_REASON[h.draft.aiUnavailableReason ?? ''] ?? h.draft.aiUnavailableReason}</p>}
            <section className="pa-card"><fieldset className="pa-fieldset" disabled={!canWrite}><AuthoringGuides onInsert={text => setForm(f => ({ ...f,content:f.content ? `${f.content}\n\n${text}` : text }))} /></fieldset></section>
            <section className="pa-card" aria-label="Lịch sử phiên bản">
              <details><summary>Lịch sử phiên bản</summary>
                {h.versions.length === 0 && <p className="empty-line">Chưa có phiên bản nào. Lưu ở bước 1 để tạo bản đầu tiên.</p>}
                {h.versions.map(v => <div className="pa-ver" key={v.versionId}><span>V{v.versionNo} · {v.title}</span><button className="btn btn-g icon-only" aria-label={`Xem V${v.versionNo}`} title="Xem" onClick={() => void h.execute(() => service.version(story.storyId,v.versionId)).then(r => { if (r?.success) setViewVersion(r.data); })}><Eye className="ic" /></button><button className="btn btn-s" disabled={!canWrite || dirty} onClick={async () => { if (!(await confirmDialog(`Khôi phục V${v.versionNo} thành bản mới?`))) return; void h.write((id,cmd) => service.restore(id,{ ...cmd,sourceVersionId:v.versionId })).then(r => { if (r?.success) void h.load(story.storyId,true); }); }}><Undo2 className="ic" />Khôi phục</button></div>)}
                {viewVersion && <pre className="st-content">{viewVersion.content}</pre>}
              </details>
            </section>
            {stepNav(null, nextAfterWrite, saved || (dirty && !!form.content.trim() && canWrite && !h.busy), dirty ? 'Lưu và tiếp tục' : 'Bước tiếp theo', dirty ? saveThenNext : undefined)}
          </>}

          {active.id === 'confirm' && <section className="pa-card" aria-label="Xác nhận nội dung cho bé">
            <div className="pa-head"><h3>{step(2)}Xác nhận nội dung cho bé</h3>
              {!grant && <button className="btn btn-s" disabled={h.busy || h.uncertain || mediaActive} title={mediaActive ? 'Đang tạo tranh và giọng đọc, chờ xong rồi chuyển' : 'Mỗi bé có gói học liệu, tranh và giọng đọc riêng, giao nhiều bé trong một lần'} onClick={async () => {
                // Đã xác nhận theo cách một bé thì hỏi lại: cách nhiều bé kiểm tra và tạo học liệu riêng cho từng bé.
                if (confirmation && !(await confirmDialog(`Chuyển sang giao cho nhiều bé? Phần đã xác nhận cho ${kidName} không dùng ở cách này; mỗi bé được kiểm tra và tạo gói riêng.`))) return;
                setMulti(true); setStepId('packages');
              }}><Users className="ic" />Giao cho nhiều bé</button>}</div>
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
                {!check && <span className="pill wait" role="status" style={{ width: 'fit-content' }}>{h.busy ? 'Đang kiểm tra nội dung…' : 'Chưa kiểm tra bản đã lưu'}</span>}
                {check && <>
                  {(check.errors.length > 0 || check.warnings.length > 0) && <ul className="pa-issues">
                    {check.errors.map(e => <li className="err" key={e}>{issueText(e)}</li>)}
                    {check.warnings.map(e => <li className="warn" key={e}>{issueText(e)}</li>)}
                  </ul>}
                  {check.errors.includes('READABILITY_POLICY_NOT_MET') && h.version && <ReadabilityHints content={h.version.content} />}
                  {check.canPrepare && check.errors.length === 0 && <span className="pill ok" style={{ width: 'fit-content' }}><Check className="ic" aria-hidden />Kiểm tra tự động: không có lỗi</span>}
                  <span className="pill draft">{COVERAGE_VI[check.coverage] ?? check.coverage}</span>
                </>}
                {check?.canPrepare && <>
                  {(Object.keys(checklist) as (keyof B.ParentChecklist)[]).map(k => <label className="pa-check" key={k}><input type="checkbox" checked={checklist[k]} disabled={!canWrite} onChange={e => setChecklist(c => ({ ...c,[k]:e.target.checked }))} />{CHECK_LABEL[k]}</label>)}
                </>}
                {check && !check.canPrepare && <p className="notice warn">Quay lại bước 1 sửa nội dung rồi lưu, hệ thống sẽ kiểm tra lại.</p>}
                {(!check || !check.canPrepare) && <div className="pa-actions"><button className="btn btn-s" disabled={!canWrite} onClick={() => void h.write((id,cmd) => service.check(id,cmd))}><ShieldCheck className="ic" />Kiểm tra lại</button></div>}
              </>}
            {stepNav('write', 'media', !!confirmation || (!!check?.canPrepare && canWrite && !!canApprove && Object.values(checklist).every(Boolean)), confirmation ? 'Bước tiếp theo' : 'Xác nhận và tiếp tục', confirmation ? undefined : confirmAndNext)}
          </section>}

          {active.id === 'media' && <>
            {confirmation && story.selectedVersionId && <ParentManualMedia key={`media:${story.storyId}:${story.selectedVersionId}`} storyId={story.storyId} versionId={story.selectedVersionId} active={mediaActive} disabled={!canWrite || !canApprove || !h.draft?.canUseAiAssistance} onGenerate={() => void h.write((id,cmd) => service.generateMedia(id,{...cmd,contentConfirmationId:confirmation.confirmationId}))} onChanged={() => { setPreview(null); void h.load(story.storyId); }}/>}
            {stepNav('confirm', 'deliver', true)}
          </>}

          {inPackages && story.selectedVersionId && <>
            <FamilyPackages key={story.storyId} story={story} kids={kids} workflow={h.workflow} canWrite={!h.busy && !h.uncertain && !!canApprove && !!canAssign} onReload={() => h.load(story.storyId)} onReopen={reopenContent} onList={onPkList} onBack={hasPackages ? undefined : () => { setMulti(false); setStepId('confirm'); }} />
            <div className="pa-actions bar"><button className="btn btn-g" disabled={pkBusy} onClick={() => setStepId('write')}><ArrowLeft className="ic" />Quay lại</button>{grant && onDone && <button className="btn btn-p push" onClick={onDone}>Về Truyện của tôi<ArrowRight className="ic" /></button>}</div>
          </>}

          {active.id === 'deliver' && <section className="pa-card" aria-label="Giao truyện cho bé">
            <div className="pa-head"><h3>{step(4)}Giao truyện cho {kidName} <InfoTip text="Chuẩn bị bản đọc từ nội dung đã xác nhận, xem trước đúng như bé sẽ thấy, rồi mới giao cho bé." /></h3></div>
            {confirmation && !grant && <div className="pa-step">
              <div className="pa-actions">
                {canWrite && <button className="btn btn-s" onClick={() => { setPreview(null); void h.write((id,cmd) => service.prepare(id,{ ...cmd,contentConfirmationId:confirmation.confirmationId,segmentEnds:null })); }}><FileText className="ic" />{preparation ? 'Chuẩn bị lại' : 'Chuẩn bị bản đọc'}</button>}
                {preparation && <button className="btn btn-s" disabled={h.busy} onClick={loadPreview}><Eye className="ic" />Xem trước</button>}
              </div>
              {previewBlock}
              {preparation && preview && preview.storyVersionId === story.selectedVersionId && <div className="pa-actions"><button className="btn btn-ok" disabled={!canWrite || !canApprove || !canAssign || !preview.isReady} onClick={async () => { if (!(await confirmDialog(`Giao truyện này cho ${kidName} đọc? Sau khi giao, nội dung chỉ xem được cho tới khi bạn thu hồi.`))) return; void h.write((id,cmd) => service.confirmFamily(id,{ ...cmd,preparationId:preview.preparationId })); }}><Send className="ic" />Giao cho bé</button></div>}
            </div>}
            {grant && <div className="pa-step">
              <StepDone label={`Đã giao cho ${kidName}`} />
              <p className="notice">Muốn sửa nội dung hoặc ngừng cho bé đọc, hãy thu hồi quyền đọc.</p>
              {preparation && <div className="pa-actions"><button className="btn btn-s" disabled={h.busy} onClick={loadPreview}><Eye className="ic" />Xem lại bản đã giao</button></div>}
              {previewBlock}
              <div className="pa-actions"><button className="btn btn-no" disabled={h.busy || h.uncertain || !canApprove || !canAssign} onClick={async () => { if (!(await confirmDialog(`Thu hồi quyền đọc của ${kidName}? Truyện sẽ biến mất khỏi thư viện của bé cho tới khi bạn giao lại.`))) return; void h.write((id,cmd) => service.revokeFamily(id,{ ...cmd,confirmationId:grant.confirmationId })); }}><Undo2 className="ic" />Thu hồi quyền đọc</button></div>
            </div>}
            <div className="pa-actions bar">
              <button className="btn btn-g" onClick={() => setStepId('media')}><ArrowLeft className="ic" />Quay lại</button>
              {grant && onDone && <button className="btn btn-p push" onClick={onDone}>Về Truyện của tôi<ArrowRight className="ic" /></button>}
            </div>
          </section>}
          </StepReview>
        </div>
      </div>}
    </div>
  </div></section>;
}
