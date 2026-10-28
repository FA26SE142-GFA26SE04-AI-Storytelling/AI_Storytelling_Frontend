"use client";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { wishCardService } from "@/app/services/wishCardService";
import type { WishCardDto, WishCardGroup, WishCardMatchDto } from "@/app/types/storyWish";
import { groupLabel, WISH_GROUPS } from "./WishCardManagement";

const MATCH_GROUPS = WISH_GROUPS.filter((g) => g.wish);

/** Gắn thẻ ước cho một truyện để hệ thống gợi ý truyện này khi bé ước những thẻ đó. */
export default function StoryWishCards({ storyId }: { storyId: number }) {
  const [matches, setMatches] = useState<WishCardMatchDto[] | null>(null);
  const [group, setGroup] = useState<WishCardGroup>("Character");
  const [cards, setCards] = useState<WishCardDto[]>([]);
  const [cardId, setCardId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    const r = await wishCardService.storyCards(storyId, signal);
    if (signal?.aborted) return;
    setMatches(r.data ?? []);
    if (!r.success) setMessage({ ok: false, text: r.message });
  }, [storyId]);
  useEffect(() => { const c = new AbortController(); setMatches(null); setMessage(null); void load(c.signal); return () => c.abort(); }, [load]);
  useEffect(() => {
    const c = new AbortController();
    setCardId("");
    void wishCardService.list({ group, isActive: true, pageIndex: 1, pageSize: 100 }, c.signal).then((r) => { if (!c.signal.aborted) setCards(r.data?.items ?? []); });
    return () => c.abort();
  }, [group]);

  const act = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    if (busy) return;
    setBusy(true); setMessage(null);
    const r = await fn();
    setBusy(false);
    setMessage({ ok: r.success, text: r.message || (r.success ? "Đã lưu." : "Không thực hiện được.") });
    if (r.success) { setCardId(""); await load(); }
  };

  const taken = new Set(matches?.map((m) => m.wishCardId));
  return <details className="st-card" open>
    <summary><b>Thẻ ước của truyện</b></summary>
    <p className="sub">Khi bé ước các thẻ này, truyện có thể xuất hiện trong danh sách gợi ý cho bé và bố mẹ.</p>
    {message && <p className={`notice ${message.ok ? "ok" : "err"}`} role="status">{message.text}</p>}
    {!matches && <p role="status">Đang tải thẻ của truyện…</p>}
    {matches && !matches.length && <p className="sub">Truyện chưa được gắn thẻ nào.</p>}
    <div className="chips">{matches?.map((m) => <span key={m.wishCardId} className="chip sm on">
      {groupLabel(m.group)}: {m.label}{m.source === "Ai" ? " (AI)" : ""}
      <button type="button" className="btn btn-g" style={{ padding: "0 4px", minHeight: 0 }} aria-label={`Gỡ thẻ ${m.label}`} disabled={busy} onClick={() => void act(() => wishCardService.removeFromStory(storyId, m.wishCardId))}><X className="ic" /></button>
    </span>)}</div>
    <div className="row">
      <select className="inp" aria-label="Nhóm thẻ" value={group} disabled={busy} onChange={(e) => setGroup(e.target.value as WishCardGroup)}>
        {MATCH_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
      </select>
      <select className="inp" aria-label="Thẻ cần gắn" value={cardId} disabled={busy} onChange={(e) => setCardId(e.target.value)}>
        <option value="">Chọn thẻ…</option>
        {cards.filter((c) => !taken.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.label}{c.ageBand ? ` (${c.ageBand} tuổi)` : ""}</option>)}
      </select>
      <button className="btn btn-p" disabled={busy || !cardId} onClick={() => void act(() => wishCardService.addToStory(storyId, Number(cardId)))}>Gắn thẻ</button>
    </div>
  </details>;
}
