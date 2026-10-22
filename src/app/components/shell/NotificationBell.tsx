"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { guardianService } from "@/app/services/guardianService";
import type { AppNotification } from "@/app/types/progress";
import type { WorkspaceId } from "@/app/components/shell/nav";
import { fmtDateTime } from "@/app/lib/guardian";
import { isUnread, notificationTarget, notificationText } from "@/app/lib/notifications";
import { subscribeNotifications } from '@/app/services/notificationRealtime';
import { useAuth } from '@/app/context/AuthContext';

/**
 * Chuông thông báo (Luồng 1 Phụ lục A, Luồng 4). Hỏi số chưa đọc mỗi phút; số tăng hoặc mở chuông thì tải lại danh sách.
 * `onOpen` (khu phụ huynh): bấm thông báo thì đánh dấu đã đọc và mở màn liên quan.
 */
export default function NotificationBell({ onOpen }: { onOpen?: (ws: WorkspaceId) => void }) {
  const {user,accessToken}=useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(-1);

  const load = useCallback(async () => {
    const r = await guardianService.notifications();
    if (r.success) {
      const list = r.data ?? [];
      setItems(list);
      lastCount.current = list.filter(isUnread).length;
      setCount(lastCount.current);
    }
  }, []);

  const poll = useCallback(async () => {
    const n = await guardianService.unreadNotificationCount();
    if (n === null) return;
    setCount(n);
    if (n > lastCount.current) void load();
    lastCount.current = n;
  }, [load]);
  useEffect(()=>{
    if(!user||!accessToken)return;
    return subscribeNotifications(()=>void load());
  },[user?.id,accessToken,load,user]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void poll(), 60_000);
    return () => clearInterval(t);
  }, [load, poll]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const pick = async (n: AppNotification) => {
    if (isUnread(n)) await guardianService.markNotificationRead(n);
    const target = notificationTarget(n);
    if (onOpen && target) { setOpen(false); onOpen(target); }
    void load();
  };

  const remove = async (n: AppNotification) => {
    const r = await guardianService.deleteNotification(n);
    if (r.success) void load();
  };

  return (
    <div className="notif" ref={boxRef}>
      <button className="btn btn-g" aria-label={`Thông báo${count ? `, ${count} chưa đọc` : ""}`} aria-expanded={open} onClick={() => { setOpen(!open); if (!open) void load(); }}>
        <Bell className="ic" />{count > 0 && <span className="notif-dot">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Thông báo">
          <div className="row"><b className="grow">Thông báo</b>{count > 0 && <button className="btn btn-g" onClick={() => void guardianService.markAllNotificationsRead().then(load)}>Đọc hết</button>}</div>
          {items.length === 0 && <p className="sub">Chưa có thông báo.</p>}
          <ul>
            {items.slice(0, 30).map((n) => (
              <li key={`${n.id}-${n.createdAt}`} className={isUnread(n) ? "unread" : ""}>
                <button onClick={() => void pick(n)}>
                  <span>{notificationText(n)}</span><small>{fmtDateTime(n.createdAt)}</small>
                </button>
                <button className="notif-del" aria-label="Xoá thông báo" title="Xoá" onClick={() => void remove(n)}><X size={14} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
