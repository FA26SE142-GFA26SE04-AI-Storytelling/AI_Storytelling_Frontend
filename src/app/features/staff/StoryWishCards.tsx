'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import IconButton from '@/app/components/IconButton';
import { confirmDialog } from '@/app/lib/confirm';
import { wishCardService } from '@/app/services/wishCardService';
import type { WishCardDto, WishCardGroup, WishCardMatchDto } from '@/app/types/storyWish';
import { groupLabel, WISH_GROUPS } from './WishCardManagement';

const MATCH_GROUPS = WISH_GROUPS.filter(g => g.wish);

/** Gắn thẻ ước trong ngữ cảnh truyện và phiên bản đang công khai; giữ guard chống gửi lặp / ghi đè chéo story. */
export default function StoryWishCards({ storyId, versionId }: { storyId: number; versionId?: number | null }) {
  const [matches, setMatches] = useState<WishCardMatchDto[] | null>(null);
  const [group, setGroup] = useState<WishCardGroup>('Character');
  const [cards, setCards] = useState<WishCardDto[]>([]);
  const [cardId, setCardId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const storyScope = useRef(storyId);
  const submitLock = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    const r = await wishCardService.storyCards(storyId, signal);
    if (signal?.aborted || storyScope.current !== storyId) return;
    setMatches(r.data ?? []);
    if (!r.success) setMessage({ ok: false, text: r.message });
  }, [storyId]);

  useEffect(() => {
    storyScope.current = storyId;
    submitLock.current = false;
    const c = new AbortController();
    setMatches(null);
    setMessage(null);
    setCardId('');
    void load(c.signal);
    return () => c.abort();
  }, [storyId, load]);

  useEffect(() => {
    const c = new AbortController();
    setCardId('');
    void wishCardService.list({ group, isActive: true, pageIndex: 1, pageSize: 100 }, c.signal).then(r => {
      if (!c.signal.aborted) setCards(r.data?.items ?? []);
    });
    return () => c.abort();
  }, [group]);

  const act = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    if (busy || submitLock.current) return;
    const activeStory = storyScope.current;
    submitLock.current = true;
    setBusy(true);
    setMessage(null);
    const r = await fn();
    submitLock.current = false;
    if (storyScope.current !== activeStory) return;
    setBusy(false);
    setMessage({ ok: r.success, text: r.message || (r.success ? 'Đã lưu.' : 'Không thực hiện được.') });
    if (r.success) {
      setCardId('');
      await load();
    }
  };

  const taken = new Set(matches?.map(m => m.wishCardId));

  return (
    <details className="st-card st-group st-wish" open>
      <summary><b>Thẻ ước của truyện</b></summary>
      <p className="sub">Khi bé ước các thẻ này, truyện có thể xuất hiện trong danh sách gợi ý cho bé và bố mẹ.</p>
      {message && <p className={`notice ${message.ok ? 'ok' : 'err'}`} role="status" data-inline-notice>{message.text}</p>}
      {!matches && <p role="status">Đang tải thẻ của truyện…</p>}
      {matches && !matches.length && <p className="sub">Truyện chưa được gắn thẻ nào.</p>}
      <div className="chips">
        {matches?.map(m => (
          <span key={m.wishCardId} className="chip sm on">
            {groupLabel(m.group)}: {m.label}{m.source === 'Ai' ? ' (AI)' : ''}
            <IconButton
              icon={X}
              label={`Gỡ thẻ ${m.label}`}
              className="btn btn-g"
              style={{ width: 22, height: 22 }}
              disabled={busy}
              onClick={async () => {
                if (!(await confirmDialog(`Gỡ thẻ ước “${m.label}” khỏi truyện?`))) return;
                void act(() => wishCardService.removeFromStory(storyId, m.wishCardId));
              }}
            />
          </span>
        ))}
      </div>
      {versionId != null && (
        <div className="row">
          <button
            type="button"
            className="btn btn-s"
            disabled={busy}
            title="AI đọc đúng phiên bản này để gợi ý thẻ phù hợp; bạn vẫn gỡ được thẻ không đúng"
            onClick={() => void act(async () => {
              const r = await wishCardService.aiMatch(storyId, versionId);
              return {
                success: r.success,
                message: r.success && r.data
                  ? (r.data.addedCount ? `AI đã gắn thêm ${r.data.addedCount} thẻ.` : 'AI không tìm thấy thẻ nào mới phù hợp.')
                  : r.message,
              };
            })}
          >
            <Sparkles className="ic" />{busy ? 'Đang xử lý…' : 'AI gợi ý thẻ'}
          </button>
        </div>
      )}
      <div className="row st-inline">
        <select className="inp" aria-label="Nhóm thẻ" value={group} disabled={busy} onChange={e => setGroup(e.target.value as WishCardGroup)}>
          {MATCH_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
        <select className="inp" aria-label="Thẻ cần gắn" value={cardId} disabled={busy} onChange={e => setCardId(e.target.value)}>
          <option value="">Chọn thẻ…</option>
          {cards.filter(c => !taken.has(c.id)).map(c => (
            <option key={c.id} value={c.id}>{c.label}{c.ageBand ? ` (${c.ageBand} tuổi)` : ''}</option>
          ))}
        </select>
        <IconButton
          icon={Plus}
          label="Gắn thẻ cho truyện"
          className="btn btn-p"
          style={{ flex: 'none', minWidth: 44 }}
          disabled={busy || !cardId}
          onClick={() => void act(() => wishCardService.addToStory(storyId, Number(cardId)))}
        />
      </div>
    </details>
  );
}
