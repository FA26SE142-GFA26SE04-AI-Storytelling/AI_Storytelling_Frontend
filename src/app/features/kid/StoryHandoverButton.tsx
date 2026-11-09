"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Lock, Star } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { childAccessService } from "@/app/services/childAccessService";
import { avatarOf } from "@/app/lib/guardian";
import { showToast } from "@/app/lib/toast";
import type { StoryHandoverOptions } from "@/app/types/supervision";

/**
 * Luồng 1c — "Cho bé đọc truyện này": hỏi Backend bé nào đọc được truyện (cùng luật với lúc bé mở truyện),
 * hiện từng bé kèm lý do nếu không đọc được, bé được gợi ý lên đầu. Chọn bé thì vào chế độ của bé và mở thẳng truyện.
 */
export default function StoryHandoverButton({ storyId, title, onKid }: { storyId: number; title: string; onKid?: (childId: number, storyId: number) => void }) {
  const [open, setOpen] = useState(false);
  if (!onKid) return null;
  return (
    <>
      <button className="btn btn-gold btn-c" onClick={() => setOpen(true)}><BookOpen className="ic" />Cho bé đọc ngay</button>
      {open && <HandoverDialog storyId={storyId} title={title} onClose={() => setOpen(false)} onPick={(childId) => { setOpen(false); onKid(childId, storyId); }} />}
    </>
  );
}

function HandoverDialog({ storyId, title, onClose, onPick }: { storyId: number; title: string; onClose: () => void; onPick: (childId: number) => void }) {
  const { children: kids } = useWorkspaceData();
  const [options, setOptions] = useState<StoryHandoverOptions | null>(null);
  // Giữ hàm đóng mới nhất mà không tải lại danh sách mỗi lần trang cha vẽ lại.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const controller = new AbortController();
    void childAccessService.storyHandoverOptions(storyId, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.success && r.data) setOptions(r.data);
      else { showToast(r.message, "err"); closeRef.current(); }
    });
    return () => controller.abort();
  }, [storyId]);

  // Bé được gợi ý lên đầu, rồi các bé đọc được, cuối cùng các bé chưa đọc được.
  const list = (options?.children ?? []).slice().sort((a, b) =>
    Number(b.childProfileId === options?.suggestedChildProfileId) - Number(a.childProfileId === options?.suggestedChildProfileId) || Number(b.canRead) - Number(a.canRead));

  return (
    <Dialog title={`Cho bé đọc “${title}”`} onClose={onClose}>
      {!options ? <p className="empty-line">Đang kiểm tra bé nào đọc được…</p>
        : list.length === 0 ? <p className="empty-line">Bạn chưa có hồ sơ bé nào.</p>
        : (
          <ul className="handover-list">
            {list.map((c) => {
              const suggested = c.childProfileId === options.suggestedChildProfileId;
              const avatar = avatarOf(kids.find((k) => k.id === c.childProfileId)?.avatarId ?? "").emoji;
              return (
                <li key={c.childProfileId}>
                  <button className={`handover-kid${suggested ? " suggested" : ""}`} disabled={!c.canRead} onClick={() => onPick(c.childProfileId)} title={c.canRead ? undefined : c.message ?? "Bé chưa đọc được truyện này"}>
                    <span className="av" aria-hidden>{avatar}</span>
                    <span className="grow">
                      <b>{c.nickname}</b>
                      {!c.canRead && <span className="handover-why"><Lock className="ic" aria-hidden />{c.message ?? "Chưa đọc được truyện này"}</span>}
                    </span>
                    {suggested && c.canRead && <span className="pill gold-pill"><Star className="ic" aria-hidden />Gợi ý</span>}
                    {c.canRead && <span className="handover-go" aria-hidden><BookOpen /></span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
    </Dialog>
  );
}
