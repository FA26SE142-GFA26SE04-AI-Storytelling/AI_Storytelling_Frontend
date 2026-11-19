"use client";

import { useEffect, useState } from "react";
import Pager from "@/app/components/Pager";
import Frog from "@/app/components/brand/Frog";
import { showToast } from "@/app/lib/toast";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ParentReadingFeedbackItem, ReadingFeedbackFilter } from "@/app/types/childReading";
import { useReadingFeedback } from "./learningData";
import ReadingFilters from "./ReadingFilters";
import ReadingOverview from "./ReadingOverview";
import StoryTile from "./StoryTile";

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
  };

  const feedback = useReadingFeedback(child.id, page, PAGE, filter);

  useEffect(() => {
    if (feedback.error) showToast(feedback.error, "err");
  }, [feedback.error]);

  const fb = feedback.data;

  const emptyText =
    (filter.status === "Completed"
      ? `${child.nickname} chưa đọc xong truyện nào`
      : "Không có truyện nào đang đọc dở") +
    (filter.range !== "all" ? " trong khoảng này" : "");

  return (
    <>
      <ReadingFilters value={filter} onChange={changeFilter} />
      <ReadingOverview childId={child.id} range={filter.range} />

      <section className="lr-card">
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
                  childId={child.id}
                  nickname={child.nickname}
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
            onPage={setPage}
          />
        )}
      </section>
    </>
  );
}
