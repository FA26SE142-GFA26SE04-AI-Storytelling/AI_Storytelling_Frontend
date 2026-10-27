"use client";

import { useMemo, useState } from "react";
import { Save, X } from "lucide-react";
import type { StoryReviewDto } from "@/app/types/aiStory";
import type { AssistanceReference } from "@/app/types/backendContracts";
import AssistancePanel from "@/app/features/authoring/AssistancePanel";
import type { AssistanceSelection } from "@/app/features/story-workflow/assistanceSelection";
import {
  normalizeSelection, overlapInParagraph, paragraphSelection, paragraphsWithOffsets, type StorySelection,
} from "@/app/features/story-workflow/storySelection";

type ViewProps = {
  story: StoryReviewDto;
  selection: StorySelection | null;
  selectable: boolean;
  onSelect: (s: StorySelection | null) => void;
};

/** Vị trí ký tự trong nội dung gốc của một điểm DOM nằm trong đoạn văn p[data-start]. */
function offsetOf(node: Node | null, offset: number): number | null {
  const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element | null);
  const p = el?.closest<HTMLElement>("p[data-start]");
  if (!node || !p) return null;
  const range = document.createRange();
  range.setStart(p, 0);
  range.setEnd(node, offset);
  return Number(p.dataset.start) + range.toString().length;
}

/** Bản thảo để đọc và chọn đoạn: bôi đen để chọn một phần, chạm vào đoạn để chọn cả đoạn. */
export function StoryView({ story, selection, selectable, onSelect }: ViewProps) {
  const paragraphs = useMemo(() => paragraphsWithOffsets(story.content), [story.content]);

  const pick = (e: React.MouseEvent) => {
    if (!selectable) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const a = offsetOf(sel.anchorNode, sel.anchorOffset);
      const b = offsetOf(sel.focusNode, sel.focusOffset);
      if (a === null || b === null) return;
      onSelect(normalizeSelection(story.content, a, b));
      sel.removeAllRanges();
      return;
    }
    const p = (e.target as Element).closest<HTMLElement>("p[data-i]");
    if (!p) return;
    const next = paragraphSelection(story.content, paragraphs[Number(p.dataset.i)]);
    const same = next && selection && next.start === selection.start && next.endExclusive === selection.endExclusive;
    onSelect(same ? null : next);
  };

  return (
    <div className={`story-text${selectable ? " selectable" : ""}`} onMouseUp={pick}>
      {paragraphs.map((p, i) => {
        const hit = overlapInParagraph(p, selection);
        return (
          <p key={`${p.start}-${i}`} data-i={i} data-start={p.start} className={hit ? "picked" : ""}>
            {hit ? <>{p.text.slice(0, hit[0])}<mark>{p.text.slice(hit[0], hit[1])}</mark>{p.text.slice(hit[1])}</> : p.text}
          </p>
        );
      })}
    </div>
  );
}

type EditorProps = {
  story: StoryReviewDto;
  actor: 'parent' | 'creator';
  assistanceRevisionToken?: string | null;
  busy: boolean;
  onSave: (draft: { title: string; content: string; lesson: string; assistanceReferences?: AssistanceReference[] }) => void;
  onCancel: () => void;
};

/** Chỉnh bản nháp; gợi ý AI chỉ được lưu khi người dùng áp dụng và xác nhận. */
export function StoryEditor({ story, actor, assistanceRevisionToken, busy, onSave, onCancel }: EditorProps) {
  const [draft, setDraft] = useState({ title: story.title, content: story.content, lesson: story.lesson });
  const [selection, setSelection] = useState<AssistanceSelection | null>(null);
  const [references, setReferences] = useState<AssistanceReference[]>([]);
  const dirty = draft.title !== story.title || draft.content !== story.content || draft.lesson !== story.lesson;

  return (
    <div className="story-editor">
      <label className="field"><span className="lbl">Tiêu đề</span>
        <input className="inp display" value={draft.title} disabled={busy} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      <label className="field"><span className="lbl">Nội dung (mỗi đoạn một dòng)</span>
        <textarea className="inp" rows={18} value={draft.content} disabled={busy} onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          onSelect={e => { const t=e.currentTarget; setSelection({snapshot:{title:draft.title,content:t.value},start:t.selectionStart,length:t.selectionEnd-t.selectionStart}); }} /></label>
      <label className="field"><span className="lbl">Bài học</span>
        <input className="inp" value={draft.lesson} disabled={busy} onChange={(e) => setDraft({ ...draft, lesson: e.target.value })} /></label>
      {assistanceRevisionToken && <AssistancePanel actor={actor} story={{storyId:story.storyId,selectedVersionId:story.versionId,revisionToken:assistanceRevisionToken}}
        snapshot={{title:draft.title,content:draft.content}} selection={selection} disabled={busy}
        onApply={(next,reference) => {setDraft({...draft,...next});setSelection(null);setReferences(previous=>[...previous.filter(r=>r.taskId!==reference.taskId||r.stepId!==reference.stepId),reference]);}} />}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-g" disabled={busy} onClick={onCancel}><X className="ic" />Huỷ</button>
        <button className="btn btn-p" disabled={busy || !dirty || !draft.content.trim() || !draft.title.trim()} onClick={() => onSave({...draft,assistanceReferences:references})}><Save className="ic" />Lưu bản sửa</button>
      </div>
    </div>
  );
}
