'use client';

import { useEffect, useState } from 'react';
import { Award, Droplets, Flame, Lock } from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import { childAccessService } from '@/app/services/childAccessService';
import { childRewardsService } from '@/app/services/childReadingService';
import type { ChildRewards } from '@/app/types/childReading';
import './kid-hud.css';

export interface KidHudProps {
  childId: number;
  nickname: string;
  revision: number;
  onExit: () => void;
  onLobby: () => void;
  onRewards: () => void;
}

/**
 * Thanh trạng thái & điều hướng trên cùng của bé (HUD).
 * Hiển thị linh vật ếch, tên bé, cấp độ cây tri thức và các phần thưởng (giọt nước, huy hiệu, streak).
 */
export default function KidHud({
  childId,
  nickname,
  revision,
  onExit,
  onLobby,
  onRewards,
}: KidHudProps) {
  const [data, setData] = useState<ChildRewards | null>(null);

  useEffect(() => {
    const session = childAccessService.readSession();
    const token = session?.childProfileId === childId ? session.accessToken : '';
    if (!token) return;

    const controller = new AbortController();
    void childRewardsService.get(token, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.success && r.data) {
        setData(r.data);
      }
    });

    return () => controller.abort();
  }, [childId, revision]);

  const tree = data?.knowledgeTree;
  const earnedCount = data ? data.badges.filter((b) => b.earned).length : 0;
  const totalBadges = data ? data.badges.length : 0;
  const streakDays = data?.streakDays ?? 0;

  const expPercent =
    tree && tree.nextStageAt != null && tree.nextStageAt > 0
      ? Math.max(0, Math.min(100, (tree.currentTreeExp / tree.nextStageAt) * 100))
      : null;

  return (
    <header className="kid-hud">
      {/* Góc trái: Nút thông tin bé / Về sảnh */}
      <button
        type="button"
        className="kid-hud-player"
        aria-label="Về sảnh"
        onClick={onLobby}
      >
        <span className="kid-hud-avatar">
          <Frog size={52} mood="happy" />
        </span>
        <span className="kid-hud-player-info">
          {nickname ? <span className="display kid-hud-name">{nickname}</span> : null}
          {tree?.stageName ? <span className="kid-hud-stage">{tree.stageName}</span> : null}
          {expPercent != null ? (
            <div
              className="kid-hud-exp"
              role="progressbar"
              aria-valuenow={tree?.currentTreeExp}
              aria-valuemin={0}
              aria-valuemax={tree?.nextStageAt ?? undefined}
              aria-label={`Kinh nghiệm cây: ${tree?.currentTreeExp}/${tree?.nextStageAt}`}
            >
              <span style={{ width: `${expPercent}%` }} />
            </div>
          ) : null}
        </span>
      </button>

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
