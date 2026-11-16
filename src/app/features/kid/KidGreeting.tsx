"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type * as B from "@/app/types/backendContracts";
import Frog from "@/app/components/brand/Frog";
import { prefersReducedMotion, usePop } from "@/app/lib/motion";
import { petalBurst } from "./kidFx";
import { useNarrator } from "./useNarrator";
import "./kid-greeting.css";

export type KidGreetingProps = {
  nickname: string;
  roadmap: B.MyRoadmapDto | null;
};

// Danh sách câu phản hồi ngẫu nhiên khi bé chạm vào ếch
const FROG_REPLIES = [
  "Ộp ộp!",
  "Em đọc giỏi lắm!",
  "Mình cùng đọc nhé!",
  "Hôm nay em vui không?",
  "Ếch thích nghe em đọc!",
] as const;

export default function KidGreeting({ nickname, roadmap }: KidGreetingProps) {
  const { speak } = useNarrator();

  const [tempText, setTempText] = useState<string | null>(null);
  const [intro, setIntro] = useState(false);
  const [hop, setHop] = useState(false);
  const [spin, setSpin] = useState(false);

  const frogBtnRef = useRef<HTMLButtonElement | null>(null);
  const clickTimestampsRef = useRef<number[]>([]);
  const tempTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Câu chào mặc định theo đúng thứ tự ưu tiên
  const defaultGreeting = useMemo(() => {
    if (roadmap?.openStories && roadmap.openStories.length > 0 && roadmap.openStories[0]?.title) {
      return `Chào ${nickname}! Hôm nay mình cùng đọc truyện này nhé!`;
    }
    if (roadmap?.isFinished) {
      return `Giỏi quá ${nickname}! Em đọc hết hành trình rồi!`;
    }
    return `Chào ${nickname}! Em chọn truyện em thích nhé!`;
  }, [nickname, roadmap]);

  const currentText = tempText ?? defaultGreeting;
  const hasBubble = Boolean(roadmap !== null && nickname.trim().length > 0);

  // Bong bóng bật ra khi câu đổi
  const popRef = usePop<HTMLDivElement>(currentText);

  // Ếch nhún nhẹ khi vào trang nếu không giảm chuyển động
  useEffect(() => {
    if (prefersReducedMotion()) return;
    setIntro(true);
    introTimerRef.current = setTimeout(() => {
      setIntro(false);
    }, 800);

    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, []);

  // Xoá mọi timer khi unmount
  useEffect(() => {
    return () => {
      if (tempTimerRef.current) clearTimeout(tempTimerRef.current);
      if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, []);

  const handleFrogClick = () => {
    const reduced = prefersReducedMotion();

    // a) Nhảy vồng lên
    if (!reduced) {
      setHop(false);
      if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
      requestAnimationFrame(() => {
        setHop(true);
        hopTimerRef.current = setTimeout(() => {
          setHop(false);
        }, 600);
      });
    }

    // Câu ngẫu nhiên tạm thời trong 3 giây
    const randomReply = FROG_REPLIES[Math.floor(Math.random() * FROG_REPLIES.length)];
    setTempText(randomReply);
    if (tempTimerRef.current) clearTimeout(tempTimerRef.current);
    tempTimerRef.current = setTimeout(() => {
      setTempText(null);
    }, 3000);

    // b) Chạm 5 lần trong 3 giây: ếch lộn 1 vòng và bung cánh hoa
    const now = Date.now();
    const recent = clickTimestampsRef.current.filter((t) => now - t <= 3000);
    recent.push(now);
    clickTimestampsRef.current = recent;

    if (recent.length >= 5) {
      clickTimestampsRef.current = [];
      if (!reduced) {
        setSpin(false);
        if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
        requestAnimationFrame(() => {
          setSpin(true);
          spinTimerRef.current = setTimeout(() => {
            setSpin(false);
          }, 800);
        });

        const rect = frogBtnRef.current?.getBoundingClientRect();
        if (rect) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          petalBurst(cx, cy, 14);
        }
      }
    }
  };

  return (
    <div className="kid-greet">
      <button
        ref={frogBtnRef}
        type="button"
        className={`kid-greet-frog ${intro ? "kid-greet-intro" : ""} ${hop ? "kid-greet-hop" : ""}`}
        aria-label="Chạm vào bạn ếch"
        onClick={handleFrogClick}
      >
        <span className={`kid-greet-frog-inner ${spin ? "kid-greet-spin" : ""}`}>
          <Frog size={96} mood="happy" />
        </span>
      </button>

      {hasBubble && (
        <>
          <div ref={popRef} className="kid-greet-bubble">
            <span className="kid-greet-bubble-leaf" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 20C4 20 6 12 14 6C18 3 20 4 20 4C20 4 21 6 18 10C12 18 4 20 4 20Z"
                  fill="var(--primary)"
                  stroke="color-mix(in srgb, var(--text) 20%, transparent)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 20C9 17 13 13 17 7"
                  stroke="color-mix(in srgb, var(--text) 20%, transparent)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <p>{currentText}</p>
          </div>

          <button
            type="button"
            className="kid-greet-speak"
            aria-label="Nghe lời chào"
            onClick={() => speak(currentText)}
          >
            <Volume2 size={24} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
