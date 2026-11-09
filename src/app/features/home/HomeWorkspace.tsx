"use client";

import "./home.css";
import "./dashboard.css";
import "@/app/features/roadmap/roadmap.css";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, WandSparkles } from "lucide-react";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { childProfileService } from "@/app/services/childProfileService";
import { parentWishService } from "@/app/services/storyWishService";
import type { ParentWishDto } from "@/app/types/storyWish";
import type { TokenQuotaStatus } from "@/app/types/childProfile";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import Frog from "@/app/components/brand/Frog";
import { fmtDate } from "@/app/lib/guardian";
import { useMyRole } from "@/app/features/children/useMyRole";
import { useRiseIn } from "@/app/lib/motion";
import WishItem from "./WishItem";
import ReadingFeedback from "./ReadingFeedback";
import InProgressStories, { needsYouCount } from "./InProgressStories";
import ChildCard from "./ChildCard";
import AccountStats from "./AccountStats";
import { openChildCreate } from "@/app/features/children/childrenIntent";

/** Luồng 4 Bước 4.3c — Dashboard tổng quan của phụ huynh, đầu trang là "Con của tôi" (Luồng 1 Bước 1.9). */
export default function HomeWorkspace({ go }: WorkspaceProps) {
  const { children: kids, stories, reviewQueue, error } = useWorkspaceData();
  const child = kids[0] ?? null;
  // Mỗi bé chỉ còn một người quản lý: chủ hồ sơ làm được mọi việc.
  const isOwner = !!useMyRole(child)?.isOwner;
  const [wishes, setWishes] = useState<ParentWishDto[]>([]);
  const [quota, setQuota] = useState<TokenQuotaStatus | null>(null);
  const rootRef = useRiseIn<HTMLElement>(".dash-block", [child?.id]);

  const load = useCallback(async () => {
    if (!child) return;
    const [w, q] = await Promise.all([parentWishService.list(child.id), childProfileService.getTokenQuotaForChild(child.id)]);
    setWishes((w.data ?? []).filter((x) => x.status === "Pending"));
    setQuota(q.success ? q.data : null);
  }, [child]);
  useEffect(() => { void load(); }, [load]);

  if (!child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><Frog size={110} mood="think" /><b className="display">Chưa có hồ sơ bé</b><span>Tạo hồ sơ bé để bắt đầu tạo truyện.</span><button className="btn btn-p" onClick={() => openChildCreate(go)}>Thêm hồ sơ bé</button></div></div>
      </section>
    );
  }

  const actionCount = (isOwner ? reviewQueue.length + wishes.length : 0) + needsYouCount(stories);

  return (
    <section ref={rootRef} className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
      <div className="pane dash">
        {error && <div className="err-banner" role="alert">{error}</div>}

        <div className="dash-body">
          <h1 className="sr-only">Tổng quan</h1>

          {/* Tất cả các con, mỗi bé một thẻ gọn. Bấm thẻ để mở hồ sơ của bé. */}
          <section className="kc-row" aria-label="Các con">
            {kids.map((k) => (
              <ChildCard key={k.id} child={k} onOpenProfile={() => go("children")} />
            ))}
          </section>

            <>
              <div className="continue">
                {/* Hai lối tắt: Thư viện truyện và Studio tạo truyện */}
                <button className="cont" onClick={() => go("library")}>
                  <span className="thumb cover" style={{ background: "linear-gradient(170deg, var(--primary), color-mix(in srgb, var(--primary) 40%, var(--paper)))" }} />
                  <span className="grow">
                    <small>Thư viện truyện</small><b className="display">Xem tất cả truyện</b>
                    <small>{stories.length ? `${stories.length} truyện · ${stories.filter((s) => s.tone === "ok").length} đã duyệt` : "Lọc, xem trước như bé thấy, thêm vào lộ trình"}</small>
                  </span>
                  <span className="go" aria-hidden><BookOpen className="ic" /></span>
                </button>
                <button className="cont" onClick={() => go("studio")}>
                  <span className="thumb cover" style={{ background: "linear-gradient(170deg, var(--lotus-deep), color-mix(in srgb, var(--lotus) 45%, var(--paper)))" }} />
                  <span className="grow">
                    <small>Studio tạo truyện</small><b className="display">Tạo truyện mới</b><small>Mô tả ý tưởng, AI sẽ viết cùng bạn</small>
                    {quota && !quota.isUnlimited && (
                      <span className="quota" title={quota.periodEnd ? `Làm mới ${fmtDate(quota.periodEnd)}` : undefined}>
                        <span className="quota-bar" aria-hidden><i style={{ width: `${Math.min(100, ((quota.remaining ?? 0) / Math.max(1, quota.quotaLimit ?? 1)) * 100)}%` }} /></span>
                        <small>Còn {quota.remaining ?? 0}/{quota.quotaLimit ?? "?"} lượt</small>
                      </span>
                    )}
                  </span>
                  <span className="go" aria-hidden><WandSparkles className="ic" /></span>
                </button>
              </div>

              <div className="dash-grid">
                {/* Cần xử lý */}
                <div className="dash-block wide">
                  <h3>Cần xử lý <span className="pill wait">{actionCount}</span></h3>
                  {actionCount === 0 && <p className="sub">Không có việc gì cần xử lý.</p>}
                  {isOwner && reviewQueue.map((s) => (
                    <button key={s.id} className="mini-item" onClick={() => go("review")}><span className="cover-sm" style={{ background: s.cover }} /><span className="grow" style={{ textAlign: "left" }}><b>{s.title}</b><small>Truyện chờ duyệt</small></span></button>
                  ))}
                  {isOwner && wishes.map((w) => <WishItem key={w.wishId} wish={w} nickname={child.nickname} go={go} onChanged={() => void load()} />)}
                </div>

                <InProgressStories stories={stories} go={go} />

                {/* Truyện con đã đọc xong, cảm nhận và điểm câu đố */}
                {isOwner && <ReadingFeedback childId={child.id} nickname={child.nickname} showResults />}

                {/* Thống kê của tài khoản: luôn ở cuối trang */}
                <AccountStats kids={kids} stories={stories} quota={quota} />
              </div>
            </>
        </div>
      </div>
    </section>
  );
}
