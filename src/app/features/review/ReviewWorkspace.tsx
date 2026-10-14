"use client";

import "./review.css";
import { useState } from "react";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import Frog from "@/app/components/brand/Frog";
import { ageLabel } from "@/app/lib/storyView";
import type { WorkspaceId } from "@/app/components/shell/nav";
import { useRiseIn, usePop } from "@/app/lib/motion";
import ReviewGate from "./ReviewGate";

export default function ReviewWorkspace({ go }: { go: (id: WorkspaceId) => void }) {
  const { reviewQueue, reload, storiesLoading } = useWorkspaceData();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const queueRef = useRiseIn<HTMLDivElement>(".queue-item", [reviewQueue.length]);
  const toastRef = usePop<HTMLDivElement>(toast);
  const active = reviewQueue.find((s) => s.id === activeId) ?? reviewQueue[0];

  const done = (msg: string) => {
    setToast(msg);
    setActiveId(null);
    void reload();
    setTimeout(() => setToast(""), 3200);
  };

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "250px 1fr 300px" }}>
      <div className="pane">
        <div className="ph"><span>Hàng chờ duyệt</span><div className="act"><span className="pill wait">{reviewQueue.length} truyện</span></div></div>
        <div ref={queueRef} className="pb" style={{ gap: 7 }}>
          {reviewQueue.map((s) => (
            <button key={s.id} className={`queue-item${active?.id === s.id ? " on" : ""}`} onClick={() => setActiveId(s.id)}>
              <span className="cover-sm" style={{ background: s.gradient }} />
              <span><b>{s.title}</b><small>{s.by} · {ageLabel(s.ageBand)}</small></span>
            </button>
          ))}
          {!storiesLoading && reviewQueue.length === 0 && <p className="sub">Không có truyện nào đang chờ duyệt.</p>}
        </div>
      </div>

      {active ? (
        <ReviewGate key={active.id} storyId={active.id}
          onApproved={() => done("Đã duyệt, hệ thống đang tạo minh hoạ và giọng đọc")}
          onArchived={() => done("Đã lưu trữ truyện")} />
      ) : (
        <>
          <div className="review-doc">
            <div className="done-state">
              <Frog size={110} mood="happy" />
              <b className="display">Đã xử lý hết hàng chờ</b>
              <span>Truyện mới sẽ xuất hiện ở đây khi AI viết xong và chờ bạn duyệt.</span>
              <button className="btn btn-s" onClick={() => go("studio")}>Tạo truyện mới</button>
            </div>
          </div>
          <div className="pane" />
        </>
      )}
      {toast && <div ref={toastRef} className="toast" role="status">{toast}</div>}
    </section>
  );
}
