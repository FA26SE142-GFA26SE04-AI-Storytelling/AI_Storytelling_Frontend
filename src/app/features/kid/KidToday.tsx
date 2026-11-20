'use client';

import { useState } from 'react';
import '@/app/styles/features/kid/kid-lobby.css';
import '@/app/styles/features/kid/kid-today.css';
import { Library, Lock, Mail, Map as MapIcon, Play, RotateCcw } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import Frog from '@/app/components/brand/Frog';
import SafeImage from '@/app/components/SafeImage';
import { showToast } from '@/app/lib/toast';
import { usePop } from '@/app/lib/motion';
import KidJourneyPath, { type JourneyStop } from './KidJourneyPath';

/** Chuyển đổi dữ liệu lộ trình thành danh sách các chặng theo đúng thứ tự. */
function buildStops(roadmap: B.MyRoadmapDto | null): JourneyStop[] {
  if (!roadmap) return [];

  const doneStops: JourneyStop[] = [...roadmap.done]
    .sort((a, b) => a.stage - b.stage)
    .map((d) => ({
      storyId: d.storyId,
      title: d.title,
      coverImageUrl: d.coverImageUrl,
      status: 'done',
    }));

  const openStops: JourneyStop[] = (roadmap.openStories ?? []).map((o) => ({
    storyId: o.storyId,
    title: o.title,
    coverImageUrl: o.coverImageUrl,
    status: 'open',
  }));

  const upcomingStops: JourneyStop[] = [...(roadmap.upcoming ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((u) => ({
      storyId: u.storyId,
      title: u.title,
      coverImageUrl: u.coverImageUrl,
      status: 'locked',
    }));

  return [...doneStops, ...openStops, ...upcomingStops];
}

export default function KidToday({
  roadmap,
  nickname,
  busy,
  onRead,
  onOpenLibrary,
}: {
  roadmap: B.MyRoadmapDto | null;
  nickname: string;
  busy: boolean;
  onRead: (storyId: number) => void;
  onOpenLibrary: () => void;
}) {
  const stops = roadmap ? buildStops(roadmap) : [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const defaultStop =
    stops.find((s) => s.status === 'open') ??
    stops.find((s) => s.status === 'locked') ??
    stops[stops.length - 1];
  const selected = stops.find((s) => s.storyId === selectedId) ?? defaultStop;
  const cardRef = usePop<HTMLElement>(selected?.storyId);

  const hello = nickname ? `Chào ${nickname}!` : 'Chào em!';
  if (!roadmap) {
    return (
      <div className="kl-panel kid-today-center kid-today-loading" aria-busy="true">
        <Frog mood="think" size={96} />
        <p className="display kid-today-say">{hello}</p>
      </div>
    );
  }

  const opens = roadmap.openStories ?? [];
  const open = opens[0];

  if (!open) {
    const finished = roadmap.isFinished && roadmap.totalCount > 0;
    return (
      <div className="kl-panel kid-today-center kid-today-empty">
        <Frog mood="think" size={96} />
        <p className="display kid-today-say">
          {finished
            ? 'Em đã đọc hết truyện bố mẹ chọn rồi. Giỏi quá!'
            : 'Hôm nay em muốn đọc truyện gì?'}
        </p>
        <button type="button" className="kid-btn3d is-gold is-big" onClick={onOpenLibrary}>
          <Library aria-hidden="true" />Chọn truyện
        </button>
      </div>
    );
  }

  if (!selected) {
    return null;
  }

  const onStop = (stop: JourneyStop) => {
    setSelectedId(stop.storyId);
    if (stop.status === 'locked') {
      showToast('Đọc xong truyện trước để mở nhé!', 'info');
    }
  };

  const note = opens.find((o) => o.storyId === selected.storyId)?.note;

  return (
    <section className="kl-panel kid-today-journey">
      <h2 className="kl-head display">
        <MapIcon aria-hidden="true" />Hành trình của em
        <span
          className="kid-today-count"
          aria-label={`Đã đọc ${roadmap.completedCount} trên ${roadmap.totalCount} truyện`}
        >
          {roadmap.completedCount}/{roadmap.totalCount}
        </span>
      </h2>
      <div className="kid-today-body">
        <article ref={cardRef} className={`kj-card is-${selected.status}`}>
          <span className={`kj-ribbon is-${selected.status}`}>
            {selected.status === 'open'
              ? 'Hôm nay'
              : selected.status === 'done'
                ? 'Đã đọc'
                : 'Chưa mở'}
          </span>
          <SafeImage src={selected.coverImageUrl} alt="" className="kj-cover" />
          <h3 className="kj-title display">{selected.title ?? 'Truyện bố mẹ chọn'}</h3>
          {note && (
            <p className="kj-note">
              <Mail aria-hidden="true" />
              <span>{note}</span>
            </p>
          )}
          {selected.status === 'open' && (
            <button
              type="button"
              className="kid-btn3d is-gold is-big kj-action"
              disabled={busy}
              onClick={() => onRead(selected.storyId)}
            >
              <Play aria-hidden="true" />Đọc ngay
            </button>
          )}
          {selected.status === 'done' && (
            <button
              type="button"
              className="kid-btn3d is-green kj-action"
              disabled={busy}
              onClick={() => onRead(selected.storyId)}
            >
              <RotateCcw aria-hidden="true" />Đọc lại
            </button>
          )}
          {selected.status === 'locked' && (
            <button type="button" className="kid-btn3d is-sky kj-action" disabled>
              <Lock aria-hidden="true" />Chưa mở
            </button>
          )}
        </article>
        <KidJourneyPath
          stops={stops}
          selectedId={selected.storyId}
          onSelect={onStop}
          finished={roadmap.isFinished}
        />
      </div>
    </section>
  );
}
