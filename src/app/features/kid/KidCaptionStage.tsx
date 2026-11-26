'use client';

import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Caption, type VocabRange } from './ChildReaderCaption';
import { splitCaptionChunks, chunkAt, chunkByRatio, type CaptionChunk } from './captions';

interface Props {
  text: string;
  part: { start: number; end: number };
  reading: { start: number; end: number } | null;
  progress: number | null;
  playing: boolean;
  hasTimings: boolean;
  vocab: VocabRange[];
  renderVocab: (id: number, children: ReactNode, key: number) => ReactNode;
  onNextPage: () => void;
}

export default function KidCaptionStage({
  text, part, reading, progress, playing, hasTimings, vocab, renderVocab, onNextPage,
}: Props) {
  // Tách đoạn chữ của tranh thành các khúc, chuyển về toạ độ cả cảnh
  const chunks = useMemo<CaptionChunk[]>(() => {
    const raw = splitCaptionChunks(text.slice(part.start, part.end));
    return raw.map(c => ({ text: c.text, start: c.start + part.start, end: c.end + part.start }));
  }, [text, part.start, part.end]);

  const [manual, setManual] = useState(0);

  // Xác định khúc đang hiện theo giọng kể hoặc thủ công
  const rawActive =
    playing && reading && hasTimings ? chunkAt(chunks, reading.start)
    : playing && !hasTimings && progress !== null ? chunkByRatio(chunks, progress)
    : manual;
  const active = Math.max(0, Math.min(rawActive, Math.max(0, chunks.length - 1)));

  // Giữ manual đồng bộ với active khi đang phát
  useEffect(() => { setManual(active); }, [active]);

  if (chunks.length === 0) return null;

  const chunk = chunks[active];

  // Bấm/Enter/Space sang khúc kế hoặc trang kế (chỉ khi không phát)
  const handleAdvance = () => {
    if (playing) return;
    if (manual < chunks.length - 1) setManual(manual + 1);
    else onNextPage();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAdvance(); }
  };

  return (
    <div
      key={active}
      className="kid-caption-sub"
      role="button"
      tabIndex={0}
      aria-label="Phụ đề, bấm để xem đoạn kế"
      onClick={handleAdvance}
      onKeyDown={handleKeyDown}
    >
      <Caption
        text={text}
        part={{ start: chunk.start, end: chunk.end }}
        result={null}
        segment={null}
        segmentStart={0}
        reading={reading}
        vocab={vocab}
        renderVocab={renderVocab}
        dimUnread={!!reading}
      />
    </div>
  );
}
