'use client';
import { useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { useAssistance } from '@/app/features/story-workflow/useAssistance';
import { applyAssistancePatch } from '@/app/features/story-workflow/assistancePatch';
import {assistanceTarget,type AssistanceSelection} from '@/app/features/story-workflow/assistanceSelection';
export default function AssistancePanel({ actor, story, snapshot, selection, disabled, onApply }: { actor:'parent'|'creator'; story:Pick<B.CreatorDraftDto,'storyId'|'revisionToken'|'selectedVersionId'>; snapshot:B.EditorSnapshot; selection?:AssistanceSelection|null; disabled:boolean; onApply:(snapshot:B.EditorSnapshot, reference:B.AssistanceReference) => void }) {
  const h = useAssistance(actor,story.storyId);
  const [goal, setGoal] = useState(''); const [entry, setEntry] = useState('ContinueWriting');
  const [answer, setAnswer] = useState(''); const [direction, setDirection] = useState(''); const [notice, setNotice] = useState('');
  const task = h.task, result = task?.activeResult;
  const stale = !!task && (task.storyContextStale || task.audienceContextStale || task.sourceRevisionToken !== story.revisionToken || task.snapshot.title !== snapshot.title || task.snapshot.content !== snapshot.content);
  const create = () => {
    const target=assistanceTarget(entry,snapshot,selection);
    if(!target){setNotice('Hãy bôi đen một đoạn trong ô nội dung, hoặc chọn viết tiếp/nhận xét toàn bản nháp.');return;}
    setNotice('');
    void h.requestSuggestions({ operationId:crypto.randomUUID(),entryPoint:entry,baseVersionId:story.selectedVersionId,revisionToken:story.revisionToken,editorSnapshot:{...snapshot},target,goal,constraints:{keep:[],avoid:[]},parentTaskId:null,sourceReviewStepId:null,findingId:null });
  };
  const apply = () => {
    if (!task?.activeTrial?.result?.patch || !task.activeTrialStepId || stale) return;
    const next = applyAssistancePatch(task.snapshot,snapshot,task.activeTrial.result.patch);
    if (!next) { setNotice('Bản đang sửa hoặc vị trí trích dẫn đã thay đổi. Không thể áp dụng đề xuất cũ.'); return; }
    onApply(next,{taskId:task.taskId,stepId:task.activeTrialStepId,usage:'TrialUsed'});
    setNotice('Đã đưa bản thử vào trình soạn. Hãy tự đọc lại và bấm lưu phiên bản khi đồng ý.');
  };
  const followFinding = (finding:B.AssistanceFinding) => {
    if(!task?.activeReviewStepId || stale)return;
    const selected={snapshot,start:finding.start,length:finding.length};
    const target=assistanceTarget('SupportSelection',snapshot,selected);
    if(!target)return;
    setNotice('');
    void h.requestSuggestions({operationId:crypto.randomUUID(),entryPoint:'SupportSelection',baseVersionId:story.selectedVersionId,revisionToken:story.revisionToken,editorSnapshot:{...snapshot},target,goal:finding.suggestedGoal,constraints:{keep:[],avoid:[]},parentTaskId:task.taskId,sourceReviewStepId:task.activeReviewStepId,findingId:finding.id});
  };
  const blocked = disabled || h.busy || h.uncertain || stale || h.timedOut || task?.status==='Closed' || !!task?.activeOperation;
  const target=assistanceTarget(entry,snapshot,selection);
  return <section className="st-card" aria-label="AI gợi ý theo bản nháp"><h3>AI gợi ý theo bản nháp</h3><p className="sub">AI đọc nội dung bạn đang sửa, kể cả phần chưa lưu, để gợi ý theo mục tiêu của bạn. Đây là gợi ý sinh theo ngữ cảnh, không phải mẫu trong catalog. Bản gốc chỉ thay đổi khi bạn chọn áp dụng và lưu.</p>{(h.message || notice) && <p className="notice" role="status">{notice || h.message}</p>}{h.timedOut && <p>Đã dừng theo dõi tự động. Kiểm tra lại tác vụ trước khi chạy lệnh mới.</p>}
    {h.uncertain && <button className="btn btn-s" disabled={h.busy} onClick={() => void h.retry()}>Thử lại cùng lệnh chưa rõ kết quả</button>}
    <fieldset disabled={disabled || h.busy || h.uncertain} style={{border:0,padding:0}}><label className="field">Kiểu hỗ trợ<select className="inp" value={entry} onChange={e => setEntry(e.target.value)}><option value="ContinueWriting">Viết tiếp cuối bản đang sửa</option><option value="SupportSelection">Gợi ý cho đoạn đã bôi đen</option><option value="ReviewDraft">Đọc và nhận xét bản thảo</option></select></label>{entry === 'SupportSelection' && (target?<blockquote style={{whiteSpace:'pre-wrap'}}>{snapshot.content.slice(target.start,target.start+target.length)}</blockquote>:<p className="notice">Bôi đen một đoạn trong ô nội dung phía trên để AI tập trung vào đúng đoạn đó.</p>)}
      <label className="field">Bạn muốn AI hỗ trợ điều gì?<textarea className="inp" maxLength={2000} value={goal} placeholder="Ví dụ: Gợi ý cách để hai nhân vật làm hòa, giữ giọng kể nhẹ nhàng." onChange={e => setGoal(e.target.value)} /></label><button className="btn btn-p" disabled={!goal.trim() || !target || !!task?.activeOperation || h.timedOut} onClick={create}>{h.busy?'Đang yêu cầu AI…':'Yêu cầu AI gợi ý theo bản nháp'}</button></fieldset>
    <details><summary>Tác vụ đã tạo</summary>{h.tasks?.items.map(t => <button className="btn btn-s" key={t.taskId} disabled={h.busy || h.uncertain} onClick={() => h.select(t.taskId)}>#{t.taskId} · {t.entryPoint} · {t.status}</button>)}<div className="row"><button className="btn btn-s" disabled={h.taskPage===1 || h.busy} onClick={() => h.setTaskPage(h.taskPage-1)}>Trước</button><button className="btn btn-s" disabled={!h.tasks?.hasNextPage || h.busy} onClick={() => h.setTaskPage(h.taskPage+1)}>Tiếp</button></div></details>
    {task && <><p>Tác vụ #{task.taskId} · {task.status} · sửa lần {task.taskRevision}</p>{stale && <p className="notice warn">Tác vụ dùng bản thảo hoặc hồ sơ cũ. Tạo tác vụ mới trước khi lấy gợi ý; vẫn có thể đóng tác vụ cũ.</p>}
      <div className="row"><button className="btn btn-s" disabled={h.busy} onClick={h.refresh}>Tải trạng thái</button>{['Open','AwaitingClarification'].includes(task.status) && <button className="btn btn-s" disabled={blocked || task.status==='AwaitingClarification' && !task.acceptedAnswerStepId} onClick={() => void h.command((id,cmd) => h.api.suggestions(story.storyId,id,{...cmd,answerStepId:task.acceptedAnswerStepId}))}>Lấy gợi ý</button>}</div>
      {result?.question && task.activeClarificationStepId && <section className="sec"><p>{result.question.text}</p>{result.question.choices.map(c => <button className="btn btn-s" key={c.id} disabled={blocked} onClick={() => void h.command((id,cmd) => h.api.answer(story.storyId,id,{...cmd,clarificationStepId:task.activeClarificationStepId!,questionId:result.question!.id,choiceId:c.id,customAnswer:null,letAiPropose:false}))}>{c.text}</button>)}<input className="inp" aria-label="Câu trả lời riêng" value={answer} maxLength={2000} onChange={e => setAnswer(e.target.value)} /><button className="btn btn-s" disabled={blocked || !answer.trim()} onClick={() => void h.command((id,cmd) => h.api.answer(story.storyId,id,{...cmd,clarificationStepId:task.activeClarificationStepId!,questionId:result.question!.id,choiceId:null,customAnswer:answer,letAiPropose:false}))}>Gửi câu trả lời riêng</button></section>}
      {result?.question && task.activeClarificationStepId && <button className="btn btn-s" disabled={blocked || !!task.acceptedAnswerStepId} onClick={() => void h.command((id,cmd) => h.api.answer(story.storyId,id,{...cmd,clarificationStepId:task.activeClarificationStepId!,questionId:result.question!.id,choiceId:null,customAnswer:null,letAiPropose:true}))}>Để AI đề xuất và nêu giả định</button>}
      {result?.options.map(o => <div className="sec" key={o.id}><b>{o.summary}</b><p>{o.direction}</p><button className="btn btn-s" disabled={blocked || !task.activeOptionsStepId} onClick={() => void h.command((id,cmd) => h.api.direction(story.storyId,id,{...cmd,optionsStepId:task.activeOptionsStepId!,optionId:o.id,directionText:null,confirmedConstraints:{keep:[],avoid:[]}}))}>Xác nhận hướng này</button></div>)}
      {!!task.activeOptionsStepId && <><textarea className="inp" aria-label="Hướng chỉnh sửa riêng" value={direction} maxLength={2000} onChange={e => setDirection(e.target.value)} /><button className="btn btn-s" disabled={blocked || !direction.trim()} onClick={() => void h.command((id,cmd) => h.api.direction(story.storyId,id,{...cmd,optionsStepId:task.activeOptionsStepId!,optionId:null,directionText:direction,confirmedConstraints:{keep:[],avoid:[]}}))}>Xác nhận hướng riêng</button></>}
      {result?.findings.map(f => <blockquote key={f.id}>{f.quote}<p>{f.comment}</p><p>{f.suggestedGoal}</p><button className="btn btn-s" disabled={blocked || !task.activeReviewStepId || !assistanceTarget('SupportSelection',snapshot,{snapshot,start:f.start,length:f.length})} onClick={()=>followFinding(f)}>Nhờ AI gợi ý cho nhận xét này</button></blockquote>)}{result?.warnings.map((w,i) => <p className="notice warn" key={i}>{w}</p>)}
      {task.activeDirectionStepId && task.entryPoint!=='ReviewDraft' && <button className="btn btn-s" disabled={blocked} onClick={() => void h.command((id,cmd) => h.api.trial(story.storyId,id,{...cmd,directionStepId:task.activeDirectionStepId!}))}>Tạo bản viết thử theo hướng đã chọn</button>}
      {task.activeTrial?.result?.patch && <div className="sec"><h4>Bản viết thử</h4><blockquote style={{whiteSpace:'pre-wrap'}}>{task.activeTrial.result.patch.text}</blockquote><button className="btn btn-ok" disabled={blocked} onClick={apply}>Đưa bản thử vào phần đang sửa</button></div>}
      <div className="row">{task.activeOperation && <button className="btn btn-s" disabled={h.cancelBusy || h.uncertain} onClick={() => void h.cancelRunning()}>Hủy thao tác đang chạy</button>}<button className="btn btn-g" disabled={h.busy || h.uncertain} onClick={() => void h.command((id,cmd) => h.api.close(story.storyId,id,cmd))}>Đóng tác vụ</button></div>
      <details><summary>Lịch sử tác vụ</summary>{h.steps?.items.map(s => <div key={s.stepId}><p>#{s.sequence} · {s.kind} · {s.status}</p>{s.result?.patch?.text && <blockquote>{s.result.patch.text}</blockquote>}{s.errorCode && <p>{s.errorCode}</p>}</div>)}<div className="row"><button className="btn btn-s" disabled={h.stepPage===1} onClick={() => h.setStepPage(h.stepPage-1)}>Bước trước</button><button className="btn btn-s" disabled={!h.steps?.hasNextPage} onClick={() => h.setStepPage(h.stepPage+1)}>Bước tiếp</button></div></details>
    </>}
  </section>;
}
