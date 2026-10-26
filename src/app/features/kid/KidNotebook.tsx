"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { readingService, type NotebookEntry } from "@/app/services/readingService";
import type { Achievements } from "@/app/types/reading";
import { BADGES, TREE_STAGES, treeStage } from "@/app/lib/readingRules";
import { useNarrator } from "./useNarrator";

/** Luồng 3 Bước 3.4 — Cây tri thức, huy hiệu và sổ tay từ vựng của bé. */
export default function KidNotebook({ childId, achievements }: { childId: number; achievements: Achievements }) {
  const [words, setWords] = useState<NotebookEntry[] | null>(null);
  const narrator = useNarrator();
  const stage = treeStage(achievements.knowledgeTreeExp);
  const owned = new Set(achievements.badges.map((b) => b.badgeCode));

  useEffect(() => { void readingService.notebook(childId).then((r) => setWords(r.data ?? [])); }, [childId]);

  return (
    <div className="khome">
      <div className="ksection tree-card">
        <span className="tree-emoji" aria-hidden>{stage.emoji}</span>
        <div className="grow">
          <h3 className="display">Cây tri thức: {stage.label}</h3>
          <div className="kprogress wide" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stage.progress * 100)} aria-label="Cây lớn tới mốc tiếp theo"><i style={{ width: `${stage.progress * 100}%` }} /></div>
          <p className="sub" style={{ fontSize: 14 }}>{stage.next ? `Còn ${stage.next.min - achievements.knowledgeTreeExp} ⭐ nữa để thành ${stage.next.label.toLowerCase()}.` : "Cây đã ra hoa rồi!"} Tổng cộng em có {achievements.expTotal} ⭐.</p>
          <div className="tree-steps" aria-hidden>{TREE_STAGES.map((s, i) => <span key={s.label} className={i <= stage.index ? "on" : ""}>{s.emoji}</span>)}</div>
        </div>
      </div>

      <div className="ksection">
        <h3 className="display">Huy hiệu</h3>
        <div className="badges">
          {Object.entries(BADGES).map(([code, b]) => (
            <div key={code} className={`badge-card${owned.has(code) ? " on" : ""}`} title={b.hint}>
              <span aria-hidden>{b.emoji}</span><b>{b.label}</b><small>{owned.has(code) ? "Đã đạt" : b.hint}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="ksection">
        <h3 className="display">Sổ tay từ vựng <small>{words ? `${words.length} từ` : "Đang tải…"}</small></h3>
        {words?.length === 0 && <p className="sub" style={{ fontSize: 15 }}>Khi đọc, em bấm vào chữ có gạch chân chấm để xem nghĩa và lưu vào đây nhé.</p>}
        <div className="words">
          {words?.map((w) => (
            <div key={`${w.storyId}-${w.storyVocabularyId}`} className="word-card">
              <div className="row"><b className="display grow" style={{ fontSize: 20 }}>{w.term}</b>
                <button className="kbtn small" onClick={() => narrator.speak(`${w.term}. ${w.definition}`)} aria-label={`Nghe ${w.term}`}><Volume2 /></button></div>
              <span>{w.definition}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
