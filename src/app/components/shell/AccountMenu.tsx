"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import type { MenuItem } from "./NavMenuButton";

/** Menu avatar: tên và email, các nhóm trang (mỗi nhóm cách nhau một vạch), rồi Đăng xuất. Dùng chung cho mọi vai trò. */
export default function AccountMenu<Id extends string>({ ws, onWs, groups }: { ws: Id; onWs: (id: Id) => void; groups: MenuItem<Id>[][] }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const name = user?.fullName || user?.username || "Tài khoản";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const inAccount = groups.some((g) => g.some((w) => w.id === ws));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="acc-pick" ref={boxRef}>
      <button className={`me-btn${inAccount ? " on" : ""}`} onClick={() => setOpen((v) => !v)} aria-label="Mở menu tài khoản" aria-haspopup="menu" aria-expanded={open} title={user?.email}>
        <span className="av me">{initial}</span>
      </button>
      {open && (
        <div className="acc-menu" role="menu" aria-label="Menu tài khoản">
          <div className="acc-who">
            <span className="av me">{initial}</span>
            <span className="grow"><b>{name}</b><small>{user?.email}</small></span>
          </div>
          {groups.filter((g) => g.length > 0).map((group, i) => (
            <div key={i} style={{ display: "contents" }}>
              <div className="acc-sep" />
              {group.map(({ id, label, icon: Icon }) => (
                <button key={id} role="menuitem" className={ws === id ? "on" : ""} aria-current={ws === id ? "page" : undefined} onClick={() => { setOpen(false); onWs(id); }}><Icon className="ic" />{label}</button>
              ))}
            </div>
          ))}
          <div className="acc-sep" />
          <button role="menuitem" className="danger" onClick={() => { setOpen(false); void logout(); }}><LogOut className="ic" />Đăng xuất</button>
        </div>
      )}
    </div>
  );
}
