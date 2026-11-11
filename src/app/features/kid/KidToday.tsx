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

  const open = roadmap.open;

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

  const lilySteps: LilyStep[] = [
    ...roadmap.done.map((d, i) => ({ key: i, storyId: d.storyId, title: d.title ?? "", cover: coverFor(d.coverImageUrl), status: "done" as const })),
    { key: 100000 + open.storyId, storyId: open.storyId, title: open.title ?? "", cover: coverFor(open.coverImageUrl), status: "current" as const, locked: open.isLocked },
    ...roadmap.upcoming.map((s) => ({ key: 200000 + s.order, storyId: s.storyId, title: s.title ?? "", cover: coverFor(s.coverImageUrl), status: "next" as const, locked: s.isLocked })),
  ];
  const onStep = (s: LilyStep) => {
    if (busy) return;
    if (s.status === "done" || (s.status === "current" && !s.locked)) { onRead(s.storyId); return; }
    if (s.status === "current") { showToast("Truyện này chưa mở, em chờ bố mẹ nhé.", "info"); return; }
    showToast("Đọc xong truyện trước để mở nhé!", "info");
  };

  const locked = open.isLocked;
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
        </div>
      </section>
      <div className="kid-today-pond" style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", minWidth: 0, overflow: "hidden" }}>
        <LilyPondRoadmap steps={lilySteps} mode="child" storageKey={`kid:${nickname || "default"}`} done={roadmap.completedCount} total={roadmap.totalCount} onStepClick={onStep} emptyText="" />
      </div>
    </>
  );
}
