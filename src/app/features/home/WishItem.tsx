"use client";

import { useEffect, useState } from "react";
import { Ban, Check, Sparkles, X } from "lucide-react";
import IconButton from "@/app/components/IconButton";
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
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void parentWishService.suggestions(wish.wishId, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.success) setSuggestions(r.data); else setErr(r.message);
    });
    return () => controller.abort();
  }, [wish.wishId]);

  const run = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    const r = await fn();
    setBusy(false);
    if (r.success) onChanged(); else setErr(r.message);
  };

  // Studio tự tải form điền sẵn của điều ước và gửi qua create-story.
  const createNew = () => {
    try {
      sessionStorage.setItem(STUDIO_PREFILL_KEY, JSON.stringify({ childId: wish.childProfileId, wishId: wish.wishId, source: "wish" }));
    } catch { /* bỏ qua */ }
    go("studio");
  };

  return (
    <div className="wish-row">
      <div className="row">
        <b className="grow">{wishLabel(wish)}</b>
        <span className="pill wait">Điều ước</span>
      </div>
      {wish.expiresAt && <small className="sub">Cần xử lý trước {new Date(wish.expiresAt).toLocaleString("vi-VN")}.</small>}
      {suggestions && (suggestions.items.length > 0 ? (
        <div className="sec" style={{ gap: 4 }}>
          <small className="sub">Truyện có sẵn phù hợp:</small>
          {suggestions.items.map((s) => (
            <div key={s.rank} className="row">
              <span className="grow">
                {s.title}
                {s.hint ? <small className="sub"> — {s.hint}</small>
                  : s.completed ? <small className="sub"> — {nickname} đã đọc xong{s.feelingLabel ? `, ${s.feelingLabel.toLowerCase()}` : ""}</small>
                  : s.opened ? <small className="sub"> — {nickname} đã mở đọc</small> : null}
              </span>
              {s.storyId != null
                ? <IconButton icon={Check} label={`Dùng truyện "${s.title}"`} className="btn btn-ok" disabled={busy} onClick={() => void run(() => parentWishService.useExisting(wish.wishId, s.rank))} />
                : <small className="sub">Truyện cộng đồng, bé có thể tự đọc</small>}
            </div>
          ))}
        </div>
      ) : <small className="sub">{suggestions.emptyMessage ?? "Chưa có truyện phù hợp trong thư viện."}</small>)}
      {declining ? (
        <div className="row">
          <input className="inp" maxLength={DECLINE_REASON_MAX} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do (chỉ bạn thấy, không bắt buộc)" aria-label="Lý do từ chối" />
          <IconButton icon={Check} label="Xác nhận từ chối" className="btn btn-no" disabled={busy} onClick={() => void run(() => parentWishService.decline(wish.wishId, note))} />
          <IconButton icon={X} label="Hủy" className="btn btn-g" disabled={busy} onClick={() => setDeclining(false)} />
        </div>
      ) : (
        <div className="row">
          <IconButton icon={Sparkles} label="Tạo truyện mới từ điều ước" className="btn btn-p" disabled={busy} onClick={createNew} />
          <IconButton icon={Ban} label="Từ chối điều ước" className="btn btn-no" disabled={busy} onClick={() => setDeclining(true)} />
        </div>
      )}
      {err && <div className="notice err" role="alert">{err}</div>}
    </div>
  );
}
