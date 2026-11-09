"use client";

import { useEffect, useState } from "react";
import { Ban, BookOpen, Check, Sparkles, X } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { showToast } from "@/app/lib/toast";
import { parentWishService } from "@/app/services/storyWishService";
import type { ParentWishDto, ParentWishSuggestionsDto } from "@/app/types/storyWish";
import type { WorkspaceId } from "@/app/components/shell/nav";

export const STUDIO_PREFILL_KEY = "taletale-studio-prefill";
const DECLINE_REASON_MAX = 500;

const GROUP_LABEL: Record<string, string> = { Character: "Nhân vật", Place: "Nơi chốn", Challenge: "Thử thách", Lesson: "Bài học" };

/** Mô tả điều ước từ các thẻ bé chọn, ví dụ "Nhân vật: Thỏ con · Nơi chốn: Khu rừng". */
export function wishLabel(wish: Pick<ParentWishDto, "cards" | "lessonLeftToParent">): string {
  const parts = wish.cards.map((c) => `${GROUP_LABEL[c.group] ?? c.group}: ${c.label}`);
  if (wish.lessonLeftToParent) parts.push("Bài học: bé để bố mẹ chọn");
  return parts.join(" · ") || "Điều ước của bé";
}

/**
 * Phụ huynh xử lý điều ước của bé: Dùng truyện có sẵn / Tạo truyện mới / Từ chối.
 * "Dùng truyện có sẵn" không trừ lượt tạo truyện; truyện cộng đồng chỉ để bé đọc trong lúc chờ.
 */
export default function WishItem({ wish, nickname, go, onChanged }: {
  wish: ParentWishDto;
  nickname: string;
  go: (id: WorkspaceId) => void;
  onChanged: () => void;
}) {
  const [suggestions, setSuggestions] = useState<ParentWishSuggestionsDto | null>(null);
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void parentWishService.suggestions(wish.wishId, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.success) setSuggestions(r.data); else showToast(r.message, "err");
    });
    return () => controller.abort();
  }, [wish.wishId]);

  const run = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    if (busy) return;
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.success) onChanged(); else showToast(r.message, "err");
  };

  // Studio tự tải form điền sẵn của điều ước và gửi qua create-story.
  const createNew = () => {
    try {
      sessionStorage.setItem(STUDIO_PREFILL_KEY, JSON.stringify({ childId: wish.childProfileId, wishId: wish.wishId, source: "wish" }));
    } catch { /* bỏ qua */ }
    go("studio");
  };

  // Hạn xử lý: còn dưới 24 giờ thì tô vàng cho bố mẹ chú ý.
  const due = wish.expiresAt ? new Date(wish.expiresAt) : null;
  const soon = !!due && due.getTime() - Date.now() < 24 * 3600 * 1000;
  const readState = (s: ParentWishSuggestionsDto["items"][number]) =>
    s.completed ? `Đã đọc${s.feelingLabel ? ` · ${s.feelingLabel.toLowerCase()}` : ""}` : s.opened ? "Đã mở đọc" : null;

  return (
    <div className="wish-row">
      <div className="wish-row-h">
        <Sparkles className="ic" aria-hidden />
        <b className="grow">{wishLabel(wish)}</b>
        {due && <span className={`pill ${soon ? "gold-pill" : "draft"}`}>Hạn {due.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>}
      </div>

      {suggestions && (suggestions.items.length > 0 ? (
        <ul className="wish-sugs" aria-label="Truyện có sẵn phù hợp">
          {suggestions.items.map((s) => {
            const state = readState(s);
            return (
              <li key={s.rank} className="wish-sug">
                <BookOpen className="ic" aria-hidden />
                <span className="grow" title={s.hint ?? undefined}>{s.title}</span>
                {state && <span className="pill ok">{nickname} {state.charAt(0).toLowerCase() + state.slice(1)}</span>}
                {s.storyId != null
                  ? <button className="btn btn-ok" disabled={busy} onClick={() => void run(() => parentWishService.useExisting(wish.wishId, s.rank))}><Check className="ic" />Dùng</button>
                  : <span className="pill draft" title="Truyện cộng đồng, bé có thể tự đọc">Cộng đồng</span>}
              </li>
            );
          })}
        </ul>
      ) : <p className="wish-empty">{suggestions.emptyMessage ?? "Chưa có truyện phù hợp trong thư viện."}</p>)}

      <div className="wish-actions">
        <button className="btn btn-gold" disabled={busy} onClick={createNew}><Sparkles className="ic" />Tạo truyện mới</button>
        <button className="btn btn-no" disabled={busy} onClick={() => setDeclining(true)}><Ban className="ic" />Từ chối</button>
      </div>

      {declining && (
        <Dialog title="Từ chối điều ước" onClose={() => setDeclining(false)}>
          <label className="field">
            <span className="lbl">Lý do (chỉ bạn thấy)</span>
            <textarea className="inp" rows={3} maxLength={DECLINE_REASON_MAX} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Không bắt buộc" />
          </label>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-g" onClick={() => setDeclining(false)}><X className="ic" />Hủy</button>
            <button className="btn btn-no" disabled={busy} onClick={() => void run(() => parentWishService.decline(wish.wishId, note)).then(() => setDeclining(false))}><Ban className="ic" />Từ chối</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
