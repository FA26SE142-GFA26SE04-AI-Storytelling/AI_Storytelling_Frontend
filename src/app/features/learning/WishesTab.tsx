"use client";

import { useEffect } from "react";
import Frog from "@/app/components/brand/Frog";
import { showToast } from "@/app/lib/toast";
import type { WorkspaceId } from "@/app/components/shell/nav";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ParentWishDto } from "@/app/types/storyWish";
import WishItem from "./WishItem";

/** Tab "Điều ước": các điều ước bé gửi đang chờ bố mẹ chọn truyện có sẵn, tạo truyện mới hoặc từ chối. */
export default function WishesTab({ child, wishes, error, canEdit, go, onChanged }: {
  child: ChildProfile;
  wishes: ParentWishDto[] | null;
  error: string;
  canEdit: boolean;
  go: (id: WorkspaceId) => void;
  onChanged: () => void;
}) {
  useEffect(() => { if (error) showToast(error, "err"); }, [error]);
  return (
    <section className="lr-card">
      <div className="lr-card-h"><h3 className="display">Điều ước đang chờ</h3>{wishes && <span className="pill wait">{wishes.length}</span>}</div>
      {!wishes ? <p className="sub">{error ? "" : "Đang tải…"}</p>
        : wishes.length === 0 ? (
          <div className="lr-empty"><Frog size={72} mood="happy" /><b>{child.nickname} chưa có điều ước nào đang chờ</b></div>
        ) : (
          <div className="lr-list">
            {wishes.map((w) => canEdit
              ? <WishItem key={w.wishId} wish={w} nickname={child.nickname} go={go} onChanged={onChanged} />
              : <div key={w.wishId} className="wish-row"><b>{w.cards.map((c) => c.label).join(" · ") || "Điều ước của bé"}</b></div>)}
          </div>
        )}
    </section>
  );
}
