'use client';

import { useEffect, useRef, useState } from 'react';
import { Home, Library, Map, NotebookPen, Sparkles, type LucideIcon } from 'lucide-react';
import { bounce, prefersReducedMotion } from '@/app/lib/motion';
import '@/app/styles/features/kid/kid-dock.css';

export type DockTab = 'lobby' | 'library' | 'journey' | 'notebook' | 'wishes' | 'rewards';

export const DOCK_TINT: Record<DockTab, string> = {
  lobby: 'color-mix(in srgb, color-mix(in srgb, var(--sky) 12%, var(--bg)) 80%, transparent)',
  library: 'color-mix(in srgb, color-mix(in srgb, var(--gold) 14%, var(--bg)) 80%, transparent)',
  journey: 'color-mix(in srgb, color-mix(in srgb, var(--primary) 14%, var(--bg)) 80%, transparent)',
  notebook: 'color-mix(in srgb, color-mix(in srgb, var(--mint) 12%, var(--bg)) 80%, transparent)',
  wishes: 'color-mix(in srgb, color-mix(in srgb, var(--lotus) 14%, var(--bg)) 80%, transparent)',
  rewards: 'color-mix(in srgb, color-mix(in srgb, var(--gold) 14%, var(--bg)) 80%, transparent)',
};

interface DockItem {
  id: DockTab;
  label: string;
  icon: LucideIcon;
  variant: 'is-green' | 'is-gold' | 'is-sky' | 'is-mint' | 'is-pink';
}

const ITEMS: readonly DockItem[] = [
  { id: 'lobby', label: 'Sảnh', icon: Home, variant: 'is-green' },
  { id: 'library', label: 'Kho truyện', icon: Library, variant: 'is-gold' },
  { id: 'journey', label: 'Hành trình', icon: Map, variant: 'is-sky' },
  { id: 'notebook', label: 'Sổ tay', icon: NotebookPen, variant: 'is-mint' },
  { id: 'wishes', label: 'Điều ước', icon: Sparkles, variant: 'is-pink' },
];

/** Thanh dock điều hướng 5 khu vực cho bé với nút 3D và hiệu ứng mầm lá */
export default function KidDock({ value, onChange }: { value: DockTab; onChange: (v: DockTab) => void }) {
  const [reduced, setReduced] = useState(false);
  const [lastPicked, setLastPicked] = useState<{ id: DockTab; n: number } | null>(null);
  const iconRefs = useRef<Partial<Record<DockTab, HTMLSpanElement | null>>>({});

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  return (
    <nav className="kid-dock" aria-label="Các khu của em">
      <div className="kid-dock-row">
        {ITEMS.map((item) => {
          const active = value === item.id;
          const Icon = item.icon;
          const showSprout = !reduced && lastPicked?.id === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`kid-btn3d kid-dock-item ${item.variant}${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => {
                onChange(item.id);
                setLastPicked((prev) => ({ id: item.id, n: (prev?.n ?? 0) + 1 }));
                bounce(iconRefs.current[item.id] ?? null);
              }}
            >
              <span
                ref={(el) => {
                  iconRefs.current[item.id] = el;
                }}
                className="kid-btn3d-icon"
              >
                <Icon aria-hidden="true" />
              </span>
              <span className="kid-btn3d-label">{item.label}</span>
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
