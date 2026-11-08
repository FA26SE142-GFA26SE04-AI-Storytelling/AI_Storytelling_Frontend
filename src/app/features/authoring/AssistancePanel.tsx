'use client';
import { useEffect, useState } from 'react';
import { Check, History, Loader2, MessageSquareText, PenLine, Plus, RefreshCw, Sparkles, TextSelect, WandSparkles, X } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import { useAssistance } from '@/app/features/story-workflow/useAssistance';
import { applyAssistancePatch } from '@/app/features/story-workflow/assistancePatch';
import { assistanceTarget, type AssistanceSelection } from '@/app/features/story-workflow/assistanceSelection';
import Select from '@/app/components/Select';
import { confirmDialog } from '@/app/lib/confirm';

/** Ba cách nhờ AI; giá trị gửi backend giữ nguyên. */
const MODES = [
  { id: 'ContinueWriting', label: 'Viết tiếp', hint: 'AI gợi ý đoạn viết tiếp cuối bản đang sửa.', Icon: PenLine },
  { id: 'SupportSelection', label: 'Sửa đoạn đã chọn', hint: 'Bôi đen một đoạn trong ô nội dung để AI tập trung vào đoạn đó.', Icon: TextSelect },
  { id: 'ReviewDraft', label: 'Nhận xét bản thảo', hint: 'AI đọc cả bản và chỉ ra chỗ nên sửa.', Icon: MessageSquareText },
] as const;
const MODE_LABEL: Record<string, string> = Object.fromEntries(MODES.map((m) => [m.id, m.label]));
/** Trạng thái tác vụ, loại bước và trạng thái bước của backend là chuỗi tiếng Anh; dịch các giá trị đã biết. */
const TASK_STATUS: Record<string, string> = {
  Open: 'Mới tạo', AwaitingClarification: 'AI cần hỏi thêm', OptionsReady: 'Có hướng để chọn', DirectionConfirmed: 'Đã chọn hướng',
  TrialReady: 'Có bản viết thử', ReviewReady: 'Có nhận xét', Closed: 'Đã đóng',
};
const STEP_KIND: Record<string, string> = {
  Suggestions: 'Lấy gợi ý', Clarification: 'AI hỏi thêm', Answer: 'Trả lời', Options: 'Các hướng gợi ý', Direction: 'Chọn hướng',
  Trial: 'Bản viết thử', ReviewFindings: 'Nhận xét', Close: 'Đóng', Cancel: 'Huỷ',
};
const STEP_STATUS: Record<string, string> = { Running: 'đang chạy', Succeeded: 'xong', Failed: 'lỗi', Cancelled: 'đã huỷ', Interrupted: 'bị gián đoạn' };

/**
 * Khung "AI gợi ý" dùng chung cho phụ huynh, Creator và màn duyệt nội dung.
 * Chia ba bước rõ ràng: 1) nói AI cần gì → 2) chọn hướng (hoặc đọc nhận xét) → 3) xem bản viết thử và đưa vào bài.
 */
export default function AssistancePanel({ actor, story, snapshot, selection, disabled, onApply }: { actor: 'parent' | 'creator'; story: Pick<B.CreatorDraftDto, 'storyId' | 'revisionToken' | 'selectedVersionId'>; snapshot: B.EditorSnapshot; selection?: AssistanceSelection | null; disabled: boolean; onApply: (snapshot: B.EditorSnapshot, reference: B.AssistanceReference) => void }) {
  const h = useAssistance(actor, story.storyId);
  const [goal, setGoal] = useState(''); const [entry, setEntry] = useState<string>('ContinueWriting');
  const [answer, setAnswer] = useState(''); const [direction, setDirection] = useState(''); const [notice, setNotice] = useState('');
  /** Bấm "Gợi ý mới" thì quay về bước 1 dù đang mở một tác vụ. */
  const [composing, setComposing] = useState(true);
  const task = h.task, result = task?.activeResult;
  const stale = !!task && (task.storyContextStale || task.audienceContextStale || task.sourceRevisionToken !== story.revisionToken || task.snapshot.title !== snapshot.title || task.snapshot.content !== snapshot.content);
  /** Bản thử đã được đưa vào bài (theo tác vụ + bước thử). Nội dung đổi là do chính việc áp dụng, không phải bản thảo cũ. */
  const [applied, setApplied] = useState<string | null>(null);
  const appliedHere = !!task && applied === `${task.taskId}:${task.activeTrialStepId}`;

  const create = () => {
    const target = assistanceTarget(entry, snapshot, selection);
    if (!target) { setNotice('Hãy bôi đen một đoạn trong ô nội dung, hoặc chọn Viết tiếp / Nhận xét bản thảo.'); return; }
    setNotice(''); setComposing(false);
    void h.requestSuggestions({ operationId: crypto.randomUUID(), entryPoint: entry, baseVersionId: story.selectedVersionId, revisionToken: story.revisionToken, editorSnapshot: { ...snapshot }, target, goal, constraints: { keep: [], avoid: [] }, parentTaskId: null, sourceReviewStepId: null, findingId: null });
  };
  const apply = () => {
    if (!task?.activeTrial?.result?.patch || !task.activeTrialStepId || stale) return;
    const next = applyAssistancePatch(task.snapshot, snapshot, task.activeTrial.result.patch);
    if (!next) { setNotice('Bản đang sửa hoặc vị trí trích dẫn đã thay đổi. Không thể áp dụng đề xuất cũ.'); return; }
    onApply(next, { taskId: task.taskId, stepId: task.activeTrialStepId, usage: 'TrialUsed' });
    setApplied(`${task.taskId}:${task.activeTrialStepId}`);
    setNotice('');
  };
  const followFinding = (finding: B.AssistanceFinding) => {
    if (!task?.activeReviewStepId || stale) return;
    const selected = { snapshot, start: finding.start, length: finding.length };
    const target = assistanceTarget('SupportSelection', snapshot, selected);
    if (!target) return;
    setNotice('');
    void h.requestSuggestions({ operationId: crypto.randomUUID(), entryPoint: 'SupportSelection', baseVersionId: story.selectedVersionId, revisionToken: story.revisionToken, editorSnapshot: { ...snapshot }, target, goal: finding.suggestedGoal, constraints: { keep: [], avoid: [] }, parentTaskId: task.taskId, sourceReviewStepId: task.activeReviewStepId, findingId: finding.id });
  };
  const closeTask = async () => {
    if (!(await confirmDialog('Đóng gợi ý này? Bạn vẫn xem lại được trong danh sách gợi ý trước đó.'))) return;
    void h.command((id, cmd) => h.api.close(story.storyId, id, cmd));
  };

  const blocked = disabled || h.busy || h.uncertain || stale || h.timedOut || task?.status === 'Closed' || !!task?.activeOperation;
  /** Chọn hướng xong thì tự viết thử ngay, không bắt bấm thêm nút "Viết thử". Chỉ áp dụng cho hướng vừa chọn trong phiên này. */
  const [autoTrialFor, setAutoTrialFor] = useState<number | null>(null);
  const chooseDirection = (body: { optionId: string | null; directionText: string | null }) => {
    if (!task?.activeOptionsStepId) return;
    setAutoTrialFor(task.taskId);
    void h.command((id, cmd) => h.api.direction(story.storyId, id, { ...cmd, optionsStepId: task.activeOptionsStepId!, ...body, confirmedConstraints: { keep: [], avoid: [] } }));
  };
  const directionStepId = task?.activeDirectionStepId ?? null;
  const trialForDirection = !!task?.activeTrial && task.activeTrial.directionStepId === directionStepId;
  useEffect(() => {
    if (!task || autoTrialFor !== task.taskId || !directionStepId || trialForDirection || blocked) return;
    setAutoTrialFor(null);
    void h.command((id, cmd) => h.api.trial(story.storyId, id, { ...cmd, directionStepId }));
  }, [task, autoTrialFor, directionStepId, trialForDirection, blocked, h, story.storyId]);
  const target = assistanceTarget(entry, snapshot, selection);
  const mode = MODES.find((m) => m.id === entry) ?? MODES[0];
  const showTask = !!task && !composing;
  const isReview = task?.entryPoint === 'ReviewDraft';
  // Bước hiện tại của tác vụ để tô thanh tiến trình.
  const stage = !showTask ? 1 : appliedHere ? 4 : ['DirectionConfirmed', 'TrialReady'].includes(task!.status) || task!.activeDirectionStepId ? 3 : 2;
  const stages = ['Nói AI cần gì', isReview ? 'Đọc nhận xét' : 'Chọn hướng', ...(isReview ? [] : ['Bản viết thử'])];
  const pastTasks = h.tasks?.items ?? [];

  return <section className="st-card pa-assist" aria-label="AI gợi ý theo bản nháp">
    <h3>AI gợi ý theo bản nháp</h3>
    <p className="sub">AI đọc cả phần chưa lưu để gợi ý. Bài của bạn chỉ đổi khi bạn chọn đưa bản thử vào và bấm lưu.</p>

    <ol className="as-stepper" aria-label="Các bước nhờ AI">
      {stages.map((label, i) => <li key={label} className={i + 1 < stage ? 'done' : i + 1 === stage ? 'on' : ''}><span className="as-dot">{i + 1 < stage ? <Check className="ic" aria-hidden /> : i + 1}</span>{label}</li>)}
    </ol>

    {(h.message || notice) && <p className="notice" role="status">{notice || h.message}</p>}
    {h.timedOut && <p className="notice warn" role="status">Đã dừng theo dõi tự động. Bấm Tải lại để kiểm tra trước khi chạy lệnh mới.</p>}
    {h.uncertain && <button className="btn btn-s" disabled={h.busy} onClick={() => void h.retry()}><RefreshCw className="ic" />Thử lại</button>}

    {/* Bước 1: chọn cách nhờ AI và nói mục tiêu. */}
    {!showTask && <fieldset disabled={disabled || h.busy || h.uncertain}>
      <div className="as-modes" role="radiogroup" aria-label="Kiểu hỗ trợ">
        {MODES.map((m) => <button type="button" key={m.id} role="radio" aria-checked={entry === m.id} className={`as-mode${entry === m.id ? ' on' : ''}`} onClick={() => setEntry(m.id)}><m.Icon className="ic" aria-hidden />{m.label}</button>)}
      </div>
      <p className="sub">{mode.hint}</p>
      {entry === 'SupportSelection' && (target
        ? <blockquote className="as-quote">{snapshot.content.slice(target.start, target.start + target.length)}</blockquote>
        : <p className="notice warn" role="status">Chưa có đoạn nào được bôi đen.</p>)}
      <label className="field">Bạn muốn AI giúp gì?<textarea className="inp" maxLength={2000} value={goal} placeholder="Ví dụ: Gợi ý cách để hai nhân vật làm hoà, giữ giọng kể nhẹ nhàng." onChange={(e) => setGoal(e.target.value)} /></label>
      <div className="row">
        <button className="btn btn-p" disabled={!goal.trim() || !target || !!task?.activeOperation || h.timedOut} onClick={create}><Sparkles className="ic" />{h.busy ? 'Đang gửi…' : 'Nhờ AI gợi ý'}</button>
        {task && <button type="button" className="btn btn-g" onClick={() => setComposing(false)}>Xem gợi ý đang mở</button>}
      </div>
    </fieldset>}

    {/* Bước 2–3: tác vụ đang mở. */}
    {showTask && task && <div className="as-task">
      <div className="as-task-head">
        <b>{MODE_LABEL[task.entryPoint] ?? task.entryPoint}</b>
        <span className="pill draft">{TASK_STATUS[task.status] ?? task.status}</span>
        <span className="grow" />
        <button className="btn btn-g icon-only" aria-label="Tải lại" title="Tải lại" disabled={h.busy} onClick={h.refresh}><RefreshCw className="ic" /></button>
        {task.status !== 'Closed' && <button className="btn btn-g icon-only" aria-label="Đóng gợi ý" title="Đóng gợi ý" disabled={h.busy || h.uncertain} onClick={() => void closeTask()}><X className="ic" /></button>}
        <button className="btn btn-s" disabled={h.busy || !!task.activeOperation} onClick={() => { setComposing(true); setNotice(''); }}><Plus className="ic" />Gợi ý mới</button>
      </div>
      {task.goal && <p className="as-goal">“{task.goal}”</p>}
      {appliedHere
        ? <p className="notice ok" role="status">Đã đưa bản viết thử vào bài. Đọc lại rồi bấm Lưu khi đồng ý. Muốn AI giúp tiếp, bấm Gợi ý mới.</p>
        : stale && <p className="notice warn" role="status">Nội dung bài đã đổi so với lúc tạo gợi ý này. Bấm Gợi ý mới để AI đọc bản hiện tại.</p>}

      {task.activeOperation && <div className="as-running"><Loader2 className="ic" aria-hidden /><span className="grow">AI đang xử lý…</span><button className="btn btn-s" disabled={h.cancelBusy || h.uncertain} onClick={() => void h.cancelRunning()}>Huỷ</button></div>}

      {['Open', 'AwaitingClarification'].includes(task.status) && !task.activeOperation && !(result?.question && task.activeClarificationStepId && !task.acceptedAnswerStepId) &&
        <button className="btn btn-p" disabled={blocked || task.status === 'AwaitingClarification' && !task.acceptedAnswerStepId} onClick={() => void h.command((id, cmd) => h.api.suggestions(story.storyId, id, { ...cmd, answerStepId: task.acceptedAnswerStepId }))}><Sparkles className="ic" />Lấy gợi ý</button>}

      {/* AI hỏi thêm trước khi gợi ý. */}
      {result?.question && task.activeClarificationStepId && <div className="as-block">
        <b>AI hỏi: {result.question.text}</b>
        <div className="as-modes">{result.question.choices.map((c) => <button type="button" className="as-mode" key={c.id} disabled={blocked} onClick={() => void h.command((id, cmd) => h.api.answer(story.storyId, id, { ...cmd, clarificationStepId: task.activeClarificationStepId!, questionId: result.question!.id, choiceId: c.id, customAnswer: null, letAiPropose: false }))}>{c.text}</button>)}</div>
        <div className="as-inline">
          <input className="inp" aria-label="Câu trả lời của bạn" placeholder="Hoặc tự trả lời…" value={answer} maxLength={2000} onChange={(e) => setAnswer(e.target.value)} />
          <button className="btn btn-s" disabled={blocked || !answer.trim()} onClick={() => void h.command((id, cmd) => h.api.answer(story.storyId, id, { ...cmd, clarificationStepId: task.activeClarificationStepId!, questionId: result.question!.id, choiceId: null, customAnswer: answer, letAiPropose: false }))}>Gửi</button>
        </div>
        <button className="btn btn-g" disabled={blocked || !!task.acceptedAnswerStepId} onClick={() => void h.command((id, cmd) => h.api.answer(story.storyId, id, { ...cmd, clarificationStepId: task.activeClarificationStepId!, questionId: result.question!.id, choiceId: null, customAnswer: null, letAiPropose: true }))}><WandSparkles className="ic" />Để AI tự quyết</button>
      </div>}

      {/* Bước 2: chọn một hướng. */}
      {!!task.activeOptionsStepId && !task.activeDirectionStepId && <div className="as-block">
        <b>Chọn một hướng để AI viết thử</b>
        <div className="as-options">{result?.options.map((o) => <button type="button" className="as-option" key={o.id} disabled={blocked} onClick={() => chooseDirection({ optionId: o.id, directionText: null })}>
          <b>{o.summary}</b><span>{o.direction}</span><em><Check className="ic" aria-hidden />Chọn hướng này</em>
        </button>)}</div>
        <div className="as-inline">
          <input className="inp" aria-label="Hướng riêng của bạn" placeholder="Hoặc tự mô tả hướng bạn muốn…" value={direction} maxLength={2000} onChange={(e) => setDirection(e.target.value)} />
          <button className="btn btn-s" disabled={blocked || !direction.trim()} onClick={() => chooseDirection({ optionId: null, directionText: direction })}>Dùng hướng này</button>
        </div>
      </div>}

      {/* Nhận xét bản thảo. */}
      {!!result?.findings.length && <div className="as-block">
        <b>Nhận xét của AI</b>
        {result.findings.map((f) => <div className="as-option static" key={f.id}>
          <blockquote className="as-quote">{f.quote}</blockquote><span>{f.comment}</span>
          <button className="btn btn-s" disabled={blocked || !task.activeReviewStepId || !assistanceTarget('SupportSelection', snapshot, { snapshot, start: f.start, length: f.length })} onClick={() => followFinding(f)}><Sparkles className="ic" />Nhờ AI sửa chỗ này</button>
        </div>)}
      </div>}
      {result?.warnings.map((w, i) => <p className="notice warn" role="status" key={i}>{w}</p>)}

      {/* Bước 3: bản viết thử. */}
      {task.activeDirectionStepId && !isReview && <div className="as-block">
        <b>Hướng đã chọn</b>
        {task.activeDirection?.direction?.confirmedDirectionText && <p className="as-goal">{task.activeDirection.direction.confirmedDirectionText}</p>}
        {task.activeTrial?.result?.patch
          ? <><blockquote className="as-quote">{task.activeTrial.result.patch.text}</blockquote>
            <div className="row"><button className="btn btn-ok" disabled={blocked} onClick={apply}><Check className="ic" />{appliedHere ? 'Đã đưa vào bài' : 'Đưa vào bài'}</button>
              <button className="btn btn-s" disabled={blocked} onClick={() => void h.command((id, cmd) => h.api.trial(story.storyId, id, { ...cmd, directionStepId: task.activeDirectionStepId! }))}><RefreshCw className="ic" />Viết bản khác</button></div></>
          // Chọn hướng xong AI tự viết thử; ở đây chỉ báo đang viết. Lỗi (không có bản thử, không còn chạy) mới cho thử lại.
          : h.busy || task.activeOperation || autoTrialFor === task.taskId
            ? !task.activeOperation && <div className="as-running"><Loader2 className="ic" aria-hidden /><span className="grow">AI đang viết thử theo hướng này…</span></div>
            : <div className="as-inline"><p className="notice warn grow" role="status">Chưa có bản viết thử cho hướng này.</p><button className="btn btn-s" disabled={blocked} onClick={() => void h.command((id, cmd) => h.api.trial(story.storyId, id, { ...cmd, directionStepId: task.activeDirectionStepId! }))}><RefreshCw className="ic" />Thử lại</button></div>}
      </div>}

      <details className="as-history"><summary><History className="ic" aria-hidden />Các bước đã làm</summary>
        {h.steps?.items.map((s) => <div className="as-step" key={s.stepId}><span>{STEP_KIND[s.kind] ?? s.kind} · {STEP_STATUS[s.status] ?? s.status}</span>{s.result?.patch?.text && <blockquote className="as-quote">{s.result.patch.text}</blockquote>}</div>)}
        {(h.stepPage > 1 || h.steps?.hasNextPage) && <div className="row"><button className="btn btn-g" disabled={h.stepPage === 1} onClick={() => h.setStepPage(h.stepPage - 1)}>Trước</button><button className="btn btn-g" disabled={!h.steps?.hasNextPage} onClick={() => h.setStepPage(h.stepPage + 1)}>Sau</button></div>}
      </details>
    </div>}

    {/* Mở lại một gợi ý đã tạo trước đó. */}
    {pastTasks.length > 0 && <div className="as-past">
      <span className="lbl">Gợi ý trước đó</span>
      <Select<string> ariaLabel="Mở lại gợi ý trước đó" value={task && !composing ? String(task.taskId) : ''} placeholder="Chọn để mở lại…"
        options={pastTasks.map((t) => ({ value: String(t.taskId), label: `${MODE_LABEL[t.entryPoint] ?? t.entryPoint} · ${TASK_STATUS[t.status] ?? t.status} · ${new Date(t.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` }))}
        onChange={(v) => { if (h.busy || h.uncertain) return; h.select(Number(v)); setComposing(false); setNotice(''); }} />
      {(h.taskPage > 1 || h.tasks?.hasNextPage) && <div className="row"><button className="btn btn-g" disabled={h.taskPage === 1 || h.busy} onClick={() => h.setTaskPage(h.taskPage - 1)}>Trước</button><button className="btn btn-g" disabled={!h.tasks?.hasNextPage || h.busy} onClick={() => h.setTaskPage(h.taskPage + 1)}>Sau</button></div>}
    </div>}
  </section>;
}
