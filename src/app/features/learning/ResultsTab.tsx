"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Pager from "@/app/components/Pager";
import Frog from "@/app/components/brand/Frog";
import { showToast } from "@/app/lib/toast";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ParentReadingFeedbackItem, ReadingFeedbackFilter } from "@/app/types/childReading";
import { useStoryCovers } from "@/app/features/roadmap/roadmapData";
import { useReadingFeedback } from "./learningData";
import ReadingFilters from "./ReadingFilters";
import ReadingOverview from "./ReadingOverview";
import StoryTile from "./StoryTile";
import SessionDetail from "./SessionDetail";

const PAGE = 24;

/** Gộp các lần đọc cùng một truyện (trong trang đang xem), giữ thứ tự lần đọc mới nhất của mỗi truyện. */
const byStory = (items: ParentReadingFeedbackItem[]) => {
  const groups = new Map<number, ParentReadingFeedbackItem[]>();
  for (const i of items) groups.set(i.storyId, [...(groups.get(i.storyId) ?? []), i]);
  return [...groups.values()];
};

/** Tab "Kết quả đọc": truyện bé đã đọc xong (hoặc đang đọc dở). */
export default function ResultsTab({ child }: { child: ChildProfile }) {
  const [filter, setFilter] = useState<ReadingFeedbackFilter>({ status: "Completed", range: "all" });
  const [page, setPage] = useState(1);

  const changeFilter = (v: ReadingFeedbackFilter) => {
    setFilter(v);
    setPage(1);
    setOpenStory(null);
  };

  const feedback = useReadingFeedback(child.id, page, PAGE, filter);

  useEffect(() => {
    if (feedback.error) showToast(feedback.error, "err");
  }, [feedback.error]);

  const fb = feedback.data;
  // Bìa tra như tab Tổng quan / Lộ trình: truyện cộng đồng rồi GET /Story/{id} (không chỉ truyện của phụ huynh).
  // Chỉ một ô mở cột lần đọc: mở ô khác thì ô cũ tự đóng; bấm lại ô đang mở thì đóng.
  const [openStory, setOpenStory] = useState<number | null>(null);
  const cover = useStoryCovers([...new Set((fb?.items ?? []).map((i) => i.storyId))]);

  const emptyText =
    (filter.status === "Completed"
      ? `${child.nickname} chưa đọc xong truyện nào`
      : "Không có truyện nào đang đọc dở") +
    (filter.range !== "all" ? " trong khoảng này" : "");

  // Lần đọc đang xem: thay cả tab bằng trang chi tiết; quay lại thì về đúng chỗ cuộn của danh sách.
  const [session, setSession] = useState<ParentReadingFeedbackItem | null>(null);
  const boxRef = useRef<HTMLElement>(null);
  const savedScroll = useRef<number | null>(null);
  const openSession = (item: ParentReadingFeedbackItem) => {
    savedScroll.current = boxRef.current?.closest(".pb")?.scrollTop ?? 0;
    setSession(item);
  };
  useLayoutEffect(() => {
    const pb = boxRef.current?.closest(".pb");
    if (pb && savedScroll.current != null) pb.scrollTop = session ? 0 : savedScroll.current;
  }, [session]);

  if (session) {
    return (
      <div ref={boxRef as React.RefObject<HTMLDivElement>}>
        <SessionDetail item={session} childId={child.id} nickname={child.nickname} onBack={() => setSession(null)} />
      </div>
    );
  }

  return (
    <>
      <ReadingFilters value={filter} onChange={changeFilter} />
      <ReadingOverview childId={child.id} range={filter.range} />

      <section ref={boxRef} className="lr-card">
        <div className="lr-card-h">
          <h3 className="display">
            {filter.status === "Completed" ? "Truyện đã đọc xong" : "Truyện chưa đọc xong"}
          </h3>
          {fb && <span className="pill ok">{fb.totalCount} lần đọc</span>}
        </div>
        {!fb ? (
          <p className="sub">{feedback.error ? "" : "Đang tải…"}</p>
        ) : fb.items.length === 0 ? (
          <div className="lr-empty">
            <Frog size={72} mood="think" />
            <b>{emptyText}</b>
          </div>
        ) : (
          <div className={feedback.loading ? "lr-fade" : undefined}>
            <div className="lr-grid">
              {byStory(fb.items).map((g) => (
                <StoryTile
                  key={g[0].storyId}
                  items={g}
                  cover={cover(g[0].storyId)}
                  open={openStory === g[0].storyId}
                  onToggle={() => setOpenStory((v) => (v === g[0].storyId ? null : g[0].storyId))}
                  onSelect={openSession}
                />
              ))}
            </div>
          </div>
        )}
        {fb && (
          <Pager
            page={fb.pageIndex}
            totalPages={fb.totalPages}
            hasPrev={fb.hasPreviousPage}
            hasNext={fb.hasNextPage}
            onPage={(p) => { setPage(p); setOpenStory(null); }}
          />
        )}
      </section>
    </>
  );
}
