'use client';
import { useState } from 'react';
import { useAccess } from './staffAccess';
import { confirmDialog } from '@/app/lib/confirm';
import RoadmapAuthoringWorkspace from './RoadmapAuthoringWorkspace';
import RoadmapPublishedView from './RoadmapPublishedView';
import RoadmapReviewWorkspace from './RoadmapReviewWorkspace';
import '@/app/styles/features/staff/roadmap-templates.css';

type RoadmapMode = 'author' | 'review' | 'published' | 'archived';

const MODES: { id: RoadmapMode; label: string }[] = [
  { id: 'author', label: 'Soạn lộ trình' },
  { id: 'review', label: 'Duyệt lộ trình' },
  { id: 'published', label: 'Đang phát hành' },
  { id: 'archived', label: 'Lưu trữ' },
];

/** Tài liệu 08 — Lộ trình mẫu: chia Soạn lộ trình, Duyệt lộ trình, Đang phát hành và Lưu trữ. */
export default function RoadmapTemplates() {
  const author = useAccess('template.roadmap.author');
  const review = useAccess('review.roadmap');
  const modes = MODES.filter(m => !(m.id === 'author' && author.state === 'Hidden') && !(m.id === 'review' && review.state === 'Hidden'));
  const [picked, setMode] = useState<RoadmapMode | null>(null);
  // Chưa chọn: người soạn được thì vào Soạn, người chỉ xem (Admin khi còn Moderator) thì vào khu đầu tiên khác Soạn.
  const fallback = (author.state === 'Allowed' ? modes[0] : modes.find(m => m.id !== 'author') ?? modes[0]).id;
  const mode = picked && modes.some(m => m.id === picked) ? picked : fallback;
  const [authorDirty, setAuthorDirty] = useState(false);
  const [pendingOpenDraftId, setPendingOpenDraftId] = useState<number | null>(null);

  const switchMode = async (next: RoadmapMode) => {
    if (next === mode) return;
    if (mode === 'author' && authorDirty && !(await confirmDialog('Bạn có thay đổi lộ trình chưa lưu. Rời sang khu vực khác?'))) return;
    setAuthorDirty(false);
    setMode(next);
  };

  return (
    <div className="rt-wrap">
      <div className="rt-modebar">
        <div className="rt-modepills" role="group" aria-label="Phân khu lộ trình mẫu">
          {modes.map(m => (
            <button key={m.id} type="button" aria-pressed={mode === m.id} className={mode === m.id ? 'on' : ''} onClick={() => void switchMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rt-stage">
        {mode === 'author' && (
          <RoadmapAuthoringWorkspace
            pendingDraftId={pendingOpenDraftId}
            onConsumedDraft={() => setPendingOpenDraftId(null)}
            onDirtyChange={setAuthorDirty}
          />
        )}
        {mode === 'review' && <RoadmapReviewWorkspace />}
        {(mode === 'published' || mode === 'archived') && (
          <RoadmapPublishedView
            mode={mode}
            onCloneToDraft={id => {
              setPendingOpenDraftId(id);
              setMode('author');
            }}
          />
        )}
      </div>
    </div>
  );
}
