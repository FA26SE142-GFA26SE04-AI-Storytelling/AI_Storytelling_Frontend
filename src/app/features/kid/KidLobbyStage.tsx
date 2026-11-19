"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Library, Play, Sprout, type LucideIcon } from "lucide-react";
import type * as B from "@/app/types/backendContracts";
import type { ChildRewards } from "@/app/types/childReading";
import Frog, { type FrogPokeAction } from "@/app/components/brand/Frog";
import KnowledgeTreeArt from "@/app/components/brand/KnowledgeTreeArt";
import Lotus from "@/app/components/brand/Lotus";
import { croak } from "@/app/lib/croak";
import { coverFor } from "@/app/lib/storyView";

/** Mỗi lần bé bấm ếch làm một động tác khác, lặp vòng: chuyển động cả thân (CSS) + cử động của ếch (Frog). */
const POKE_ACTIONS: { motion: "hop" | "spin" | "squash" | "dance"; frog: FrogPokeAction }[] = [
  { motion: "hop", frog: "wave" },
  { motion: "spin", frog: "spin" },
  { motion: "squash", frog: "tongue" },
  { motion: "dance", frog: "dance" },
  { motion: "squash", frog: "wink" },
];

/** Không ai bấm ếch chừng này mili giây thì ếch về cười mỉm. */
const REST_MS = 8000;

/** Phóng to tối đa khi màn rất rộng, để ếch và nút không bị vỡ nét. */
const MAX_FIT = 1.5;

/** Nút vuông 3D trên sân khấu: icon trên, nhãn ngắn dưới, badge số ở góc (nếu > 0). `frog`: động tác của ếch khi rê chuột lên nút. */
export function StageButton({ icon: Icon, label, variant, badge = 0, badgeLabel, frog, onClick }: {
  icon: LucideIcon;
  label: string;
  variant: string;
  badge?: number;
  badgeLabel?: string;
  frog?: FrogPokeAction;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`kid-btn3d ${variant} kls-btn`} data-frog={frog} onClick={onClick} aria-label={badge > 0 && badgeLabel ? `${label}: ${badgeLabel}` : label}>
      <span className="kid-btn3d-icon"><Icon aria-hidden="true" /></span>
      <span className="kid-btn3d-label">{label}</span>
      {badge > 0 && <span className="kls-badge display" aria-hidden="true">{badge}</span>}
    </button>
  );
}

/**
 * Thẻ nổi "Hôm nay" (truyện đang mở) và thẻ cây. Màn rộng đặt ở hai mép (KidLobby, side="l"|"r"),
 * màn nhỏ nằm dưới ếch trên sân khấu (side="both"); CSS ẩn bản không dùng theo bề rộng màn.
 */
export function StageCards({ roadmap, rewards, busy, onRead, onRewards, side = "both" }: {
  roadmap: B.MyRoadmapDto | null;
  rewards: ChildRewards | null;
  busy: boolean;
  onRead: (storyId: number) => void;
  onRewards: () => void;
  side?: "l" | "r" | "both";
}) {
  const open = side !== "r" ? roadmap?.openStories?.[0] : undefined;
  const title = open?.title ?? "Truyện bố mẹ chọn";
  const tree = side !== "l" ? rewards?.knowledgeTree : undefined;
  const expPercent =
    tree && tree.nextStageAt != null && tree.nextStageAt > 0
      ? Math.max(0, Math.min(100, (tree.currentTreeExp / tree.nextStageAt) * 100))
      : null;
  return (
    <>
      {open && (
        <button type="button" className="kls-card kls-card-l" disabled={busy} onClick={() => onRead(open.storyId)} aria-label={`Đọc truyện hôm nay: ${title}`}>
          <span className="kls-card-tag display">Hôm nay</span>
          <span className="kls-card-cover" style={{ background: coverFor(open.coverImageUrl) }}>
            <span className="kls-card-num display" aria-hidden="true">{open.stage}</span>
          </span>
          <span className="kls-card-title display">{title}</span>
        </button>
      )}

      {tree && (
        <button type="button" className="kls-card kls-card-r" onClick={onRewards} aria-label={`Mở cây của em: ${tree.stageName}`}>
          <span className="kls-card-tag display">{tree.stageName}</span>
          <KnowledgeTreeArt stage={tree.stage} size={90} className="kls-tree" />
          {expPercent != null && (
            <span
              className="kls-exp"
              role="progressbar"
              aria-valuenow={tree.currentTreeExp}
              aria-valuemin={0}
              aria-valuemax={tree.nextStageAt ?? undefined}
              aria-label={`Kinh nghiệm cây: ${tree.currentTreeExp}/${tree.nextStageAt}`}
            >
              <span style={{ width: `${expPercent}%` }} />
            </span>
          )}
        </button>
      )}
    </>
  );
}

/**
 * Sân khấu giữa sảnh: bạn ếch đứng trên bục lá sen, thẻ nổi "Truyện hôm nay" và "Cây" bên dưới (chỉ màn nhỏ),
 * hàng dưới là nút ĐỌC NGAY to kẹp giữa Kho truyện và Cây. Cột nút khác nằm sát mép màn (KidLobby).
 */
export default function KidLobbyStage({
  roadmap,
  nickname,
  rewards,
  busy,
  onRead,
  onOpenLibrary,
  onRewards,
}: {
  roadmap: B.MyRoadmapDto | null;
  nickname: string;
  rewards: ChildRewards | null;
  busy: boolean;
  onRead: (storyId: number) => void;
  onOpenLibrary: () => void;
  onRewards: () => void;
}) {
  const open = roadmap?.openStories?.[0];
  const water = rewards?.knowledgeTree?.expToWater ?? 0;

  // Bé bấm vào ếch: mỗi lần một động tác (đếm số lần bấm để chạy lại hoạt cảnh cả thân).
  const [pokes, setPokes] = useState(0);
  const act = pokes ? POKE_ACTIONS[(pokes - 1) % POKE_ACTIONS.length] : null;
  // Cử động mặt/tay của ếch: do bấm ếch hoặc rê chuột lên nút (n tăng để Frog chạy lại động tác).
  const [cue, setCue] = useState<{ n: number; action?: FrogPokeAction }>({ n: 0 });
  // Đứng yên lâu thì cười mỉm; bấm hoặc rê nút thì vui trở lại rồi đếm lại thời gian.
  const [resting, setResting] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setResting(true), REST_MS);
    return () => window.clearTimeout(t);
  }, [cue.n]);
  const pokeFrog = () => {
    croak();
    setResting(false);
    setPokes((n) => n + 1);
    setCue((c) => ({ n: c.n + 1, action: POKE_ACTIONS[pokes % POKE_ACTIONS.length].frog }));
  };

  const boxRef = useRef<HTMLElement>(null);
  // Rê chuột lên nút có data-frog thì ếch làm động tác của nút. Nghe ở .kid-lobby vì cột nút hai bên nằm ngoài sân khấu.
  useEffect(() => {
    const root = boxRef.current?.closest<HTMLElement>(".kid-lobby") ?? boxRef.current;
    if (!root) return;
    let current: HTMLButtonElement | null = null;
    let timer = 0;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const btn = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("button[data-frog]") : null;
      if (btn === current) return;
      current = btn;
      window.clearTimeout(timer);
      if (!btn || btn.disabled) return;
      const action = btn.dataset.frog as FrogPokeAction;
      // Chờ một nhịp: chuột chỉ lướt ngang qua nút thì ếch không giật liên tục
      timer = window.setTimeout(() => { setResting(false); setCue((c) => ({ n: c.n + 1, action })); }, 180);
    };
    const onLeave = () => { current = null; window.clearTimeout(timer); };
    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerleave", onLeave);
    return () => { root.removeEventListener("pointerover", onOver); root.removeEventListener("pointerleave", onLeave); window.clearTimeout(timer); };
  }, []);

  // Sân khấu dựng theo kích thước thiết kế cố định rồi co giãn cho vừa khung (như màn hình game), không để trống hay phải cuộn.
  const fitRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = boxRef.current, fit = fitRef.current;
    if (!box || !fit) return;
    const update = () => {
      // Khung hẹp hoặc đứng (rộng < cao) dùng bản dọc 360px cho to rõ; khung ngang dùng bản rộng 680px (cùng bố cục, to hơn).
      const compact = box.clientWidth < 520 || box.clientWidth < box.clientHeight;
      if ((box.dataset.layout === "compact") !== compact) box.dataset.layout = compact ? "compact" : "wide";
      if (!fit.offsetWidth || !fit.offsetHeight) return;
      const s = Math.min(box.clientWidth / fit.offsetWidth, box.clientHeight / fit.offsetHeight, MAX_FIT);
      box.style.setProperty("--fit", String(Math.max(0.5, s)));
    };
    const ro = new ResizeObserver(update);
    ro.observe(box);
    ro.observe(fit);
    update();
    return () => ro.disconnect();
  }, []);

  return (
    <section ref={boxRef} className="kls" aria-label="Sân khấu của em" aria-busy={!roadmap}>
      <div ref={fitRef} className="kls-grid">
        <div className="kls-center">
          {nickname ? <span className="kls-name display">{nickname}</span> : null}
          <div className="kls-hero">
            <span className="kls-pad" aria-hidden="true" />
            <span className="kls-lily kls-lily-l" aria-hidden="true" />
            <span className="kls-lily kls-lily-r" aria-hidden="true"><span className="kls-lily-flower"><Lotus size={66} /></span></span>
            <button type="button" className="kls-frog" onClick={pokeFrog} aria-label="Chạm vào bạn ếch">
              {/* key đổi mỗi lần bấm để chạy lại cú nhảy */}
              <span key={pokes} className={`kls-poke${act ? ` is-${act.motion}` : ""}`}>
                <Frog mood={!roadmap ? "think" : resting ? "smile" : "happy"} size={300} pokeKey={cue.n} pokeAction={cue.action} followPointer tongue />
              </span>
            </button>
          </div>

          <StageCards roadmap={roadmap} rewards={rewards} busy={busy} onRead={onRead} onRewards={onRewards} />
        </div>

        <div className="kls-bottom">
          <StageButton icon={Library} label="Kho truyện" variant="is-sky" frog="wink" onClick={onOpenLibrary} />
          <button
            type="button"
            className="kid-btn3d is-gold is-big kls-go"
            data-frog="wave"
            disabled={!roadmap || busy}
            onClick={() => (open ? onRead(open.storyId) : onOpenLibrary())}
          >
            {open ? <><Play aria-hidden="true" />Đọc ngay</> : "Chọn truyện"}
          </button>
          <StageButton icon={Sprout} label="Cây" variant="is-green" frog="tongue" badge={water} badgeLabel={`${water} giọt nước chờ tưới`} onClick={onRewards} />
        </div>
      </div>
    </section>
  );
}
