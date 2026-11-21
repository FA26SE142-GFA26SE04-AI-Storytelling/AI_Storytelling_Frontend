'use client';

import { useEffect, useState } from 'react';
import { Award, Droplets, Flame, Lock, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { circleReveal } from '@/app/lib/motion';
import { childAccessService } from '@/app/services/childAccessService';
import { childRewardsService } from '@/app/services/childReadingService';
import type { ChildRewards } from '@/app/types/childReading';
import KidDock, { type DockTab } from './KidDock';
import '@/app/styles/features/kid/kid-hud.css';

/** Phần thưởng của bé (cây tri thức, huy hiệu, streak). Gọi một lần ở trang cha rồi chia cho HUD và sảnh. */
export function useKidRewards(childId: number, revision: number): ChildRewards | null {
  const [data, setData] = useState<ChildRewards | null>(null);

  useEffect(() => {
    const session = childAccessService.readSession();
    const token = session?.childProfileId === childId ? session.accessToken : '';
    if (!token) return;

    const controller = new AbortController();
    void childRewardsService.get(token, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.success && r.data) setData(r.data);
    });

    return () => controller.abort();
  }, [childId, revision]);

  return data;
}

export interface KidHudProps {
  rewards: ChildRewards | null;
  pane: DockTab;
  onPane: (pane: DockTab) => void;
  showDock: boolean;
  onExit: () => void;
  onRewards: () => void;
}

/**
 * Thanh trên cùng của bé (HUD): bên trái là dock 5 khu, bên phải là các chip phần thưởng
 * (giọt nước, huy hiệu, streak) và nút khóa dành cho bố mẹ.
 */
export default function KidHud({ rewards: data, pane, onPane, showDock, onExit, onRewards }: KidHudProps) {
  const tree = data?.knowledgeTree;
  const earnedCount = data ? data.badges.filter((b) => b.earned).length : 0;
  const totalBadges = data ? data.badges.length : 0;
  const streakDays = data?.streakDays ?? 0;
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';

  return (
    <header className="kid-hud">
      {showDock && <KidDock value={pane} onChange={onPane} />}

      {/* Góc phải: Các chip phần thưởng & Nút khóa dành cho bố mẹ */}
      <div className="kid-hud-right">
        <button
          type="button"
          className="kid-hud-chip"
          aria-label="Xem phần thưởng"
          onClick={onRewards}
        >
          <span className="kid-hud-chip-ic kid-hud-chip-droplets">
            <Droplets size={20} aria-hidden="true" />
          </span>
          <span>{data && tree ? tree.expToWater : '…'}</span>
        </button>

        <button
          type="button"
          className="kid-hud-chip"
          aria-label="Xem phần thưởng"
          onClick={onRewards}
        >
          <span className="kid-hud-chip-ic kid-hud-chip-award">
            <Award size={20} aria-hidden="true" />
          </span>
          <span>{data ? `${earnedCount}/${totalBadges}` : '…'}</span>
        </button>

        {streakDays > 0 ? (
          <button
            type="button"
            className="kid-hud-chip"
            aria-label="Xem phần thưởng"
            onClick={onRewards}
          >
            <span className="kid-hud-chip-ic kid-hud-chip-flame">
              <Flame size={20} aria-hidden="true" />
            </span>
            <span>{streakDays}</span>
          </button>
        ) : null}

        {/* Đổi sáng / tối giống header phụ huynh (cùng hiệu ứng lan tròn), dùng lại kiểu nút khoá cho đồng bộ. */}
        <button
          type="button"
          className="kid-hud-lock kid-hud-theme"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme); }}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {theme === 'dark' ? <Sun size={24} aria-hidden="true" /> : <Moon size={24} aria-hidden="true" />}
        </button>

        <button
          type="button"
          className="kid-hud-lock"
          onClick={onExit}
          aria-label="Dành cho bố mẹ"
          title="Dành cho bố mẹ"
        >
          <Lock size={24} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
