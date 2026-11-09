'use client';
import { Check, Lock, Play, Search, Star } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import Frog from '@/app/components/brand/Frog';
import { coverFor } from '@/app/lib/storyView';

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
  const next = roadmap.upcoming.slice(0, 4);
  const steps = [
    ...roadmap.done.map(() => 'done' as const),
    ...(open ? ['now' as const] : []),
    ...roadmap.upcoming.map(() => 'next' as const),
  ];

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

  const locked = open.isLocked;
  return (
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

        {steps.length > 1 && (
          <div className="kid-today-steps" aria-label={`Em đã đọc ${roadmap.completedCount} trên ${roadmap.totalCount} truyện`}>
            {steps.map((s, i) => <span key={i} className={`kid-step ${s}`} aria-hidden>{s === 'done' ? <Check /> : s === 'now' ? <Star /> : <Lock />}</span>)}
            <b>{roadmap.completedCount}/{roadmap.totalCount}</b>
          </div>
        )}

        {next.length > 0 && (
          <div className="kid-today-next">
            <span className="kid-today-next-h">Tiếp theo</span>
            <div className="kid-today-next-row">
              {next.map((s) => (
                <span key={`${s.order}:${s.storyId}`} className="kid-today-mini" title={s.title ?? undefined}>
                  <span className="kid-today-mini-cover" style={{ background: coverFor(s.coverImageUrl) }}>{s.isLocked && <Lock aria-hidden />}</span>
                  <span className="kid-today-mini-t">{s.title}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
