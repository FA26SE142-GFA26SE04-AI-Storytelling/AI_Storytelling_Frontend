"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WordTiming } from "@/app/types/reading";

/**
 * Đọc to một đoạn văn (Luồng 3 Bước 3.2.2).
 * - Có file âm thanh + mốc thời gian từng chữ → phát file và tô sáng theo mốc thời gian.
 * - Có file âm thanh, không có mốc → chỉ phát, không tô sáng.
 * - Chưa có file âm thanh (backend chưa trả media) → dùng giọng tiếng Việt của trình duyệt;
 *   tô sáng theo sự kiện ranh giới chữ do trình duyệt báo, không tự giả lập.
 */
export function useNarrator() {
  const [speaking, setSpeaking] = useState(false);
  const [charIndex, setCharIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // Mỗi lần đọc/dừng tăng lượt; sự kiện của lượt cũ (kể cả lỗi "interrupted" khi huỷ) bị bỏ qua.
  const turnRef = useRef(0);
  const supported = typeof window !== "undefined" && ("speechSynthesis" in window || typeof Audio !== "undefined");

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const pick = () => { voiceRef.current = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("vi")) ?? null; };
    pick();
    window.speechSynthesis.addEventListener?.("voiceschanged", pick);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", pick);
  }, []);

  const stop = useCallback(() => {
    turnRef.current += 1;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setCharIndex(null);
  }, []);

  useEffect(() => stop, [stop]);

  const speak = useCallback((text: string, opts: { audioUrl?: string | null; timings?: WordTiming[] | null; rate?: number; onEnd?: () => void } = {}) => {
    stop();
    const turn = turnRef.current;
    const done = () => { if (turn !== turnRef.current) return; setSpeaking(false); setCharIndex(null); opts.onEnd?.(); };

    if (opts.audioUrl) {
      const audio = new Audio(opts.audioUrl);
      audioRef.current = audio;
      // Đổi mốc thời gian từng chữ thành vị trí ký tự trong đoạn văn.
      const offsets: { start: number; end: number; at: number }[] = [];
      let cursor = 0;
      for (const t of opts.timings ?? []) {
        const at = text.indexOf(t.word, cursor);
        if (at < 0) continue;
        offsets.push({ start: t.startMs, end: t.endMs, at });
        cursor = at + t.word.length;
      }
      const tick = () => {
        const ms = audio.currentTime * 1000;
        const hit = offsets.find((o) => ms >= o.start && ms < o.end);
        setCharIndex(hit ? hit.at : null);
        timerRef.current = requestAnimationFrame(tick);
      };
      audio.onended = () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); done(); };
      audio.onerror = done;
      setSpeaking(true);
      void audio.play().then(() => { if (offsets.length) tick(); }).catch(done);
      return;
    }

    if (!("speechSynthesis" in window)) { opts.onEnd?.(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = opts.rate ?? 0.9;
    u.onboundary = (e) => { if (turn === turnRef.current && (e.name === "word" || e.charLength)) setCharIndex(e.charIndex); };
    u.onend = done;
    u.onerror = done;
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [stop]);

  return { speak, stop, speaking, charIndex, supported };
}
