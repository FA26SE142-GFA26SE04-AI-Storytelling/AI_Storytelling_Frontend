"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Sparkles, WandSparkles } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import { showToast } from "@/app/lib/toast";
import { parentWishService } from "@/app/services/storyWishService";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import type { ChildProfile } from "@/app/types/childProfile";
import type { AIStoryInputProgressDto } from "@/app/types/aiStory";
import type { ParentWishDto } from "@/app/types/storyWish";
import WishItem, { wishLabel } from "./WishItem";

/** Tab "Điều ước": điều ước bé gửi đang chờ bố mẹ xử lý, và điều ước đang được làm thành truyện mới. */
export default function WishesTab({ child, wishes, making, error, canEdit, go, onChanged }: {
  child: ChildProfile;
  wishes: ParentWishDto[] | null;
  making: ParentWishDto[];
  error: string;
  canEdit: boolean;
  go: WorkspaceProps["go"];
  onChanged: () => void;
}) {
  useEffect(() => { if (error) showToast(error, "err"); }, [error]);
  return (
    <>
      <section className="lr-card">
        <div className="lr-card-h"><h3 className="display">Điều ước đang chờ</h3>{wishes && <span className="pill wait">{wishes.length}</span>}</div>
        {!wishes ? <p className="sub">{error ? "" : "Đang tải…"}</p>
          : wishes.length === 0 ? (
            <div className="lr-empty"><Frog size={72} mood="happy" /><b>{child.nickname} chưa có điều ước nào đang chờ</b></div>
          ) : (
            <div className="lr-list">
              {wishes.map((w) => canEdit
                ? <WishItem key={w.wishId} wish={w} nickname={child.nickname} go={go} onChanged={onChanged} />
                : <div key={w.wishId} className="wish-row"><b>{wishLabel(w)}</b></div>)}
            </div>
          )}
      </section>

      {making.length > 0 && (
        <section className="lr-card">
          <div className="lr-card-h"><h3 className="display">Đang tạo truyện</h3><span className="pill draft">{making.length}</span></div>
          <div className="lr-list">{making.map((w) => <WishMaking key={w.wishId} wish={w} go={go} onDone={onChanged} />)}</div>
        </section>
      )}
    </>
  );
}

/** Trạng thái tạo truyện từ điều ước, theo inputStatus của luồng tạo truyện AI. */
function makingState(p: AIStoryInputProgressDto | null): { label: string; tone: string; done: boolean } {
  if (!p) return { label: "Đang kiểm tra…", tone: "draft", done: false };
  switch (p.inputStatus) {
    case "input_accepted": return { label: "AI đang viết truyện", tone: "wait", done: true };
    case "input_blocked": return { label: "Ý tưởng bị chặn", tone: "flag", done: true };
    case "input_check_failed": return { label: "Chưa kiểm tra được ý tưởng", tone: "flag", done: true };
    default: return { label: "Đang kiểm tra ý tưởng", tone: "wait", done: false };
  }
}

/**
 * Một điều ước đang được làm thành truyện mới: lấy lại điều ước (GET /parent/wishes/{id}) và tiến độ tạo truyện
 * (GET /parent/wishes/{id}/generation); khi còn đang kiểm tra ý tưởng thì 15 giây cập nhật một lần.
 * Bấm "Mở trong Studio" để duyệt dàn ý / truyện như mọi truyện AI khác.
 */
function WishMaking({ wish, go, onDone }: { wish: ParentWishDto; go: WorkspaceProps["go"]; onDone: () => void }) {
  const [current, setCurrent] = useState(wish);
  const [progress, setProgress] = useState<AIStoryInputProgressDto | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([parentWishService.get(wish.wishId, controller.signal), parentWishService.generation(wish.wishId, controller.signal)]).then(([d, g]) => {
      if (controller.signal.aborted) return;
      if (d.success && d.data) {
        setCurrent(d.data.wish);
        // Điều ước đã xong (có truyện) hoặc không còn ở trạng thái đang tạo: tải lại danh sách để chuyển nhóm.
        if (d.data.wish.status !== "Accepted") onDone();
      }
      if (g.success && g.data) setProgress(g.data);
    });
    return () => controller.abort();
  }, [wish.wishId, tick, onDone]);
  const state = makingState(progress);
  useEffect(() => {
    if (state.done) return;
    const id = window.setTimeout(() => setTick((t) => t + 1), 15000);
    return () => window.clearTimeout(id);
  }, [state.done, tick]);

  const storyId = current.generatedStoryId ?? progress?.storyId ?? null;
  return (
    <div className="wish-row">
      <div className="wish-row-h">
        <Sparkles className="ic" aria-hidden />
        <b className="grow">{wishLabel(current)}</b>
        <span className={`pill ${state.tone}`}>{state.label}</span>
      </div>
      {progress?.fallbackMessage && state.tone === "flag" && <p className="notice warn">{progress.fallbackMessage}</p>}
      <div className="wish-actions">
        {storyId != null && <button className="btn btn-p" onClick={() => go("studio", { storyId })}>
          {state.tone === "flag" ? <WandSparkles className="ic" /> : <BookOpenCheck className="ic" />}Mở trong Studio
        </button>}
      </div>
    </div>
  );
}
