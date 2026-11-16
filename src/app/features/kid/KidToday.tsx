'use client';
import { Lock, Play, Search, Star } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import Frog from '@/app/components/brand/Frog';
import { coverFor } from '@/app/lib/storyView';
import LilyPondRoadmap, { type LilyStep } from '@/app/components/roadmap/LilyPondRoadmap';
import { showToast } from '@/app/lib/toast';

/** Đưa bé xuống ô tìm truyện (khi chưa có truyện bố mẹ chọn hoặc đã đọc hết). */
function goToSearch() {
  const input = document.querySelector<HTMLInputElement>('.kid-search input');
  input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input?.focus({ preventScroll: true });
}

/** Gom truyện theo số chặng, trả các nhóm theo thứ tự số tăng dần. */
function byStage<T>(list: T[], key: (item: T) => number): [number, T[]][] {
  const map = new Map<number, T[]>();
  for (const item of list) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

/**
 * Khung đầu trang của bé: "Hôm nay em đọc". Bé vào là thấy ngay một truyện to và một nút "Đọc ngay",
 * kèm lời nhắn của bố mẹ, các chấm tiến độ của hành trình và những truyện tiếp theo.
 * Chưa có hành trình hoặc đã đọc hết thì chỉ cho bé xuống chọn truyện ở thư viện.
 */
export default function KidToday({ roadmap, nickname, busy, onRead }: {
  roadmap: B.MyRoadmapDto | null;
  nickname: string;
  busy: boolean;
  onRead: (storyId: number) => void;
}) {
  const hello = nickname ? `Chào ${nickname}!` : 'Chào em!';
  if (!roadmap) return <section className="kid-today kid-today-loading" aria-busy="true"><Frog mood="think" size={88} /><b className="display">{hello}</b></section>;

  const opens = roadmap.openStories;
  const open = opens[0];

  if (!open) {
    const finished = roadmap.isFinished && roadmap.totalCount > 0;
    return (
      <section className="kid-today kid-today-empty">
        <Frog mood="happy" size={120} />
        <div className="kid-today-body">
          <b className="display kid-today-hello">{hello}</b>
          <p className="kid-today-say">{finished ? 'Em đã đọc hết truyện bố mẹ chọn rồi. Giỏi quá!' : 'Hôm nay em muốn đọc truyện gì?'}</p>
          <button className="kid-today-go" onClick={goToSearch}><Search aria-hidden />Chọn truyện</button>
        </div>
      </section>
    );
  }

  const currentStage = open.stage;
  const doneGroups = byStage(roadmap.done.filter((d) => d.stage !== currentStage), (d) => d.stage);
  const doneInCurrent = roadmap.done.filter((d) => d.stage === currentStage).length;
  const lilySteps: LilyStep[] = [
    ...doneGroups.map(([stage, list]) => ({ key: stage, stage, storyId: list[0].storyId, title: list[0].title ?? "", cover: coverFor(list[0].coverImageUrl), status: "done" as const, count: list.length })),
    { key: 100000 + currentStage, stage: currentStage, storyId: open.storyId, title: open.title ?? "", cover: coverFor(open.coverImageUrl), status: "current" as const, locked: !!open.isLocked, count: opens.length + doneInCurrent },
    ...byStage(roadmap.upcoming, (s) => s.order).map(([order, list]) => ({ key: 200000 + order, stage: currentStage + order, storyId: list[0].storyId, title: list[0].title ?? "", cover: coverFor(list[0].coverImageUrl), status: "next" as const, locked: true, count: list.length })),
  ];
  const onStep = (s: LilyStep) => {
    if (busy) return;
    if (s.status === "current" && opens.length > 1 && !s.locked) { showToast("Hôm nay em có nhiều truyện, chọn một truyện ở trên nhé!", "info"); return; }
    if (s.status === "done" || (s.status === "current" && !s.locked)) { onRead(s.storyId); return; }
    if (s.status === "current") { showToast("Truyện này chưa mở, em chờ bố mẹ nhé.", "info"); return; }
    showToast("Đọc xong truyện trước để mở nhé!", "info");
  };

  const locked = !!open.isLocked;
  return (
    <>
      <section className="kid-today" aria-label="Truyện hôm nay của em">
        <button className="kid-today-cover" style={{ background: coverFor(open.coverImageUrl) }} disabled={busy || locked} onClick={() => onRead(open.storyId)} aria-label={`Đọc truyện ${open.title ?? ''}`}>
          {!open.coverImageUrl && <span className="bk-name display">{open.title}</span>}
          {!locked && <span className="kid-today-play" aria-hidden><Play /></span>}
        </button>
        <div className="kid-today-body">
          <b className="display kid-today-hello">{hello}</b>
          <span className="kid-today-tag"><Star aria-hidden />Hôm nay em đọc</span>
          <h2 className="display kid-today-title">{open.title ?? 'Truyện bố mẹ chọn'}</h2>
          {open.note && <p className="kid-today-note">💌 {open.note}</p>}
          {locked
            ? <p className="kid-today-say"><Lock aria-hidden />Truyện này chưa mở, em chờ bố mẹ nhé.</p>
            : <button className="kid-today-go" disabled={busy} onClick={() => onRead(open.storyId)}><Play aria-hidden />Đọc ngay</button>}
          {opens.length > 1 && (
            <div className="kid-today-more" aria-label="Truyện khác hôm nay">
              <span className="kid-today-more-h">Hôm nay em còn đọc được</span>
              <div className="kid-today-more-row">
                {opens.slice(1).map((s) => (
                  <button key={s.storyId} className="kid-today-more-item" disabled={busy || !!s.isLocked} onClick={() => onRead(s.storyId)} aria-label={`Đọc truyện ${s.title ?? ''}`}>
                    <span className="kid-today-more-cover" style={{ background: coverFor(s.coverImageUrl) }} aria-hidden />
                    <b>{s.title ?? 'Truyện bố mẹ chọn'}</b>
                    {s.note && <small>💌 {s.note}</small>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <div className="kid-today-pond" style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", minWidth: 0, overflow: "hidden" }}>
        <LilyPondRoadmap steps={lilySteps} mode="child" storageKey={`kid:${nickname || "default"}`} done={roadmap.completedCount} total={roadmap.totalCount} onStepClick={onStep} emptyText="" />
      </div>
    </>
  );
}
