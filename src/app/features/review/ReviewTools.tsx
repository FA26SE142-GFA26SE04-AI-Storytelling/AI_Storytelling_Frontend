"use client";

import "./review-tools.css";
import { useState } from "react";
import { Archive, Check, Plus, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import type { useStoryReview } from "@/app/features/story-workflow/useStoryReview";
import type { DiscussionPromptDto, QuizQuestionDto, VocabularyItemDto } from "@/app/types/aiStory";
import type { ApiResponse } from "@/app/types/auth";
import { ARCHIVE_REASONS, FREE_TEXT_MAX, REVISION_INTENTS, quizTypesFor, revisionInstruction, type ArchiveReason, type RevisionIntent } from "@/app/lib/storyRules";

type Review = ReturnType<typeof useStoryReview>;
type Artifact = "vocabulary" | "quiz" | "discussion";
const ARTIFACT_LABEL: Record<Artifact, string> = { vocabulary: "Từ vựng", quiz: "Câu đố", discussion: "Thảo luận" };

/** Hộp thoại dùng chung. */
function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`dlg${wide ? " wide" : ""}`}>
        <div className="row"><b className="display grow" style={{ fontSize: 18 }}>{title}</b><button className="btn btn-g" aria-label="Đóng" onClick={onClose}><X className="ic" /></button></div>
        {children}
      </div>
    </div>
  );
}

const itemText = (artifact: string, item: Record<string, unknown>) =>
  artifact === "vocabulary" ? `${item.term}: ${item.definition}` : artifact === "quiz" ? `${item.question}${item.correctAnswer ? ` → ${item.correctAnswer}` : ""}` : String(item.question ?? "");

/** Đề xuất AI đang chờ: xem trước rồi Áp dụng hoặc Bỏ qua (Luồng 2 mục 6.2–6.4). */
export function ProposalCard({ r }: { r: Review }) {
  const p = r.proposal;
  if (!p) return null;
  const orig = p.originalContent as { selectedText?: string; items?: Record<string, unknown>[] } | null;
  const sug = p.suggestedContent as { content?: string; items?: Record<string, unknown>[] } | null;
  const isStory = p.artifactType === "story";
  return (
    <div className="proposal">
      <b className="row"><Sparkles className="ic" style={{ color: "var(--primary)" }} />Đề xuất của AI — {isStory ? "nội dung truyện" : ARTIFACT_LABEL[p.artifactType as Artifact] ?? p.artifactType}</b>
      {isStory ? (
        <div className="diff">
          <div><small>Bản hiện tại</small><p className="del">{orig?.selectedText}</p></div>
          <div><small>Bản AI đề xuất</small><p className="add">{sug?.content}</p></div>
        </div>
      ) : (
        <div className="diff">
          {(orig?.items?.length ?? 0) > 0 && <div><small>Hiện tại</small><ul>{orig!.items!.map((it, i) => <li key={i} className="del">{itemText(p.artifactType, it)}</li>)}</ul></div>}
          <div><small>AI đề xuất</small><ul>{(sug?.items ?? []).map((it, i) => <li key={i} className="add">{itemText(p.artifactType, it)}</li>)}</ul></div>
        </div>
      )}
      <p className="sub">{isStory ? "Áp dụng sẽ tạo bản truyện mới; học liệu của bản cũ cần tạo lại." : "Áp dụng sẽ thay toàn bộ danh sách hiện tại."}</p>
      <div className="row">
        <button className="btn btn-ok" disabled={r.busy} onClick={() => void r.decideProposal(true)}><Check className="ic" />Áp dụng</button>
        <button className="btn btn-s" disabled={r.busy} onClick={() => void r.decideProposal(false)}>Bỏ qua</button>
      </div>
    </div>
  );
}

/** Chỉnh sửa theo chủ đích (Luồng 2 mục 5.8): chọn mục đích + phạm vi, AI đề xuất bản sửa để xem trước. */
export function RevisePanel({ r, scene }: { r: Review; scene?: { index: number; text: string } }) {
  const [intent, setIntent] = useState<RevisionIntent>("simplify");
  const [note, setNote] = useState("");
  const [scope, setScope] = useState<"whole" | "scene">("whole");
  const content = r.bundle?.story.content ?? "";
  const canUseScene = !!scene && content.includes(scene.text);

  const submit = () => r.run(async (signal) => {
    if (!r.bundle) return;
    const start = scope === "scene" && canUseScene ? content.indexOf(scene!.text) : 0;
    const end = scope === "scene" && canUseScene ? start + scene!.text.length : content.length;
    const instruction = revisionInstruction(intent, note);
    if (!instruction) throw new Error("Hãy ghi rõ bạn muốn AI sửa gì.");
    await r.createProposal(await api.partialEditStory(r.bundle.summary.storyId, {
      versionId: r.bundle.summary.storyVersionId, selection: { start, endExclusive: end, text: content.slice(start, end) }, instruction,
    }, signal), signal);
  });

  return (
    <div className="sec" style={{ gap: 8 }}>
      <div className="sec-h">Nhờ AI sửa</div>
      <div className="chips">
        {REVISION_INTENTS.map((i) => <button key={i.id} type="button" className={`chip${intent === i.id ? " on" : ""}`} onClick={() => setIntent(i.id)}>{i.label}</button>)}
      </div>
      {scene && (
        <div className="seg">
          <button type="button" className={scope === "whole" ? "on" : ""} onClick={() => setScope("whole")}>Cả truyện</button>
          <button type="button" className={scope === "scene" ? "on" : ""} disabled={!canUseScene} onClick={() => setScope("scene")}>Cảnh {scene.index + 1}</button>
        </div>
      )}
      <input className="inp" maxLength={FREE_TEXT_MAX} value={note} onChange={(e) => setNote(e.target.value)} placeholder={intent === "custom" ? "Bạn muốn AI sửa gì? (bắt buộc)" : "Ghi chú thêm (không bắt buộc)"} aria-label="Ghi chú cho AI" />
      <button className="btn btn-s btn-c" disabled={r.busy || !!r.proposal || !r.bundle?.summary.canEdit || (intent === "custom" && !note.trim())} onClick={() => void submit()}><Sparkles className="ic" />Xem đề xuất</button>
      <p className="sub">Mỗi truyện có 3 lần sửa bằng AI miễn phí (gồm sửa nội dung và tạo lại học liệu).</p>
    </div>
  );
}

type Item = VocabularyItemDto | QuizQuestionDto | DiscussionPromptDto;

/** Sửa học liệu: thêm / sửa / xoá, hoặc nhờ AI tạo lại (Luồng 2 mục 6.2–6.4). */
export function LearningEditor({ r, ageBand, onClose }: { r: Review; ageBand: string; onClose: () => void }) {
  const [tab, setTab] = useState<Artifact>("vocabulary");
  const b = r.bundle!;
  const [draft, setDraft] = useState<Record<Artifact, Item[]>>({ vocabulary: b.vocabulary.items, quiz: b.quiz.items, discussion: b.discussion.items });
  const [saved, setSaved] = useState<string | null>(null);
  const items = draft[tab];
  const set = (next: Item[]) => setDraft({ ...draft, [tab]: next });
  const patch = (i: number, p: Partial<Item>) => set(items.map((it, k) => (k === i ? ({ ...it, ...p } as Item) : it)));
  const types = quizTypesFor(ageBand);
  const dirty = JSON.stringify(draft[tab]) !== JSON.stringify(b[tab].items);

  const problem = (): string | null => {
    if (tab === "vocabulary") return (draft.vocabulary as VocabularyItemDto[]).some((v) => !v.term.trim() || !v.definition.trim()) ? "Mỗi từ cần có cả từ và nghĩa." : null;
    if (tab === "discussion") return (draft.discussion as DiscussionPromptDto[]).some((d) => !d.question.trim()) ? "Câu hỏi thảo luận không được để trống." : null;
    const qs = draft.quiz as QuizQuestionDto[];
    if (qs.some((q) => !q.question.trim() || !q.correctAnswer?.trim())) return "Mỗi câu hỏi cần có nội dung và đáp án đúng.";
    if (qs.some((q) => q.type === "multiple_choice" && (q.choices ?? []).filter((c) => c.trim()).length < 2)) return "Câu trắc nghiệm cần ít nhất 2 phương án.";
    return null;
  };

  const save = () => r.run(async (signal) => {
    const bad = problem();
    if (bad) throw new Error(bad);
    const versionId = b.summary.storyVersionId;
    const res: ApiResponse<unknown> = tab === "vocabulary" ? await api.updateVocabularyReview(b.summary.storyId, { versionId, items: draft.vocabulary as VocabularyItemDto[] }, signal)
      : tab === "quiz" ? await api.updateQuizReview(b.summary.storyId, { versionId, items: (draft.quiz as QuizQuestionDto[]).map((q) => ({ ...q, choices: q.choices?.filter((c) => c.trim()) ?? null })) }, signal)
      : await api.updateDiscussionReview(b.summary.storyId, { versionId, items: draft.discussion as DiscussionPromptDto[] }, signal);
    r.requireData(res);
    await r.load(signal);
    setSaved(`Đã lưu ${ARTIFACT_LABEL[tab].toLowerCase()}.`);
  });

  const regenerate = () => r.run(async (signal) => {
    await r.createProposal(await api.regenerateReviewArtifact(b.summary.storyId, tab, signal), signal);
    onClose();
  });

  const blank: Record<Artifact, Item> = {
    vocabulary: { term: "", definition: "" },
    quiz: { type: types[0].id, question: "", correctAnswer: "", choices: types[0].id === "multiple_choice" ? ["", "", ""] : null },
    discussion: { question: "", isMoralLesson: false },
  };

  return (
    <Dialog title="Sửa học liệu" onClose={onClose} wide>
      <div className="tabs" style={{ padding: 0 }}>
        {(Object.keys(ARTIFACT_LABEL) as Artifact[]).map((a) => <button key={a} className={tab === a ? "on" : ""} onClick={() => { setTab(a); setSaved(null); }}>{ARTIFACT_LABEL[a]} ({draft[a].length})</button>)}
      </div>
      <div className="edit-list">
        {items.map((it, i) => (
          <div key={i} className="edit-item">
            {tab === "vocabulary" && (() => { const v = it as VocabularyItemDto; return (
              <>
                <input className="inp" value={v.term} onChange={(e) => patch(i, { term: e.target.value })} placeholder="Từ" aria-label="Từ" style={{ maxWidth: 180 }} />
                <input className="inp" value={v.definition} onChange={(e) => patch(i, { definition: e.target.value })} placeholder="Nghĩa, phù hợp tuổi của bé" aria-label="Nghĩa" />
              </>
            ); })()}
            {tab === "quiz" && (() => { const q = it as QuizQuestionDto; return (
              <div className="sec grow" style={{ gap: 6 }}>
                <div className="row">
                  <select className="inp" style={{ width: "auto" }} value={q.type} aria-label="Loại câu hỏi" onChange={(e) => {
                    const type = e.target.value;
                    patch(i, { type, choices: type === "multiple_choice" ? q.choices?.length ? q.choices : ["", "", ""] : type === "true_false" ? ["Đúng", "Sai"] : null });
                  }}>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <input className="inp" value={q.question} onChange={(e) => patch(i, { question: e.target.value })} placeholder="Câu hỏi" aria-label="Câu hỏi" />
                </div>
                {q.type === "multiple_choice" && (
                  <div className="row" style={{ flexWrap: "wrap" }}>
                    {(q.choices ?? []).map((c, k) => (
                      <label key={k} className="row" style={{ gap: 4 }}>
                        <input type="radio" name={`ans-${i}`} checked={!!c && q.correctAnswer === c} onChange={() => patch(i, { correctAnswer: c })} aria-label={`Đáp án đúng ${k + 1}`} />
                        <input className="inp" style={{ width: 150 }} value={c} onChange={(e) => {
                          const choices = [...(q.choices ?? [])]; const wasRight = q.correctAnswer === choices[k]; choices[k] = e.target.value;
                          patch(i, { choices, ...(wasRight ? { correctAnswer: e.target.value } : {}) });
                        }} placeholder={`Phương án ${k + 1}`} />
                      </label>
                    ))}
                  </div>
                )}
                {q.type === "true_false" && (
                  <div className="seg" style={{ maxWidth: 200 }}>{["Đúng", "Sai"].map((v) => <button key={v} type="button" className={q.correctAnswer === v ? "on" : ""} onClick={() => patch(i, { correctAnswer: v })}>{v}</button>)}</div>
                )}
                {q.type === "short_answer" && (
                  <input className="inp" value={q.correctAnswer ?? ""} onChange={(e) => patch(i, { correctAnswer: e.target.value })} placeholder="Đáp án chấp nhận" aria-label="Đáp án" />
                )}
              </div>
            ); })()}
            {tab === "discussion" && (() => { const d = it as DiscussionPromptDto; return (
              <>
                <input className="inp" value={d.question} onChange={(e) => patch(i, { question: e.target.value })} placeholder="Câu hỏi cho bố mẹ trò chuyện với con" aria-label="Câu hỏi thảo luận" />
                <label className="row" style={{ whiteSpace: "nowrap", fontSize: 12 }}><input type="checkbox" checked={d.isMoralLesson} onChange={(e) => patch(i, { isMoralLesson: e.target.checked })} />Về bài học</label>
              </>
            ); })()}
            <button className="btn btn-g" aria-label="Xoá" onClick={() => set(items.filter((_, k) => k !== i))}><Trash2 className="ic" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="sub">Chưa có mục nào.</p>}
      </div>
      {tab === "quiz" && ageBand === "Age_6_8" && <p className="sub">Bé 6–8 tuổi chỉ dùng trắc nghiệm và đúng/sai, không có tự luận.</p>}
      {r.error && <div className="notice err" role="alert">{r.error}</div>}
      {saved && !dirty && <div className="notice ok" role="status">{saved}</div>}
      <div className="row">
        <button className="btn btn-s" onClick={() => set([...items, blank[tab]])}><Plus className="ic" />Thêm</button>
        <button className="btn btn-s" disabled={r.busy || !!r.proposal} onClick={() => void regenerate()}><RefreshCw className="ic" />AI tạo lại</button>
        <span className="grow" />
        <button className="btn btn-p" disabled={r.busy || !dirty} onClick={() => void save()}><Check className="ic" />Lưu {ARTIFACT_LABEL[tab].toLowerCase()}</button>
      </div>
    </Dialog>
  );
}

/** Lưu trữ truyện, bắt buộc chọn lý do (Luồng 2 mục 6.6). */
export function ArchiveDialog({ storyId, onClose, onDone }: { storyId: number; onClose: () => void; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState<ArchiveReason>("supervisor_preference");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setErr(null);
    const res = await api.archiveStory(storyId, { reason });
    setBusy(false);
    if (res.success) onDone("Đã lưu trữ truyện");
    else setErr(res.message);
  };
  return (
    <Dialog title="Lưu trữ truyện" onClose={onClose}>
      <p className="sub">Truyện sẽ không hiện với bé nữa. Truyện không bị xoá hẳn.</p>
      <div className="sec" style={{ gap: 7 }}>
        {ARCHIVE_REASONS.map((a) => (
          <label key={a.id} className={`opt${reason === a.id ? " on" : ""}`}>
            <input type="radio" name="archive" checked={reason === a.id} onChange={() => setReason(a.id)} />
            <span><b>{a.label}</b><small>{a.hint}</small></span>
          </label>
        ))}
      </div>
      {err && <div className="notice err" role="alert">{err}</div>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-g" onClick={onClose}>Hủy</button>
        <button className="btn btn-no" disabled={busy} onClick={() => void submit()}><Archive className="ic" />Lưu trữ</button>
      </div>
    </Dialog>
  );
}
