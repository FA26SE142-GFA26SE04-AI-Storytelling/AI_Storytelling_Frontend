"use client";

import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import type { AIProposalDto } from "@/app/types/aiStory";
import { artifactProposalItems, storyProposalView } from "@/app/features/story-workflow/revisionIntents";
import { countWords } from "@/app/features/story-workflow/storySelection";
import { usePop } from "@/app/lib/motion";
import { ArtifactItems, ARTIFACT_LABEL, type ArtifactKind } from "./ArtifactList";

type Props = { proposal: AIProposalDto; busy: boolean; onApply: () => void; onDiscard: () => void };

/** Đề xuất của AI chỉ là bản xem trước: chưa có gì thay đổi cho tới khi bấm Áp dụng. */
export default function ProposalCard({ proposal, busy, onApply, onDiscard }: Props) {
  const ref = usePop<HTMLDivElement>(proposal.proposalId, 0.97);
  const story = storyProposalView(proposal);
  const kind = proposal.artifactType as ArtifactKind;
  const artifact = story ? null : artifactProposalItems(proposal);
  const listening = proposal.artifactType.startsWith("listening:");
  const listeningItems = listening && artifact ? (artifact.after as { prompt?: string | null }[]) : [];

  return (
    <div ref={ref} className="proposal" role="region" aria-label="Đề xuất của AI">
      <div className="proposal-h">
        <Sparkles className="ic" />
        <b>{listening ? "AI đề xuất tương tác khi nghe mới" : story ? "AI đề xuất sửa đoạn này" : `AI đề xuất ${ARTIFACT_LABEL[kind]?.toLowerCase() ?? "học liệu"} mới`}</b>
        <span className="pill wait" title="Chưa thay đổi gì cho tới khi bạn áp dụng">Chưa áp dụng</span>
      </div>
      {listening ? (
        <div className="proposal-body">
          <p className="notice">{listeningItems.length} tương tác mới sẽ thay các tương tác cùng loại hiện tại.</p>
          <ol className="art-list">{listeningItems.map((it, i) => <li key={i}>{it.prompt || `Tương tác ${i + 1}`}</li>)}</ol>
        </div>
      ) : story ? (
        <>
          <div className="diff">
            <div className="del"><small>Bản hiện tại · {countWords(story.selectedText)} từ</small><p>{story.selectedText}</p></div>
            <ArrowRight className="ic diff-arrow" />
            <div className="ins"><small>Đề xuất · {countWords(story.suggestedText)} từ</small><p>{story.suggestedText}</p></div>
          </div>
        </>
      ) : artifact && (
        <div className="proposal-body">
          {artifact.before && <p className="notice">{artifact.before.length} mục hiện tại → {artifact.after.length} mục mới. Áp dụng sẽ thay toàn bộ danh sách.</p>}
          <ArtifactItems kind={kind} items={artifact.after} />
        </div>
      )}
      <div className="row proposal-act">
        <button className="btn btn-g" disabled={busy} onClick={onDiscard}><X className="ic" />Bỏ đề xuất</button>
        <button className="btn btn-p" disabled={busy} onClick={onApply}><Check className="ic" />Đồng ý</button>
      </div>
    </div>
  );
}
