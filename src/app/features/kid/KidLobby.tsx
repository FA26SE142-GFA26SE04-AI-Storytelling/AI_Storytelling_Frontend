"use client";

import type * as B from "@/app/types/backendContracts";
import type { ChildRewards } from "@/app/types/childReading";
import { useRiseIn } from "@/app/lib/motion";
import { Award, Map as MapIcon, NotebookPen, Sparkles } from "lucide-react";
import KidLobbyStage, { StageButton, StageCards } from "./KidLobbyStage";
import KidLobbySide from "./KidLobbySide";
import KidLobbyStories from "./KidLobbyStories";
import "@/app/styles/features/kid/kid-lobby.css";
import { KID_FEATURE, useKidFeature } from './kidFeatures';

export interface KidLobbyProps {
  roadmap: B.MyRoadmapDto | null;
  nickname: string;
  busy: boolean;
  rewards: ChildRewards | null;
  familyStories: B.ParentFamilyConfirmationDto[];
  childId: number;
  onRead: (storyId: number) => void;
  onOpenLibrary: () => void;
  onRewards: () => void;
  onJourney: () => void;
  onNotebook: () => void;
  onWishes: () => void;
  onOpenFamily: (confirmation: B.ParentFamilyConfirmationDto) => void;
}

/**
 * Sảnh chính của bé kiểu "sân khấu linh vật": truyện em đọc được (trái),
 * sân khấu bạn ếch với các nút đi tới mọi khu (giữa), truyện gia đình + từ vựng (phải).
 */
export default function KidLobby(props: KidLobbyProps) {
  // Khung hai bên và các nút sân khấu hiện lần lượt khi vào sảnh.
  const ref = useRiseIn<HTMLDivElement>(".kl-panel, .kls-btn", [], { delay: 70 });
  const { busy, rewards } = props;
  const notebookOn = useKidFeature(KID_FEATURE.notebook);
  const wishesOn = useKidFeature(KID_FEATURE.wishes);
  const rewardsOn = useKidFeature(KID_FEATURE.rewards);
  const earned = rewards ? rewards.badges.filter((b) => b.earned).length : 0;

  return (
    <div ref={ref} className="kid-lobby">
      <div className="kl-col kl-left">
        <KidLobbyStories childId={props.childId} busy={busy} onRead={props.onRead} onOpenLibrary={props.onOpenLibrary} />
        <div className="kl-edge-card"><StageCards side="l" roadmap={props.roadmap} rewards={rewards} busy={busy} onRead={props.onRead} onRewards={props.onRewards} /></div>
        {/* Cột nút sát mép trái màn hình */}
        <nav className="kl-rail kl-rail-l" aria-label="Lối tắt bên trái">
          <StageButton icon={MapIcon} label="Hành trình" variant="is-sky" frog="wave" onClick={props.onJourney} />
          {notebookOn && <StageButton icon={NotebookPen} label="Sổ tay" variant="is-mint" frog="wink" onClick={props.onNotebook} />}
        </nav>
      </div>
      <div className="kl-col kl-center">
        <KidLobbyStage
          roadmap={props.roadmap}
          nickname={props.nickname}
          rewards={props.rewards}
          busy={busy}
          onRead={props.onRead}
          onOpenLibrary={props.onOpenLibrary}
          onRewards={props.onRewards}
        />
      </div>
      <div className="kl-col kl-right">
        <KidLobbySide
          childId={props.childId}
          busy={busy}
          familyStories={props.familyStories}
          onOpenFamily={props.onOpenFamily}
          onNotebook={props.onNotebook}
        />
        <div className="kl-edge-card"><StageCards side="r" roadmap={props.roadmap} rewards={rewards} busy={busy} onRead={props.onRead} onRewards={props.onRewards} /></div>
        {/* Cột nút sát mép phải màn hình */}
        <nav className="kl-rail kl-rail-r" aria-label="Lối tắt bên phải">
          {wishesOn && <StageButton icon={Sparkles} label="Điều ước" variant="is-pink" frog="wave" onClick={props.onWishes} />}
          {rewardsOn && <StageButton icon={Award} label="Huy hiệu" variant="is-gold" frog="tongue" badge={earned} badgeLabel={`em có ${earned} huy hiệu`} onClick={props.onRewards} />}
        </nav>
      </div>
    </div>
  );
}
