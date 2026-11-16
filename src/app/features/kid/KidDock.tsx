'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, NotebookPen, Sparkles, Sprout } from 'lucide-react';
import { bounce, prefersReducedMotion } from '@/app/lib/motion';
import './kid-dock.css';

export type DockTab = 'stories' | 'notebook' | 'wishes' | 'rewards';

export const DOCK_TINT: Record<DockTab, string> = {
  stories: 'color-mix(in srgb, var(--mint) 12%, var(--bg))',
  notebook: 'color-mix(in srgb, var(--sky) 12%, var(--bg))',
  wishes: 'color-mix(in srgb, var(--lotus) 14%, var(--bg))',
  rewards: 'color-mix(in srgb, var(--gold) 14%, var(--bg))',
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
        return (
          <button
            key={item.id}
            type="button"
            className="kid-dock-item"
            aria-pressed={isSelected}
            onClick={() => {
              onChange(item.id);
              bounce(iconRefs.current[item.id] ?? null);
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
            </span>
            <span className="kid-dock-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
