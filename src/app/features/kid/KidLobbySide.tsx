"use client";

import { useEffect, useState } from "react";
import { BookA, Home, NotebookPen } from "lucide-react";
import type * as B from "@/app/types/backendContracts";
import type { NotebookEntry } from "@/app/types/childReading";
import { coverFor } from "@/app/lib/storyView";
import { showToast } from "@/app/lib/toast";
import { childAccessService } from "@/app/services/childAccessService";
import { childNotebookService } from "@/app/services/childReadingService";

/** Số từ hiện trong khung, còn lại xem trong Sổ tay. */
const WORDS_SHOWN = 6;

/** Cột phải của sảnh: dải "Truyện gia đình" và khung "Từ vựng của em" (các từ bé lưu vào Sổ tay, mới nhất trước). */
export default function KidLobbySide({
  childId,
  busy,
  familyStories,
  onOpenFamily,
  onNotebook,
}: {
  childId: number;
  busy: boolean;
  familyStories: B.ParentFamilyConfirmationDto[];
  onOpenFamily: (confirmation: B.ParentFamilyConfirmationDto) => void;
  onNotebook: () => void;
}) {
  const [active, setActive] = useState(0);
  const [words, setWords] = useState<NotebookEntry[] | null>(null);
  const count = familyStories.length;

  useEffect(() => {
    const session = childAccessService.readSession();
    if (session?.childProfileId !== childId) return;
    const controller = new AbortController();
    void childNotebookService.list(session.accessToken, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.success) setWords([...(r.data ?? [])].sort((a, b) => b.collectedAt.localeCompare(a.collectedAt)));
      else { setWords([]); showToast(r.message, "err"); }
    });
    return () => controller.abort();
  }, [childId]);

  return (
    <>
      {count > 0 && (
        <section className="kl-panel kl-family" aria-labelledby="kl-family-h">
          <h2 id="kl-family-h" className="kl-ribbon display"><Home aria-hidden="true" />Truyện gia đình</h2>
          <div
            className="kl-family-strip"
            onScroll={(e) => {
              const el = e.currentTarget;
              const max = el.scrollWidth - el.clientWidth;
              setActive(max > 0 ? Math.round((el.scrollLeft / max) * (count - 1)) : 0);
            }}
          >
            {familyStories.map((c) => (
              <button
                key={c.confirmationId}
                type="button"
                className="kl-family-item"
                disabled={busy}
                onClick={() => onOpenFamily(c)}
                aria-label={`Đọc truyện gia đình #${c.storyId}`}
              >
                <span className="kl-family-cover" style={{ background: coverFor(null) }} aria-hidden="true" />
                <span className="kl-family-name display">Truyện gia đình #{c.storyId}</span>
              </button>
            ))}
          </div>
          {count > 1 && (
            <span className="kl-dots" aria-hidden="true">
              {familyStories.map((c, i) => <span key={c.confirmationId} className={i === active ? "on" : undefined} />)}
            </span>
          )}
        </section>
      )}

      <section className="kl-panel kl-words" aria-labelledby="kl-words-h" aria-busy={words === null}>
        <h2 id="kl-words-h" className="kl-head kl-words-head display"><BookA aria-hidden="true" />Từ vựng của em</h2>
        {words && words.length === 0 && <p className="kl-words-empty">Em chưa lưu từ nào. Gặp từ mới trong truyện thì bấm lưu nhé!</p>}
        {words && words.length > 0 && (
          <>
            <ul className="kl-words-list">
              {words.slice(0, WORDS_SHOWN).map((w, i) => (
                <li key={w.entryId} className="kl-word" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                  <b className="display">{w.term}</b>
                  <span>{w.definition}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="kid-btn3d is-mint kl-words-go" onClick={onNotebook}>
              <NotebookPen aria-hidden="true" />{words.length > WORDS_SHOWN ? `Xem cả ${words.length} từ` : "Mở sổ tay"}
            </button>
          </>
        )}
      </section>
    </>
  );
}
