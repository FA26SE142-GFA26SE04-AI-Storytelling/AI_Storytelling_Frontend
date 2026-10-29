"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye } from "lucide-react";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { ageLabel } from "@/app/lib/storyView";

/** Nút "Cho bé đọc": một bé thì mở luôn, nhiều bé thì chọn bé trước rồi mới mở chế độ đọc. */
export default function KidButton({ onKid }: { onKid: () => void }) {
  const { children: kids, child, selectChild } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const start = () => { if (kids.length > 1) setOpen((v) => !v); else onKid(); };
  const pick = (id: number) => { selectChild(id); setOpen(false); onKid(); };

  return (
    <div className="kid-pick" ref={boxRef}>
      <button className="btn btn-kid" onClick={start} disabled={kids.length === 0} aria-haspopup={kids.length > 1 ? "menu" : undefined} aria-expanded={kids.length > 1 ? open : undefined}>
        <Eye className="ic" />Cho bé đọc
      </button>
      {open && (
        <div className="kid-menu" role="menu" aria-label="Chọn bé để đọc">
          <p className="sub">Bé nào sẽ đọc?</p>
          {kids.map((k) => (
            <button key={k.id} role="menuitem" className={child?.id === k.id ? "on" : ""} onClick={() => pick(k.id)}>
              <span className="av">{k.nickname.trim().charAt(0).toUpperCase()}</span>
              <span className="grow">{k.nickname}<small>{ageLabel(k.ageBand)}</small></span>
              {child?.id === k.id && <Check className="ic" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
