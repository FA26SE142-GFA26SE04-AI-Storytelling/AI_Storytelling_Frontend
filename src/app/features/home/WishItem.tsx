"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { guardianService, type ChildRef } from "@/app/services/guardianService";
import type { StoryWish } from "@/app/types/reading";
import type { StoryCard } from "@/app/lib/storyView";
import { WISH_CARDS } from "@/app/services/readingLocal";
import type { WorkspaceId } from "@/app/components/shell/nav";
import { FREE_TEXT_MAX } from "@/app/lib/storyRules";

export const STUDIO_PREFILL_KEY = "taletale-studio-prefill";
const card = (id: number | null) => WISH_CARDS.find((c) => c.id === id);

/**
 * Luồng 2 mục 3.5 — phụ huynh xử lý điều ước của bé: Dùng truyện có sẵn / Tạo truyện mới / Từ chối.
 * "Dùng truyện có sẵn" chỉ cần quyền duyệt truyện và không trừ lượt tạo truyện (BR-2.40).
 */
export default function WishItem({ wish, childRef, stories, go, onChanged }: {
  wish: StoryWish & { label: string };
  childRef: ChildRef | undefined;
  stories: StoryCard[];
  go: (id: WorkspaceId) => void;
  onChanged: () => void;
}) {
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const emojis = [wish.characterCardId, wish.placeCardId, wish.challengeCardId, wish.lessonCardId].map((id) => card(id)?.emoji).filter(Boolean).join(" ");

  const run = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    setBusy(true);
    setErr(null);
    const r = await fn();
    setBusy(false);
    if (r.success) onChanged(); else setErr(r.message);
  };

  const pickStory = (storyId: number, title: string) => {
    if (!childRef) return;
    const s = stories.find((x) => x.id === storyId);
    void run(() => guardianService.fulfillWishWithStory(childRef, wish.id, { storyId, title, ageBand: s?.ageBand ?? childRef.ageBand, length: s?.words ?? 0 }));
  };

  const createNew = () => void run(async () => {
    const r = await guardianService.acceptWish(childRef?.id ?? 0, wish.id);
    if (r.success) {
      // Điền sẵn form tạo truyện từ các thẻ bé đã chọn.
      const prefill = {
        childId: childRef?.id, wishId: wish.id,
        topic: `Câu chuyện về ${card(wish.characterCardId)?.label.toLowerCase()} ở ${card(wish.placeCardId)?.label.toLowerCase()}${wish.challengeCardId ? `, ${card(wish.challengeCardId)?.label.toLowerCase()}` : ""}`,
        charactersText: card(wish.characterCardId)?.label ?? "",
        setting: card(wish.placeCardId)?.label ?? "",
        lesson: card(wish.lessonCardId)?.label ?? "",
      };
      try { sessionStorage.setItem(STUDIO_PREFILL_KEY, JSON.stringify(prefill)); } catch { /* bỏ qua */ }
      go("studio");
    }
    return r;
  });

  return (
    <div className="wish-row">
      <div className="row"><span className="wish-emoji" aria-hidden>{emojis}</span><b className="grow">{wish.label}</b><span className="pill wait">Điều ước</span></div>
      {wish.suggestions.length > 0 ? (
        <div className="sec" style={{ gap: 4 }}>
          <small className="sub">Truyện có sẵn phù hợp:</small>
          {wish.suggestions.map((s) => (
            <div key={s.storyId} className="row">
              <span className="grow">{s.title}</span>
              <button className="btn btn-s" disabled={busy || !childRef} onClick={() => pickStory(s.storyId, s.title)}><Check className="ic" />Dùng truyện này</button>
            </div>
          ))}
        </div>
      ) : <small className="sub">Chưa có truyện phù hợp trong thư viện.</small>}
      {declining ? (
        <div className="row">
          <input className="inp" maxLength={FREE_TEXT_MAX} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do (chỉ bạn thấy, không bắt buộc)" aria-label="Lý do từ chối" />
          <button className="btn btn-no" disabled={busy} onClick={() => void run(() => guardianService.declineWish(childRef?.id ?? 0, wish.id, note))}>Từ chối</button>
          <button className="btn btn-g" aria-label="Hủy" onClick={() => setDeclining(false)}><X className="ic" /></button>
        </div>
      ) : (
        <div className="row">
          <button className="btn btn-p" disabled={busy} onClick={createNew}><Sparkles className="ic" />Tạo truyện mới</button>
          <button className="btn btn-g" disabled={busy} onClick={() => setDeclining(true)}>Từ chối</button>
        </div>
      )}
      {err && <div className="notice err" role="alert">{err}</div>}
    </div>
  );
}
