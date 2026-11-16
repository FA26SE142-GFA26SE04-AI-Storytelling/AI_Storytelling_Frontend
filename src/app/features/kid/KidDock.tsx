'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, NotebookPen, Sparkles, Sprout } from 'lucide-react';
import { bounce, prefersReducedMotion } from '@/app/lib/motion';
import './kid-dock.css';

export type DockTab = 'stories' | 'notebook' | 'wishes' | 'rewards';

export const DOCK_TINT: Record<DockTab, string> = {
  stories: 'color-mix(in srgb, color-mix(in srgb, var(--mint) 12%, var(--bg)) 80%, transparent)',
  notebook: 'color-mix(in srgb, color-mix(in srgb, var(--sky) 12%, var(--bg)) 80%, transparent)',
  wishes: 'color-mix(in srgb, color-mix(in srgb, var(--lotus) 14%, var(--bg)) 80%, transparent)',
  rewards: 'color-mix(in srgb, color-mix(in srgb, var(--gold) 14%, var(--bg)) 80%, transparent)',
};

interface DockItem {
  id: DockTab;
  label: string;
  icon: typeof BookOpen;
  color: string;
}

const ITEMS: readonly DockItem[] = [
  { id: 'stories', label: 'Truyện', icon: BookOpen, color: 'var(--primary)' },
  { id: 'notebook', label: 'Sổ tay', icon: NotebookPen, color: 'var(--sky)' },
  { id: 'wishes', label: 'Điều ước', icon: Sparkles, color: 'var(--lotus)' },
  { id: 'rewards', label: 'Cây', icon: Sprout, color: 'var(--gold-deep)' },
];

/** Thanh điều hướng dưới của bé: 4 mục chọn nhanh với lá sen trượt theo mục chọn. */
export default function KidDock({ value, onChange }: { value: DockTab; onChange: (v: DockTab) => void }) {
  const [reduced, setReduced] = useState(false);
  const [lastPicked, setLastPicked] = useState<{ id: DockTab; n: number } | null>(null);
  const iconRefs = useRef<Partial<Record<DockTab, HTMLSpanElement | null>>>({});

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  const activeIndex = Math.max(0, ITEMS.findIndex((item) => item.id === value));

  return (
    <nav className="kid-dock" aria-label="Thư viện của em">
      <span
        className="kid-dock-leaf"
        aria-hidden="true"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
          ...(reduced ? { transition: 'none' } : {}),
        }}
      />
      {ITEMS.map((item) => {
        const isSelected = value === item.id;
        const IconComponent = item.icon;
        const showSprout = !prefersReducedMotion() && lastPicked?.id === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className="kid-dock-item"
            aria-pressed={isSelected}
            onClick={() => {
              onChange(item.id);
              bounce(iconRefs.current[item.id] ?? null);
              setLastPicked((prev) => ({ id: item.id, n: (prev?.n ?? 0) + 1 }));
            }}
          >
            <span
              ref={(el) => {
                iconRefs.current[item.id] = el;
              }}
              className="kid-dock-icon"
              style={{ '--item-color': item.color } as React.CSSProperties}
            >
              <IconComponent className="kid-dock-svg" aria-hidden="true" />
              {showSprout && (
                <span key={lastPicked.n} className="kid-dock-sprout" aria-hidden="true">
                  <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true">
                    <path
                      d="M9 16C9 10 4 10 3 6C7 5 10 9 9 16Z"
                      fill="var(--primary)"
                    />
                    <path
                      d="M9 16C9 9 14 8 15 4C11 4 8 8 9 16Z"
                      fill="color-mix(in srgb, var(--primary) 60%, var(--gold))"
                    />
                  </svg>
                </span>
              )}
            </span>
            <span className="kid-dock-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
