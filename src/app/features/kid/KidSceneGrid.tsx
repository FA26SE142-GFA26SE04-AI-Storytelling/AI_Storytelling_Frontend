'use client';
import { Check } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';

export type SceneTile = { key: string; sceneIndex: number; url: string | null };

/** Lưới tranh nhỏ "Cảnh N" để bé chọn một ô: ô đang chọn viền vàng, ô trong `done` có dấu tích và bị khoá. */
export default function KidSceneGrid<T extends SceneTile>({ tiles, picked, done = [], doneLabel = '', disabled, label, onPick }: {
  tiles: T[]; picked: string | null; done?: string[]; doneLabel?: string; disabled?: boolean; label: string; onPick: (tile: T) => void;
}) {
  return <div className="kid-ask-grid" role="group" aria-label={label}>
    {tiles.map(t => {
      const isDone = done.includes(t.key);
      return <button key={t.key} type="button" className={`kid-ask-tile${isDone ? ' is-done' : ''}`} aria-pressed={picked === t.key}
        disabled={isDone || disabled} aria-label={`Cảnh ${t.sceneIndex + 1}${isDone ? `, ${doneLabel}` : ''}`} onClick={() => onPick(t)}>
        <SafeImage src={t.url} alt="" loading="lazy" />
        <span className="kid-ask-tag">Cảnh {t.sceneIndex + 1}</span>
        {isDone && <span className="kid-ask-done" aria-hidden="true"><Check /></span>}
      </button>;
    })}
  </div>;
}
