"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Ticket } from "lucide-react";
import { guardianService } from "@/app/services/guardianService";
import { supervisionService } from "@/app/services/supervisionService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { AppNotification } from "@/app/types/progress";
import type { OwnershipTransfer } from "@/app/types/supervision";
import type { WorkspaceId } from "@/app/components/shell/nav";
import { fmtDateTime } from "@/app/lib/guardian";
import { isUnread, notificationKey } from "@/app/lib/notifications";

/**
 * Luồng 4 Bước 4.3c — khối "Cần xử lý": đề nghị chuyển quyền Owner gửi tới mình (xử lý ngay)
 * và lời mời giám sát mới (thông báo `SupervisionInvite`, không gắn với bé đang chọn).
 */
export function useSupervisionTodos(child: ChildProfile | null, meId: number) {
  const [transfers, setTransfers] = useState<OwnershipTransfer[]>([]);
  const [invites, setInvites] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    if (!child) { setTransfers([]); setInvites([]); return; }
    const [tr, notes] = await Promise.all([supervisionService.listOwnershipTransfers(child.id), guardianService.notifications()]);
    setTransfers((tr.data ?? []).filter((t) => t.status === "Pending" && t.targetSupervisorUserId === meId));
    setInvites((notes.data ?? []).filter((n) => isUnread(n) && notificationKey(n.type) === "supervision_invite"));
  }, [child, meId]);
  useEffect(() => { void load(); }, [load]);

  return { transfers, invites, count: transfers.length + invites.length, reload: load };
}

export default function SupervisionTodos({ child, todos, go, onOwnerChanged }: {
  child: ChildProfile;
  todos: ReturnType<typeof useSupervisionTodos>;
  go: (id: WorkspaceId) => void;
  onOwnerChanged: () => void;
}) {
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const answer = async (t: OwnershipTransfer, accept: boolean) => {
    setBusy(true);
    setNote(null);
    const r = await supervisionService.answerOwnershipTransfer(t.id, accept);
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? (accept ? "Bạn đã là người quản lý chính." : "Đã từ chối đề nghị.") : r.message || "Chưa xử lý được." });
    if (r.success) { onOwnerChanged(); void todos.reload(); }
  };

  const openInvite = async (n: AppNotification) => {
    await guardianService.markNotificationRead(n);
    go("children");
  };

  return (
    <>
      {todos.transfers.map((t) => (
        <div key={`tr-${t.id}`} className="mini-item">
          <Crown className="ic" />
          <span className="grow" style={{ textAlign: "left" }}><b>Đề nghị chuyển quyền quản lý chính của {child.nickname} cho bạn</b><small>Nhận quyền thì bạn quản lý hồ sơ, cài đặt an toàn và người giám sát của bé</small></span>
          <button className="btn btn-ok" disabled={busy} onClick={() => void answer(t, true)}>Nhận quyền</button>
          <button className="btn btn-s" disabled={busy} onClick={() => void answer(t, false)}>Từ chối</button>
        </div>
      ))}
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
      {todos.invites.map((n) => (
        <button key={`inv-${n.id}`} className="mini-item" onClick={() => void openInvite(n)}>
          <Ticket className="ic" />
          <span className="grow" style={{ textAlign: "left" }}><b>Bạn được mời cùng giám sát một bé</b><small>Mở Hồ sơ bé → Nhập mã mời, dùng mã trong email ({fmtDateTime(n.createdAt)})</small></span>
        </button>
      ))}
    </>
  );
}
