"use client";

import "@/app/features/review/review-tools.css";
import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { subscribeChooseChild, type ChooseChildRequest } from "@/app/lib/chooseChild";
import { avatarOf } from "@/app/lib/guardian";
import { ageLabel } from "@/app/lib/storyView";

/** Hiển thị hộp chọn bé cho chooseChild(); bé do mình quản lý chính xếp trước. */
export default function ChildPickerHost() {
  const { children: kids } = useWorkspaceData();
  const meId = useAuth().user?.id ?? -1;
  const [req, setReq] = useState<ChooseChildRequest | null>(null);

  useEffect(() => subscribeChooseChild((r) => {
    const options = kids.filter((k) => !r.filter || r.filter(k));
    if (options.length === 1) { r.resolve(options[0]); return; }
    setReq(r);
  }), [kids]);

  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { req.resolve(null); setReq(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [req]);

  if (!req) return null;
  const close = (pick: (typeof kids)[number] | null) => { req.resolve(pick); setReq(null); };
  const options = kids.filter((k) => !req.filter || req.filter(k))
    .sort((a, b) => Number(b.ownerUserId === meId) - Number(a.ownerUserId === meId));

  return (
    <div className="dlg-backdrop confirm-backdrop" role="dialog" aria-modal="true" aria-label={req.title} onClick={(e) => { if (e.target === e.currentTarget) close(null); }}>
      <div className="dlg kid-pick-dlg">
        <div className="row"><b className="display grow" style={{ fontSize: 18 }}>{req.title}</b><button className="btn btn-g" aria-label="Đóng" onClick={() => close(null)}><X className="ic" /></button></div>
        {options.length === 0 ? <p className="sub">Chưa có bé nào phù hợp.</p> : (
          <div className="kid-pick-list">
            {options.map((k) => (
              <button key={k.id} type="button" className="kid-pick" onClick={() => close(k)}>
                <span className="av" aria-hidden>{avatarOf(k.avatarId).emoji}</span>
                <span className="grow"><b>{k.nickname}{k.ownerUserId === meId && <Crown className="ic kid-pick-owner" aria-label="Bạn là người quản lý chính" />}</b><small>{ageLabel(k.ageBand)}</small></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
