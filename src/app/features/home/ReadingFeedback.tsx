"use client";
import { useEffect, useState } from "react";
import { parentReadingFeedbackService } from "@/app/services/childReadingService";
import type { PagedReadingFeedback } from "@/app/types/childReading";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "@/app/components/IconButton";

const FACE: Record<string, string> = { VeryLike: "😍", Like: "🙂", Neutral: "😐", Dislike: "🙁" };

/** Truyện con đã đọc xong, con cảm thấy thế nào và điểm câu đố tốt nhất (cần quyền ViewProgress). */
export default function ReadingFeedback({ childId, nickname, showResults }: { childId: number; nickname: string; showResults: boolean }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedReadingFeedback | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { setPage(1); }, [childId]);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void parentReadingFeedbackService.list(childId, page, 10, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setData(r.success ? r.data : null);
      if (!r.success) setError(r.message);
    });
    return () => controller.abort();
  }, [childId, page]);

  if (!data && !error) return null;
  return (
    <div className="dash-block wide">
      <h3>{nickname} đã đọc gì</h3>
      {error && <p className="notice err">{error}</p>}
      {data && !data.items.length && <p className="sub">{nickname} chưa đọc xong truyện nào.</p>}
      {data && data.items.length > 0 && (
        <table className="read-table">
          <thead><tr><th>Truyện</th><th>Đọc xong</th><th>Cảm nhận</th>{showResults && <th>Câu đố (tốt nhất)</th>}</tr></thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i.sessionId}>
                <td><b>{i.title}</b></td>
                <td>{i.completedAt ? new Date(i.completedAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td>{i.feeling ? <>{FACE[i.feeling] ?? ""} {i.feelingLabel ?? i.feeling}</> : <span className="sub">Chưa chọn</span>}</td>
                {showResults && <td>{i.quizTotalQuestions === 0 ? <span className="sub">Không có câu đố</span> : i.quizBestPercent == null ? <span className="sub">Chưa làm</span> : `${Math.round(i.quizBestPercent)}%`}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data && data.totalPages > 1 && (
        <div className="row">
          <IconButton icon={ChevronLeft} label="Trang trước" disabled={!data.hasPreviousPage} onClick={() => setPage((p) => p - 1)} />
          <span className="sub">Trang {data.pageIndex}/{data.totalPages}</span>
          <IconButton icon={ChevronRight} label="Trang sau" disabled={!data.hasNextPage} onClick={() => setPage((p) => p + 1)} />
        </div>
      )}
    </div>
  );
}
