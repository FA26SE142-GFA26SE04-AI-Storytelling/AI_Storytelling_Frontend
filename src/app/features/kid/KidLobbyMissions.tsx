'use client';

import './kid-missions.css';
import { Star, Check } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import Frog from '@/app/components/brand/Frog';
import { coverFor } from '@/app/lib/storyView';

export interface KidLobbyMissionsProps {
  roadmap: B.MyRoadmapDto | null;
  busy: boolean;
  onRead: (storyId: number) => void;
  onOpenLibrary: () => void;
}

/** Panel hiển thị danh sách nhiệm vụ đọc truyện hôm nay của bé. */
export default function KidLobbyMissions({
  roadmap,
  busy,
  onRead,
  onOpenLibrary,
}: KidLobbyMissionsProps) {
  if (!roadmap) {
    return (
      <section className="kid-mission-panel mission-panel kid-mission-loading" aria-busy="true">
        …
      </section>
    );
  }

  const currentStage = roadmap.openStories?.[0]?.stage;
  const doneRows = (roadmap.done ?? []).filter(
    (item) => currentStage !== undefined && item.stage === currentStage && Boolean(item.storyId && item.title)
  );
  const openRows = (roadmap.openStories ?? []).filter(
    (item) => Boolean(item.storyId && item.title)
  );

  if (doneRows.length === 0 && openRows.length === 0) {
    return (
      <section className="kid-mission-panel mission-panel kid-mission-empty">
        <Frog mood="think" size={120} />
        <p className="kid-mission-empty-text">Bố mẹ chưa giao nhiệm vụ</p>
        <button className="kid-btn3d is-violet" type="button" onClick={onOpenLibrary}>
          Kho truyện
        </button>
      </section>
    );
  }

  return (
    <section className="kid-mission-panel mission-panel">
      <div className="kid-mission-ribbon mission-ribbon">
        <Star aria-hidden />
        Nhiệm vụ hôm nay
      </div>
      <div className="kid-mission-list mission-list">
        {doneRows.map((item) => (
          <div key={`done-${item.storyId}`} className="kid-mission-row is-done mission-row">
            <span
              className="kid-mission-cover mission-cover"
              style={{ background: coverFor(item.coverImageUrl) }}
              aria-hidden
            />
            <span className="kid-mission-name mission-name">{item.title}</span>
            <span className="kid-mission-badge mission-badge" aria-label="Đã hoàn thành">
              <Check aria-hidden />
            </span>
          </div>
        ))}
        {openRows.map((item, index) => (
          <button
            key={`open-${item.storyId}`}
            type="button"
            className="kid-mission-row is-open mission-row"
            disabled={busy}
            onClick={() => onRead(item.storyId)}
            aria-label={`Đọc truyện ${item.title}`}
          >
            <span
              className="kid-mission-cover mission-cover"
              style={{ background: coverFor(item.coverImageUrl) }}
              aria-hidden
            />
            <span className="kid-mission-name mission-name">{item.title}</span>
            <span className="kid-mission-badge mission-badge">{index + 1}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
