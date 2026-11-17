"use client";

import { Moon, Sprout } from "lucide-react";
import type * as B from "@/app/types/backendContracts";
import KidGreeting from "./KidGreeting";
import KidToday from "./KidToday";
import KidLobbyMissions from "./KidLobbyMissions";
import "./kid-lobby.css";

export interface KidLobbyProps {
  roadmap: B.MyRoadmapDto | null;
  nickname: string;
  busy: boolean;
  onRead: (storyId: number) => void;
  onOpenLibrary: () => void;
  onRewards: () => void;
}

/**
 * Sảnh chính của bé (khu "lobby") - không gian đầm sen rực rỡ với bạn ếch,
 * nhiệm vụ hôm nay, gợi ý truyện đọc và lối vào vườn cây phần thưởng.
 */
export default function KidLobby({
  roadmap,
  nickname,
  busy,
  onRead,
  onOpenLibrary,
  onRewards,
}: KidLobbyProps) {
  return (
    <div className="kid-lobby">
      {/* Nền sảnh đầm sen trang trí (sau nội dung, pointer-events none) */}
      <div className="kid-lobby-backdrop" aria-hidden="true">
        <div className="kid-lobby-sky" />
        <div className="kid-lobby-sun" />
        <Moon className="kid-lobby-moon" />
        <div className="kid-lobby-cloud kid-lobby-cloud-1" />
        <div className="kid-lobby-cloud kid-lobby-cloud-2" />
        <div className="kid-lobby-hill" />
      </div>

      {/* Lưới bố cục 3 cột sảnh */}
      <div className="kid-lobby-grid">
        {/* Cột trái: Nhiệm vụ hôm nay */}
        <div className="kid-lobby-left">
          <KidLobbyMissions
            roadmap={roadmap}
            busy={busy}
            onRead={onRead}
            onOpenLibrary={onOpenLibrary}
          />
        </div>

        {/* Cột giữa: Sân khấu bạn ếch và Truyện hôm nay */}
        <div className="kid-lobby-center">
          <div className="kid-lobby-stage">
            <KidGreeting nickname={nickname} roadmap={roadmap} />
            <div className="kid-lobby-pad" aria-hidden="true" />
          </div>

          <KidToday
            part="cover"
            roadmap={roadmap}
            nickname={nickname}
            busy={busy}
            onRead={onRead}
            onOpenLibrary={onOpenLibrary}
          />
        </div>

        {/* Cột phải: Ô 3D vào Cây */}
        <div className="kid-lobby-right">
          <button
            type="button"
            className="kid-tower-tile kid-btn3d is-green"
            onClick={onRewards}
            aria-label="Mở cây của em"
          >
            <span className="kid-btn3d-icon">
              <Sprout aria-hidden="true" />
            </span>
            <span className="kid-btn3d-label">Cây</span>
          </button>
        </div>
      </div>
    </div>
  );
}
